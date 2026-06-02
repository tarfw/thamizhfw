import { useEffect, useState, useCallback, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { loadSession } from "./bluesky-auth";
import * as chat from "./bsky-chat";
import type {
  AnyMessage,
  ConvoView,
  LogEntry,
  MessageView,
  ProfileBasic,
} from "./bsky-chat";

const POLL_INTERVAL_MS = 3000;

type Me = { did: string; handle: string };

type State = {
  ready: boolean;
  me: Me | null;
  convos: ConvoView[] | null;
  messages: Record<string, AnyMessage[] | undefined>;
  messageCursors: Record<string, string | null | undefined>;
  profiles: Record<string, ProfileBasic>;
  error: string | null;
};

let state: State = {
  ready: false,
  me: null,
  convos: null,
  messages: {},
  messageCursors: {},
  profiles: {},
  error: null,
};

let logCursor: string | null = null;
let pollHandle: ReturnType<typeof setInterval> | null = null;
let appStateSub: ReturnType<typeof AppState.addEventListener> | null = null;
let initStarted = false;
let initPromise: Promise<void> | null = null;
let activeConvoId: string | null = null;

const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

function setState(updater: (s: State) => State) {
  state = updater(state);
  notify();
}

function indexProfiles(profiles: ProfileBasic[] | undefined) {
  if (!profiles || profiles.length === 0) return;
  setState((s) => {
    let changed = false;
    const next = { ...s.profiles };
    for (const p of profiles) {
      if (!p?.did) continue;
      if (next[p.did]?.handle !== p.handle || next[p.did]?.avatar !== p.avatar) {
        next[p.did] = { ...next[p.did], ...p };
        changed = true;
      } else {
        next[p.did] = { ...next[p.did], ...p };
      }
    }
    return changed ? { ...s, profiles: next } : s;
  });
}

async function initialize(): Promise<void> {
  if (initPromise) return initPromise;
  if (initStarted) return;
  initStarted = true;

  initPromise = (async () => {
    try {
      const session = await loadSession();
      if (!session) {
        setState((s) => ({ ...s, ready: true }));
        return;
      }
      setState((s) => ({
        ...s,
        me: { did: session.did, handle: session.handle },
      }));

      try {
        const { convos } = await chat.listConvos({ limit: 50 });
        for (const c of convos) indexProfiles(c.members);
        setState((s) => ({ ...s, convos, ready: true, error: null }));
      } catch (e: any) {
        setState((s) => ({
          ...s,
          ready: true,
          error: e?.message ?? "Failed to load conversations",
        }));
      }

      try {
        const { cursor } = await chat.getLog();
        logCursor = cursor ?? null;
      } catch {}

      startPolling();
      attachAppState();
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

function attachAppState() {
  if (appStateSub) return;
  appStateSub = AppState.addEventListener("change", (s: AppStateStatus) => {
    if (s === "active") startPolling();
    else stopPolling();
  });
}

function startPolling() {
  if (pollHandle) return;
  pollHandle = setInterval(() => {
    poll().catch(() => {});
  }, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
}

async function poll() {
  try {
    const { logs, cursor } = await chat.getLog(logCursor ?? undefined);
    if (cursor) logCursor = cursor;
    if (logs.length) await applyLogs(logs);
  } catch (e: any) {
    if (e?.status === 401) {
      stopPolling();
    }
  }
}

async function applyLogs(logs: LogEntry[]) {
  let needsRefresh = false;
  const seenConvos = new Set<string>();

  setState((s) => {
    let convos = s.convos ?? [];
    let messages = s.messages;
    let profiles = s.profiles;

    for (const log of logs) {
      if (log.relatedProfiles) {
        for (const p of log.relatedProfiles) {
          if (p?.did) profiles = { ...profiles, [p.did]: { ...profiles[p.did], ...p } };
        }
      }

      const t = log.$type ?? "";
      const cid = log.convoId;

      if (!cid) continue;
      seenConvos.add(cid);

      if (t.endsWith("#logCreateMessage") && log.message) {
        const msg = log.message;
        const existing = messages[cid] ?? [];
        if (!existing.some((m) => m.id === msg.id)) {
          messages = { ...messages, [cid]: [msg, ...existing] };
        }
        const idx = convos.findIndex((c) => c.id === cid);
        if (idx >= 0) {
          const updated: ConvoView = {
            ...convos[idx],
            lastMessage: msg,
            rev: log.rev,
            unreadCount:
              activeConvoId === cid ||
              (chat.isMessageView(msg) && msg.sender.did === state.me?.did)
                ? convos[idx].unreadCount
                : convos[idx].unreadCount + 1,
          };
          convos = [updated, ...convos.filter((c) => c.id !== cid)];
        } else {
          needsRefresh = true;
        }
      } else if (t.endsWith("#logDeleteMessage") && log.message) {
        const m = log.message;
        const existing = messages[cid] ?? [];
        messages = {
          ...messages,
          [cid]: existing.map((x) => (x.id === m.id ? m : x)),
        };
      } else if (
        t.endsWith("#logBeginConvo") ||
        t.endsWith("#logAcceptConvo") ||
        t.endsWith("#logLeaveConvo") ||
        t.endsWith("#logAddMember") ||
        t.endsWith("#logRemoveMember") ||
        t.endsWith("#logMemberJoin") ||
        t.endsWith("#logMemberLeave") ||
        t.endsWith("#logEditGroup") ||
        t.endsWith("#logLockConvo") ||
        t.endsWith("#logUnlockConvo")
      ) {
        needsRefresh = true;
      } else if (t.endsWith("#logReadConvo") && cid) {
        const idx = convos.findIndex((c) => c.id === cid);
        if (idx >= 0) {
          convos = convos.map((c) =>
            c.id === cid ? { ...c, unreadCount: 0 } : c
          );
        }
      }
    }
    return { ...s, convos, messages, profiles };
  });

  if (needsRefresh) {
    await refreshConvos();
  }
}

async function refreshConvos(): Promise<void> {
  try {
    const { convos } = await chat.listConvos({ limit: 50 });
    for (const c of convos) indexProfiles(c.members);
    setState((s) => ({ ...s, convos, error: null }));
  } catch (e: any) {
    setState((s) => ({ ...s, error: e?.message ?? "Failed to refresh" }));
  }
}

async function loadMessages(convoId: string, force = false): Promise<void> {
  if (!force && state.messages[convoId] !== undefined) return;
  try {
    const { messages, cursor, relatedProfiles } = await chat.getMessages({
      convoId,
      limit: 50,
    });
    indexProfiles(relatedProfiles);
    setState((s) => ({
      ...s,
      messages: { ...s.messages, [convoId]: messages },
      messageCursors: { ...s.messageCursors, [convoId]: cursor ?? null },
    }));
  } catch (e: any) {
    setState((s) => ({ ...s, error: e?.message ?? "Failed to load messages" }));
  }
}

async function loadOlderMessages(convoId: string): Promise<void> {
  const cursor = state.messageCursors[convoId];
  if (cursor === null || cursor === undefined) return;
  try {
    const {
      messages,
      cursor: nextCursor,
      relatedProfiles,
    } = await chat.getMessages({ convoId, limit: 50, cursor });
    indexProfiles(relatedProfiles);
    setState((s) => {
      const existing = s.messages[convoId] ?? [];
      const seen = new Set(existing.map((m) => m.id));
      const merged = [...existing, ...messages.filter((m) => !seen.has(m.id))];
      return {
        ...s,
        messages: { ...s.messages, [convoId]: merged },
        messageCursors: { ...s.messageCursors, [convoId]: nextCursor ?? null },
      };
    });
  } catch {}
}

async function sendMessage(convoId: string, text: string): Promise<MessageView> {
  const msg = await chat.sendMessage({ convoId, text });
  setState((s) => {
    const existing = s.messages[convoId] ?? [];
    if (existing.some((m) => m.id === msg.id)) return s;
    const messages = { ...s.messages, [convoId]: [msg, ...existing] };
    const convos = (s.convos ?? []).map((c) =>
      c.id === convoId ? { ...c, lastMessage: msg, rev: msg.rev } : c
    );
    return { ...s, messages, convos };
  });
  return msg;
}

async function markRead(convoId: string, messageId?: string): Promise<void> {
  setState((s) => ({
    ...s,
    convos: (s.convos ?? []).map((c) =>
      c.id === convoId ? { ...c, unreadCount: 0 } : c
    ),
  }));
  try {
    await chat.updateRead({ convoId, messageId });
  } catch {}
}

async function openDM(did: string): Promise<string> {
  const { convo } = await chat.getConvoForMembers([did]);
  indexProfiles(convo.members);
  setState((s) => {
    const existing = s.convos ?? [];
    const idx = existing.findIndex((c) => c.id === convo.id);
    const convos =
      idx >= 0
        ? existing.map((c) => (c.id === convo.id ? convo : c))
        : [convo, ...existing];
    return { ...s, convos };
  });
  return convo.id;
}

async function createGroup(
  name: string,
  members: string[]
): Promise<string> {
  const { convo } = await chat.createGroup({ name, members });
  indexProfiles(convo.members);
  setState((s) => {
    const convos = [convo, ...(s.convos ?? []).filter((c) => c.id !== convo.id)];
    return { ...s, convos };
  });
  return convo.id;
}

async function addMembers(convoId: string, members: string[]): Promise<void> {
  const { convo, addedMembers } = await chat.addMembers({ convoId, members });
  indexProfiles(convo.members);
  indexProfiles(addedMembers);
  setState((s) => ({
    ...s,
    convos: (s.convos ?? []).map((c) => (c.id === convoId ? convo : c)),
  }));
}

async function leaveConvo(convoId: string): Promise<void> {
  await chat.leaveConvo(convoId);
  setState((s) => ({
    ...s,
    convos: (s.convos ?? []).filter((c) => c.id !== convoId),
    messages: { ...s.messages, [convoId]: undefined },
  }));
}

export function setActiveConvo(convoId: string | null) {
  activeConvoId = convoId;
  if (convoId) {
    setState((s) => ({
      ...s,
      convos: (s.convos ?? []).map((c) =>
        c.id === convoId ? { ...c, unreadCount: 0 } : c
      ),
    }));
  }
}

export function useBskyChat() {
  const [, setTick] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const fn = () => {
      if (mounted.current) setTick((t) => (t + 1) & 0x3fff);
    };
    listeners.add(fn);
    initialize();
    return () => {
      mounted.current = false;
      listeners.delete(fn);
    };
  }, []);

  const ensureConvoMessages = useCallback(
    (convoId: string) => loadMessages(convoId, false),
    []
  );

  const sendMsg = useCallback(
    (convoId: string, text: string) => sendMessage(convoId, text),
    []
  );

  const mark = useCallback(
    (convoId: string, messageId?: string) => markRead(convoId, messageId),
    []
  );

  const openDmFn = useCallback((did: string) => openDM(did), []);
  const createGroupFn = useCallback(
    (name: string, members: string[]) => createGroup(name, members),
    []
  );
  const addMembersFn = useCallback(
    (convoId: string, members: string[]) => addMembers(convoId, members),
    []
  );
  const leaveConvoFn = useCallback((convoId: string) => leaveConvo(convoId), []);
  const refresh = useCallback(() => refreshConvos(), []);
  const loadOlder = useCallback(
    (convoId: string) => loadOlderMessages(convoId),
    []
  );

  return {
    ready: state.ready,
    me: state.me,
    convos: state.convos,
    messages: state.messages,
    messageCursors: state.messageCursors,
    profiles: state.profiles,
    error: state.error,
    ensureConvoMessages,
    sendMessage: sendMsg,
    markRead: mark,
    openDM: openDmFn,
    createGroup: createGroupFn,
    addMembers: addMembersFn,
    leaveConvo: leaveConvoFn,
    loadOlderMessages: loadOlder,
    refresh,
    setActiveConvo,
  };
}
