import {
  loadSession,
  refreshSession,
  saveSession,
  type BlueskySession,
} from "./bluesky-auth";

const CHAT_PROXY = "did:web:api.bsky.chat#bsky_chat";
const PUBLIC_API = "https://public.api.bsky.app";

export type ProfileBasic = {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  chatDisabled?: boolean;
};

export type ConvoKind = "direct" | "group";
export type ConvoLockStatus = "unlocked" | "locked" | "locked-permanently";
export type ConvoStatus = "request" | "accepted";
export type JoinRule = "anyone" | "followedByOwner";

export type MessageView = {
  $type?: "chat.bsky.convo.defs#messageView";
  id: string;
  rev: string;
  text: string;
  sender: { did: string };
  sentAt: string;
  reactions?: { value: string; sender: { did: string }; createdAt: string }[];
};

export type DeletedMessageView = {
  $type: "chat.bsky.convo.defs#deletedMessageView";
  id: string;
  rev: string;
  sender: { did: string };
  sentAt: string;
};

export type SystemMessageView = {
  $type: "chat.bsky.convo.defs#systemMessageView";
  id: string;
  rev: string;
  sentAt: string;
  data: { $type: string; [k: string]: any };
};

export type AnyMessage = MessageView | DeletedMessageView | SystemMessageView;

export type JoinLink = {
  code: string;
  enabledStatus: "enabled" | "disabled";
  requireApproval: boolean;
  joinRule: JoinRule;
  createdAt: string;
};

export type DirectConvoKind = {
  $type: "chat.bsky.convo.defs#directConvo";
};

export type GroupConvoKind = {
  $type: "chat.bsky.convo.defs#groupConvo";
  name: string;
  memberCount: number;
  memberLimit: number;
  lockStatus: ConvoLockStatus;
  createdAt: string;
  joinLink?: JoinLink;
  joinRequestCount?: number;
  unreadJoinRequestCount?: number;
};

export type ConvoKindData = DirectConvoKind | GroupConvoKind;

export type ConvoView = {
  id: string;
  rev: string;
  members: ProfileBasic[];
  lastMessage?: AnyMessage;
  lastEventAt?: string;
  muted: boolean;
  status?: ConvoStatus;
  unreadCount: number;
  kind?: ConvoKindData;
};

export type LogEntry = {
  $type: string;
  rev: string;
  convoId?: string;
  message?: AnyMessage;
  reaction?: any;
  member?: ProfileBasic;
  relatedProfiles?: ProfileBasic[];
};

function buildUrl(
  pdsUrl: string,
  method: string,
  query?: Record<string, string | string[] | number | boolean | undefined>
): string {
  let url = `${pdsUrl}/xrpc/${method}`;
  const parts: string[] = [];
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) {
        for (const item of v)
          parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(item)}`);
      } else {
        parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
      }
    }
  }
  if (parts.length) url += `?${parts.join("&")}`;
  return url;
}

type RequestOpts = {
  query?: Record<string, string | string[] | number | boolean | undefined>;
  body?: any;
  httpMethod?: "GET" | "POST";
};

async function chatRequest<T = any>(method: string, opts: RequestOpts = {}): Promise<T> {
  let session = await loadSession();
  if (!session) throw new Error("Not signed in to Bluesky");

  const httpMethod = opts.httpMethod ?? (opts.body ? "POST" : "GET");
  const url = buildUrl(session.pdsUrl, method, opts.query);

  const doFetch = (s: BlueskySession) =>
    fetch(url, {
      method: httpMethod,
      headers: {
        Authorization: `Bearer ${s.accessJwt}`,
        "atproto-proxy": CHAT_PROXY,
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

  let res = await doFetch(session);
  if (res.status === 401) {
    try {
      session = await refreshSession(session);
      await saveSession(session);
      res = await doFetch(session);
    } catch {
      throw new Error("Session expired — please sign in again");
    }
  }

  if (!res.ok) {
    const txt = await res.text();
    let msg = `${method} failed (${res.status})`;
    let errCode = "";
    try {
      const parsed = JSON.parse(txt);
      errCode = parsed.error ?? "";
      if (
        errCode === "InvalidToken" ||
        errCode === "ExpiredToken" ||
        (res.status === 403 && /dm|direct message|chat/i.test(parsed.message ?? ""))
      ) {
        msg =
          'Chat access denied. Your app password must have "Direct messages" permission enabled. Reissue it at bsky.app/settings/app-passwords.';
      } else if (
        errCode === "NotImplemented" ||
        res.status === 501 ||
        /not implemented|method not implemented/i.test(parsed.message ?? "")
      ) {
        const isGroup = method.startsWith("chat.bsky.group.");
        msg = isGroup
          ? "Group chat isn't supported on this server yet. The chat.bsky.group.* endpoints were added to atproto in April 2026, but most PDS deployments (including the main Bluesky PDS) haven't enabled them yet. You can still use direct messages."
          : `This server doesn't implement ${method} (HTTP 501).`;
      } else if (parsed.message) {
        msg = parsed.message;
      }
    } catch {
      if (res.status === 501) {
        msg = `This server doesn't implement ${method} (HTTP 501).`;
      }
    }
    const err = new Error(msg) as Error & { code?: string; status?: number };
    err.code = errCode;
    err.status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}

