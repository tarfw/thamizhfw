import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter, Redirect } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { Pressable } from "@/lib/Pressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBskyChat } from "@/lib/BskyChatProvider";
import { isMessageView, isDeletedMessage, isSystemMessage, type AnyMessage } from "@/lib/bsky-chat";
import { useSession } from "@/lib/auth";
import Avatar from "@/lib/Avatar";
import { ACCENT, ACCENT_DARK, BORDER_IDLE, HAIRLINE, MUTED, SURFACE_ALT, TEXT } from "@/lib/theme";

export default function PrivateChatRoom() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id: convoId } = useLocalSearchParams<{ id: string }>();
  const { isLoading, user } = useSession();
  const {
    me,
    convos,
    messages,
    messageCursors,
    ensureConvoMessages,
    sendMessage,
    markRead,
    setActiveConvo,
    loadOlderMessages,
  } = useBskyChat();
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!convoId) return;
    ensureConvoMessages(convoId);
    setActiveConvo(convoId);
    return () => setActiveConvo(null);
  }, [convoId, ensureConvoMessages, setActiveConvo]);

  const convo = useMemo(
    () => (convos ?? []).find((c) => c.id === convoId),
    [convos, convoId]
  );

  const other = useMemo(() => {
    if (!convo || !me) return null;
    return convo.members.find((m) => m.did !== me.did) ?? null;
  }, [convo, me]);

  const otherName = other?.displayName ?? other?.handle ?? "User";

  const msgs = (convoId ? messages[convoId] : undefined) ?? [];
  const visible = useMemo(() => msgs.filter((m) => !isSystemMessage(m)), [msgs]);

  const latestId = msgs[0]?.id;
  useEffect(() => {
    if (convoId && latestId) markRead(convoId, latestId);
  }, [convoId, latestId, markRead]);

  if (isLoading) return null;
  if (!user) return <Redirect href="/sign-in" />;

  const send = async () => {
    const text = draft.trim();
    if (!text || !convoId || sending) return;
    setDraft("");
    setSending(true);
    try {
      await sendMessage(convoId, text);
    } catch (e: any) {
      console.error("[bsky-chat] sendMessage failed:", e);
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const canSend = !!draft.trim() && !sending;
  const initialLoading = msgs.length === 0 && messageCursors[convoId ?? ""] === undefined;

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ paddingTop: insets.top, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: HAIRLINE }}>
        <View style={{ height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: 4 }}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.6 : 1 })}>
            <Ionicons name="arrow-back" size={22} color={TEXT} />
          </Pressable>
          <Avatar name={otherName} size={36} seed={other?.did ?? ""} url={other?.avatar} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: 16, color: TEXT, fontWeight: "500" }}>{otherName}</Text>
            {other?.handle ? (
              <Text numberOfLines={1} style={{ fontSize: 12, color: MUTED }}>@{other.handle}</Text>
            ) : null}
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {initialLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={ACCENT} />
          </View>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={visible}
            inverted
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 8, flexGrow: 1, justifyContent: visible.length === 0 ? "center" : "flex-start" }}
            onEndReached={() => {
              if (convoId) loadOlderMessages(convoId);
            }}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <Ionicons name="chatbox-outline" size={32} color={MUTED} />
                <Text style={{ fontSize: 14, color: MUTED, marginTop: 8 }}>Start chatting</Text>
              </View>
            }
            renderItem={({ item }) => <MessageBubble item={item} mine={getSenderDid(item) === me?.did} />}
          />
        )}

        <View style={{ backgroundColor: "white", paddingBottom: insets.bottom || 8, paddingTop: 8, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: HAIRLINE }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", borderWidth: 1, borderColor: focused ? ACCENT : BORDER_IDLE, borderRadius: 24, paddingHorizontal: 4, paddingVertical: 4, backgroundColor: "white", minHeight: 48 }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Message"
              placeholderTextColor={MUTED}
              multiline
              maxLength={10000}
              style={{ flex: 1, maxHeight: 120, minHeight: 38, paddingHorizontal: 4, paddingVertical: Platform.OS === "ios" ? 10 : 8, color: TEXT, fontSize: 15, lineHeight: 20 }}
            />
            <Pressable onPress={send} disabled={!canSend} style={({ pressed }) => ({ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: !canSend ? "transparent" : pressed ? ACCENT_DARK : ACCENT })}>
              <Ionicons name="send" size={18} color={!canSend ? MUTED : "white"} style={{ marginLeft: -1 }} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function getSenderDid(m: AnyMessage): string | undefined {
  if (isMessageView(m) || isDeletedMessage(m)) return m.sender.did;
  return undefined;
}

function MessageBubble({ item, mine }: { item: AnyMessage; mine: boolean }) {
  const deleted = isDeletedMessage(item);
  const text = isMessageView(item) ? item.text : deleted ? "Message deleted" : "";
  return (
    <View style={{ flexDirection: "row", marginTop: 4, paddingHorizontal: 4, justifyContent: mine ? "flex-end" : "flex-start" }}>
      <View style={{ maxWidth: "76%", paddingHorizontal: 14, paddingVertical: 9, backgroundColor: mine ? ACCENT : SURFACE_ALT, borderRadius: 18 }}>
        <Text style={{ color: mine ? "white" : TEXT, fontSize: 15, lineHeight: 20, fontStyle: deleted ? "italic" : "normal", opacity: deleted ? 0.7 : 1 }}>
          {text}
        </Text>
      </View>
    </View>
  );
}
