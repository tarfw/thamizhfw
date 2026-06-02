import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter, Redirect } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Pressable } from "@/lib/Pressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBskyChat } from "@/lib/BskyChatProvider";
import {
  createJoinLink,
  enableJoinLink,
  groupKind,
  searchActorsTypeahead,
  type JoinLink,
  type ProfileBasic,
} from "@/lib/bsky-chat";
import { useSession } from "@/lib/auth";
import Avatar from "@/lib/Avatar";
import {
  ACCENT,
  ACCENT_DARK,
  BORDER_IDLE,
  DANGER,
  HAIRLINE,
  MUTED,
  SURFACE_ALT,
  SURFACE_HOVER,
  TEXT,
} from "@/lib/theme";

const JOIN_URL_PREFIX = "https://bsky.app/messages/join/";

export default function GroupInvite() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id: convoId } = useLocalSearchParams<{ id: string }>();
  const { isLoading, user } = useSession();
  const { me, convos, addMembers, refresh } = useBskyChat();

  const convo = useMemo(
    () => (convos ?? []).find((c) => c.id === convoId),
    [convos, convoId]
  );
  const kind = convo ? groupKind(convo) : null;

  const [joinLink, setJoinLink] = useState<JoinLink | null>(
    kind?.joinLink ?? null
  );
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileBasic[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ProfileBasic[]>([]);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const searchToken = useRef(0);

  useEffect(() => {
    if (kind?.joinLink) setJoinLink(kind.joinLink);
  }, [kind?.joinLink]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    const token = ++searchToken.current;
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const actors = await searchActorsTypeahead(q, 12);
        if (token !== searchToken.current) return;
        const existingDids = new Set(convo?.members.map((m) => m.did) ?? []);
        const filtered = actors.filter(
          (a) =>
            a.did !== me?.did &&
            !selected.some((s) => s.did === a.did) &&
            !existingDids.has(a.did)
        );
        setResults(filtered);
      } finally {
        if (token === searchToken.current) setSearching(false);
      }
    }, 220);
    return () => clearTimeout(handle);
  }, [query, me, selected, convo]);

  if (isLoading) return null;
  if (!user) return <Redirect href="/sign-in" />;

  const generateLink = async () => {
    if (!convoId || linkBusy) return;
    setLinkBusy(true);
    setLinkError(null);
    try {
      const { joinLink: link } = await createJoinLink({
        convoId,
        joinRule: "anyone",
        requireApproval: false,
      });
      setJoinLink(link);
      refresh();
    } catch (e: any) {
      if (e?.code === "EnabledJoinLinkAlreadyExists") {
        refresh();
        setLinkError("An invite link already exists; pull to refresh.");
      } else {
        setLinkError(e?.message ?? "Failed to create invite link");
      }
    } finally {
      setLinkBusy(false);
    }
  };

  const toggleLink = async () => {
    if (!convoId || !joinLink || linkBusy) return;
    setLinkBusy(true);
    setLinkError(null);
    try {
      const { joinLink: link } =
        joinLink.enabledStatus === "enabled"
          ? { joinLink: { ...joinLink, enabledStatus: "disabled" as const } }
          : await enableJoinLink(convoId);
      setJoinLink(link);
      refresh();
    } catch (e: any) {
      setLinkError(e?.message ?? "Failed to update invite link");
    } finally {
      setLinkBusy(false);
    }
  };

  const shareLink = async () => {
    if (!joinLink) return;
    const url = JOIN_URL_PREFIX + joinLink.code;
    const message =
      `Join "${kind?.name ?? "group"}" on Bluesky chat:\n${url}\n\nCode: ${joinLink.code}`;
    try {
      await Share.share({ message, url });
    } catch {}
  };

  const addMember = (p: ProfileBasic) => {
    setAddError(null);
    setSelected((prev) =>
      prev.some((s) => s.did === p.did) ? prev : [...prev, p]
    );
    setQuery("");
    setResults([]);
  };

  const removeMember = (did: string) =>
    setSelected((prev) => prev.filter((p) => p.did !== did));

  const submitAdd = async () => {
    if (!convoId || selected.length === 0 || adding) return;
    setAdding(true);
    setAddError(null);
    try {
      await addMembers(
        convoId,
        selected.map((p) => p.did)
      );
      setSelected([]);
    } catch (e: any) {
      setAddError(e?.message ?? "Failed to add members");
    } finally {
      setAdding(false);
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
              textAlign: "center",
            }}
          >
            Invite to {kind?.name ?? "Group"}
          </Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <FlashList
        data={results}
        keyExtractor={(item) => item.did}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        ListHeaderComponent={
          <View>
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              <Text style={SectionLabel}>Invite Link</Text>
              {joinLink ? (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: BORDER_IDLE,
                    borderRadius: 16,
                    padding: 14,
                    backgroundColor: SURFACE_ALT,
                  }}
                >
                  <Text
                    selectable
                    style={{
                      fontSize: 14,
                      color: TEXT,
                      fontFamily: "SpaceMono",
                    }}
                  >
                    {JOIN_URL_PREFIX + joinLink.code}
                  </Text>
                  <Text style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>
                    {joinLink.enabledStatus === "enabled" ? "Active" : "Disabled"}
                    {"  ·  Join rule: "}
                    {joinLink.joinRule === "anyone" ? "anyone" : "follows only"}
                    {joinLink.requireApproval ? "  ·  approval required" : ""}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      marginTop: 12,
                      marginHorizontal: -4,
                    }}
                  >
                    <Pressable
                      onPress={shareLink}
                      style={({ pressed }) => ({
                        flex: 1,
                        marginHorizontal: 4,
                        backgroundColor: pressed ? ACCENT_DARK : ACCENT,
                        paddingVertical: 10,
                        borderRadius: 18,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                      })}
                    >
                      <Ionicons name="share-outline" size={16} color="white" />
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "600",
                          marginLeft: 6,
                          fontSize: 14,
                        }}
                      >
                        Share
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={toggleLink}
                      disabled={linkBusy}
                      style={({ pressed }) => ({
                        flex: 1,
                        marginHorizontal: 4,
                        backgroundColor: pressed ? SURFACE_HOVER : "white",
                        paddingVertical: 10,
                        borderRadius: 18,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: BORDER_IDLE,
                      })}
                    >
                      {linkBusy ? (
                        <ActivityIndicator size="small" color={MUTED} />
                      ) : (
                        <Text style={{ color: TEXT, fontWeight: "500", fontSize: 14 }}>
                          {joinLink.enabledStatus === "enabled"
                            ? "Disable"
                            : "Enable"}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={generateLink}
                  disabled={linkBusy}
                  style={({ pressed }) => ({
                    borderWidth: 1,
                    borderColor: BORDER_IDLE,
                    borderRadius: 16,
                    paddingVertical: 14,
                    alignItems: "center",
                    backgroundColor: pressed ? SURFACE_HOVER : "white",
                    flexDirection: "row",
                    justifyContent: "center",
                  })}
                >
                  {linkBusy ? (
                    <ActivityIndicator size="small" color={ACCENT} />
                  ) : (
                    <>
                      <Ionicons name="link-outline" size={18} color={ACCENT} />
                      <Text style={{ color: ACCENT, fontWeight: "600", marginLeft: 8 }}>
                        Create invite link
                      </Text>
                    </>
                  )}
                </Pressable>
              )}
              {linkError ? (
                <Text style={{ color: DANGER, fontSize: 12, marginTop: 8 }}>{linkError}</Text>
              ) : null}
            </View>

            <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
              <Text style={SectionLabel}>Add Members Directly</Text>
              {selected.length > 0 ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
                  {selected.map((p) => (
                    <Chip
                      key={p.did}
                      profile={p}
                      onRemove={() => removeMember(p.did)}
                    />
                  ))}
                </View>
              ) : null}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: SURFACE_ALT,
                  borderRadius: 20,
                  height: 44,
                  paddingHorizontal: 12,
                }}
              >
                <Ionicons name="search" size={16} color={MUTED} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search by handle or name"
                  placeholderTextColor={MUTED}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    flex: 1,
                    height: 44,
                    paddingHorizontal: 8,
                    color: TEXT,
                    fontSize: 14,
                  }}
                />
                {searching ? <ActivityIndicator size="small" color={MUTED} /> : null}
              </View>
              {addError ? (
                <Text style={{ color: DANGER, fontSize: 12, marginTop: 8 }}>{addError}</Text>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          query.trim().length >= 2 && !searching ? (
            <View style={{ paddingTop: 24, alignItems: "center" }}>
              <Text style={{ color: MUTED, fontSize: 13 }}>No matches</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => addMember(item)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: pressed ? SURFACE_HOVER : "white",
            })}
          >
            <Avatar
              name={item.displayName ?? item.handle}
              size={40}
              seed={item.did}
              url={item.avatar}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                numberOfLines={1}
                style={{ fontSize: 14, color: TEXT, fontWeight: "500" }}
              >
                {item.displayName ?? item.handle}
              </Text>
              <Text
                numberOfLines={1}
                style={{ fontSize: 12, color: MUTED, marginTop: 2 }}
              >
                @{item.handle}
              </Text>
            </View>
            <Ionicons name="add-circle" size={22} color={ACCENT} />
          </Pressable>
        )}
      />

      {selected.length > 0 ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: insets.bottom + 12,
            borderTopWidth: 1,
            borderTopColor: HAIRLINE,
            backgroundColor: "white",
          }}
        >
          <Pressable
            onPress={submitAdd}
            disabled={adding}
            style={({ pressed }) => ({
              backgroundColor: adding
                ? SURFACE_ALT
                : pressed
                  ? ACCENT_DARK
                  : ACCENT,
              paddingVertical: 14,
              borderRadius: 24,
              alignItems: "center",
            })}
          >
            <Text
              style={{
                color: adding ? MUTED : "white",
                fontSize: 15,
                fontWeight: "600",
              }}
            >
              {adding
                ? "Adding..."
                : `Add ${selected.length} member${selected.length === 1 ? "" : "s"}`}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const SectionLabel = {
  fontSize: 13,
  color: MUTED,
  fontWeight: "500" as const,
  marginBottom: 8,
  textTransform: "uppercase" as const,
  letterSpacing: 0.5,
};

function Chip({
  profile,
  onRemove,
}: {
  profile: ProfileBasic;
  onRemove: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: SURFACE_ALT,
        borderRadius: 18,
        paddingLeft: 4,
        paddingRight: 8,
        paddingVertical: 4,
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      <Avatar
        name={profile.displayName ?? profile.handle}
        size={26}
        seed={profile.did}
        url={profile.avatar}
      />
      <Text
        numberOfLines={1}
        style={{ fontSize: 13, color: TEXT, marginLeft: 6, maxWidth: 140 }}
      >
        {profile.displayName ?? profile.handle}
      </Text>
      <Pressable onPress={onRemove} hitSlop={8} style={{ marginLeft: 6 }}>
        <Ionicons name="close-circle" size={18} color={MUTED} />
      </Pressable>
    </View>
  );
}