export async function listConvos(opts: {
  limit?: number;
  cursor?: string;
  kind?: ConvoKind;
  status?: ConvoStatus;
} = {}): Promise<{ convos: ConvoView[]; cursor?: string }> {
  return chatRequest("chat.bsky.convo.listConvos", {
    query: {
      limit: opts.limit,
      cursor: opts.cursor,
      kind: opts.kind,
      status: opts.status,
    },
  });
}

export async function getConvo(convoId: string): Promise<{ convo: ConvoView }> {
  return chatRequest("chat.bsky.convo.getConvo", { query: { convoId } });
}

export async function getConvoForMembers(
  members: string[]
): Promise<{ convo: ConvoView }> {
  return chatRequest("chat.bsky.convo.getConvoForMembers", {
    query: { members },
  });
}

export async function getMessages(opts: {
  convoId: string;
  limit?: number;
  cursor?: string;
}): Promise<{
  messages: AnyMessage[];
  cursor?: string;
  relatedProfiles?: ProfileBasic[];
}> {
  return chatRequest("chat.bsky.convo.getMessages", {
    query: { convoId: opts.convoId, limit: opts.limit, cursor: opts.cursor },
  });
}

export async function sendMessage(opts: {
  convoId: string;
  text: string;
}): Promise<MessageView> {
  return chatRequest("chat.bsky.convo.sendMessage", {
    body: { convoId: opts.convoId, message: { text: opts.text } },
  });
}

export async function getLog(
  cursor?: string
): Promise<{ logs: LogEntry[]; cursor?: string }> {
  return chatRequest("chat.bsky.convo.getLog", { query: { cursor } });
}

export async function updateRead(opts: {
  convoId: string;
  messageId?: string;
}): Promise<{ convo: ConvoView }> {
  return chatRequest("chat.bsky.convo.updateRead", { body: opts });
}

export async function leaveConvo(
  convoId: string
): Promise<{ convoId: string; rev: string }> {
  return chatRequest("chat.bsky.convo.leaveConvo", { body: { convoId } });
}

export async function muteConvo(convoId: string): Promise<{ convo: ConvoView }> {
  return chatRequest("chat.bsky.convo.muteConvo", { body: { convoId } });
}

export async function unmuteConvo(convoId: string): Promise<{ convo: ConvoView }> {
  return chatRequest("chat.bsky.convo.unmuteConvo", { body: { convoId } });
}

export async function deleteMessageForSelf(opts: {
  convoId: string;
  messageId: string;
}): Promise<DeletedMessageView> {
  return chatRequest("chat.bsky.convo.deleteMessageForSelf", { body: opts });
}

export async function createGroup(opts: {
  name: string;
  members: string[];
}): Promise<{ convo: ConvoView }> {
  return chatRequest("chat.bsky.group.createGroup", { body: opts });
}

export async function addMembers(opts: {
  convoId: string;
  members: string[];
}): Promise<{ convo: ConvoView; addedMembers?: ProfileBasic[] }> {
  return chatRequest("chat.bsky.group.addMembers", { body: opts });
}

