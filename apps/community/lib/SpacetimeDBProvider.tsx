import { useEffect, useState, useCallback } from "react";
import { ensureConnected, subscribe, getConnectionState, getUsers, getMessages, getGroupChats, getGroupMembers } from "./db";
import type { User, Message, GroupChat, GroupMember } from "./db";

export type { User, Message, GroupChat, GroupMember };

export type ConnectionInfo = {
  isActive: boolean;
  identity: { toHexString(): string } | null;
  tablesReady: boolean;
  error: string | null;
};

export function useSpacetimeDB() {
  const [conn, setConn] = useState<ConnectionInfo>(getConnectionState);
  const [users, setUsers] = useState<readonly User[]>(getUsers);
  const [messages, setMessages] = useState<readonly Message[]>(getMessages);
  const [groupChats, setGroupChats] = useState<readonly GroupChat[]>(getGroupChats);
  const [groupMembers, setGroupMembers] = useState<readonly GroupMember[]>(getGroupMembers);
  const [retry, setRetry] = useState(0);

  const refresh = useCallback(() => {
    const nextConn = getConnectionState();
    setConn((prev) =>
      prev.isActive === nextConn.isActive &&
      prev.tablesReady === nextConn.tablesReady &&
      prev.identity === nextConn.identity &&
      prev.error === nextConn.error
        ? prev
        : nextConn
    );
    setUsers((prev) => {
      const next = getUsers();
      return prev === next ? prev : next;
    });
    setMessages((prev) => {
      const next = getMessages();
      return prev === next ? prev : next;
    });
    setGroupChats((prev) => {
      const next = getGroupChats();
      return prev === next ? prev : next;
    });
    setGroupMembers((prev) => {
      const next = getGroupMembers();
      return prev === next ? prev : next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    ensureConnected()
      .then(() => {
        if (!cancelled) setRetry(0);
      })
      .catch((err) => {
        console.error("[SpacetimeDBProvider] connect failed:", err);
        if (!cancelled) {
          setTimeout(() => setRetry((r) => r + 1), 2000);
        }
      });
    const unsub = subscribe(refresh);
    refresh();
    return () => { cancelled = true; unsub(); };
  }, [refresh, retry]);

  return { conn, users, messages, groupChats, groupMembers };
}
