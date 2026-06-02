import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter, Redirect } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Pressable } from "@/lib/Pressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBskyChat } from "@/lib/BskyChatProvider";
import { searchActorsTypeahead, type ProfileBasic } from "@/lib/bsky-chat";
import { useSession } from "@/lib/auth";
import Avatar from "@/lib/Avatar";
import {
  ACCENT,
  ACCENT_DARK,
  BORDER_IDLE,
  HAIRLINE,
  MUTED,
  SURFACE_ALT,
  TEXT,
} from "@/lib/theme";

export default function NewMessageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoading, user } = useSession();
  const { openDM, sendMessage, me } = useBskyChat();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileBasic[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ProfileBasic | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q || selected) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const r = await searchActorsTypeahead(q, 8);
      const filtered = r.filter((p) => p.did !== me?.did);
      setResults(filtered);
      setSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, selected, me?.did]);

  if (isLoading) return null;
  if (!user) return <Redirect href="/sign-in" />;

  const canSend = !!draft.trim() && !!selected && !sending;

  const pick = (p: ProfileBasic) => {
    setSelected(p);
    setQuery("");
    setResults([]);
  };

  const clearSelected = () => {
    setSelected(null);
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    setError(null);
    try {
      const convoId = await openDM(selected.did);
      try {
        await sendMessage(convoId, text);
      } catch (e) {
        // If the convo was created but send failed, still go to it.
        console.error("[new-message] sendMessage failed:", e);
      }
      router.replace(`/chats/private/${convoId}` as any);
    } catch (e: any) {
      console.error("[new-message] openDM failed:", e);
      setError(e?.message ?? "Could not start chat");
      setSending(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: "white",
          borderBottomWidth: 1,
          borderBottomColor: HAIRLINE,
        }}
      >
        <View
          style={{
            height: 56,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 4,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="arrow-back" size={22} color={TEXT} />
          </Pressable>
          <Text
            style={{
              flex: 1,
              fontSize: 17,
              fontWeight: "600",
              color: TEXT,
              marginLeft: 4,
            }}
          >
            New Message
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingBottom: 12,
          }}
        >
          <Text style={{ fontSize: 14, color: MUTED, marginRight: 8 }}>To:</Text>
          {selected ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: ACCENT,
                borderRadius: 16,
                paddingLeft: 4,
                paddingRight: 10,
                paddingVertical: 4,
              }}
            >
              <Avatar
                name={selected.displayName ?? selected.handle}
                size={20}
                seed={selected.did}
                url={selected.avatar}
              />
              <Text
                numberOfLines={1}
                style={{
                  color: "white",
                  fontSize: 13,
                  fontWeight: "600",
                  marginLeft: 6,
                  maxWidth: 200,
                }}
              >
                {selected.displayName ?? selected.handle}
              </Text>
              <Pressable
                onPress={clearSelected}
                hitSlop={8}
                style={{ marginLeft: 4 }}
              >
                <Ionicons name="close" size={16} color="white" />
              </Pressable>
            </View>
          ) : (
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Search people..."
              placeholderTextColor={MUTED}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                flex: 1,
                fontSize: 15,
                color: TEXT,
                paddingVertical: Platform.OS === "ios" ? 8 : 4,
              }}
            />
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {!selected ? (
          query.trim().length === 0 ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 32,
              }}
            >
              <Ionicons name="search" size={28} color={MUTED} />
              <Text
                style={{
                  fontSize: 14,
                  color: MUTED,
                  marginTop: 10,
                  textAlign: "center",
                }}
              >
                Search for someone to message.
              </Text>
            </View>
          ) : (
            <FlashList
              data={results}
              keyExtractor={(item) => item.did}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View
                  style={{
                    paddingTop: 48,
                    alignItems: "center",
                  }}
                >
                  {searching ? (
                    <ActivityIndicator color={ACCENT} />
                  ) : (
                    <Text style={{ fontSize: 13, color: MUTED }}>
                      No people matched.
                    </Text>
                  )}
                </View>
              }
              renderItem={({ item }) => {
                const name = item.displayName ?? item.handle;
                return (
                  <Pressable
                    onPress={() => pick(item)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      backgroundColor: pressed ? SURFACE_ALT : "white",
                    })}
                  >
                    <Avatar
                      name={name}
                      size={40}
                      seed={item.did}
                      url={item.avatar}
                    />
                    <View style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
                      <Text
                        numberOfLines={1}
                        style={{ fontSize: 15, fontWeight: "500", color: TEXT }}
                      >
                        {name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{ fontSize: 13, color: MUTED, marginTop: 1 }}
                      >
                        @{item.handle}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          )
        ) : (
          <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: SURFACE_ALT,
                borderRadius: 12,
              }}
            >
              <Avatar
                name={selected.displayName ?? selected.handle}
                size={44}
                seed={selected.did}
                url={selected.avatar}
              />
              <View style={{ marginLeft: 12, flex: 1, minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 15, fontWeight: "600", color: TEXT }}
                >
                  {selected.displayName ?? selected.handle}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{ fontSize: 13, color: MUTED, marginTop: 1 }}
                >
                  @{selected.handle}
                </Text>
              </View>
            </View>
            {error ? (
              <Text
                style={{ fontSize: 12, color: "#D93025", marginTop: 10 }}
              >
                {error}
              </Text>
            ) : null}
          </View>
        )}

        {selected ? (
          <View
            style={{
              backgroundColor: "white",
              paddingBottom: insets.bottom || 8,
              paddingTop: 8,
              paddingHorizontal: 12,
              borderTopWidth: 1,
              borderTopColor: HAIRLINE,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                borderWidth: 1,
                borderColor: BORDER_IDLE,
                borderRadius: 24,
                paddingHorizontal: 4,
                paddingVertical: 4,
                backgroundColor: "white",
                minHeight: 48,
              }}
            >
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Message"
                placeholderTextColor={MUTED}
                multiline
                maxLength={10000}
                style={{
                  flex: 1,
                  maxHeight: 120,
                  minHeight: 38,
                  paddingHorizontal: 10,
                  paddingVertical: Platform.OS === "ios" ? 10 : 8,
                  color: TEXT,
                  fontSize: 15,
                  lineHeight: 20,
                }}
              />
              <Pressable
                onPress={send}
                disabled={!canSend}
                style={({ pressed }) => ({
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: !canSend
                    ? "transparent"
                    : pressed
                    ? ACCENT_DARK
                    : ACCENT,
                })}
              >
                <Ionicons
                  name="send"
                  size={18}
                  color={!canSend ? MUTED : "white"}
                  style={{ marginLeft: -1 }}
                />
              </Pressable>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}