export async function removeMembers(opts: {
  convoId: string;
  members: string[];
}): Promise<{ convo: ConvoView }> {
  return chatRequest("chat.bsky.group.removeMembers", { body: opts });
}

export async function editGroup(opts: {
  convoId: string;
  name: string;
}): Promise<{ convo: ConvoView }> {
  return chatRequest("chat.bsky.group.editGroup", { body: opts });
}

export async function createJoinLink(opts: {
  convoId: string;
  joinRule: JoinRule;
  requireApproval?: boolean;
}): Promise<{ joinLink: JoinLink }> {
  return chatRequest("chat.bsky.group.createJoinLink", { body: opts });
}

export async function enableJoinLink(convoId: string): Promise<{ joinLink: JoinLink }> {
  return chatRequest("chat.bsky.group.enableJoinLink", { body: { convoId } });
}

export async function disableJoinLink(convoId: string): Promise<{ joinLink: JoinLink }> {
  return chatRequest("chat.bsky.group.disableJoinLink", { body: { convoId } });
}

export async function searchActorsTypeahead(
  q: string,
  limit = 8
): Promise<ProfileBasic[]> {
  if (!q.trim()) return [];
  const url = `${PUBLIC_API}/xrpc/app.bsky.actor.searchActorsTypeahead?q=${encodeURIComponent(
    q
  )}&limit=${limit}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.actors ?? []) as ProfileBasic[];
  } catch {
    return [];
  }
}

export function isMessageView(m: AnyMessage): m is MessageView {
  return !m.$type || m.$type === "chat.bsky.convo.defs#messageView";
}

export function isDeletedMessage(m: AnyMessage): m is DeletedMessageView {
  return m.$type === "chat.bsky.convo.defs#deletedMessageView";
}

export function isSystemMessage(m: AnyMessage): m is SystemMessageView {
  return m.$type === "chat.bsky.convo.defs#systemMessageView";
}

export function isGroupConvo(c: ConvoView): boolean {
  return c.kind?.$type === "chat.bsky.convo.defs#groupConvo";
}

export function groupKind(c: ConvoView): GroupConvoKind | null {
  return c.kind?.$type === "chat.bsky.convo.defs#groupConvo"
    ? (c.kind as GroupConvoKind)
    : null;
}

export function formatSystemMessage(
  m: SystemMessageView,
  profiles: Record<string, ProfileBasic>
): string {
  const d = m.data ?? {};
  const t = d.$type ?? "";
  const nameFor = (ref: { did?: string } | undefined): string => {
    if (!ref?.did) return "Someone";
    const p = profiles[ref.did];
    return p?.displayName ?? p?.handle ?? ref.did.slice(0, 12);
  };
  if (t.endsWith("#systemMessageDataAddMember"))
    return `${nameFor(d.addedBy)} added ${nameFor(d.member)}`;
  if (t.endsWith("#systemMessageDataRemoveMember"))
    return `${nameFor(d.removedBy)} removed ${nameFor(d.member)}`;
  if (t.endsWith("#systemMessageDataMemberJoin"))
    return `${nameFor(d.member)} joined`;
  if (t.endsWith("#systemMessageDataMemberLeave"))
    return `${nameFor(d.member)} left`;
  if (t.endsWith("#systemMessageDataLockConvo"))
    return `${nameFor(d.lockedBy)} locked the group`;
  if (t.endsWith("#systemMessageDataUnlockConvo"))
    return `${nameFor(d.unlockedBy)} unlocked the group`;
  if (t.endsWith("#systemMessageDataLockConvoPermanently"))
    return `${nameFor(d.lockedBy)} closed the group permanently`;
  if (t.endsWith("#systemMessageDataEditGroup")) {
    if (d.newName) return `Group renamed to "${d.newName}"`;
    return "Group settings updated";
  }
  if (t.endsWith("#systemMessageDataCreateJoinLink")) return "Invite link created";
  if (t.endsWith("#systemMessageDataEditJoinLink")) return "Invite link updated";
  if (t.endsWith("#systemMessageDataEnableJoinLink")) return "Invite link enabled";
  if (t.endsWith("#systemMessageDataDisableJoinLink")) return "Invite link disabled";
  return "System message";
}
