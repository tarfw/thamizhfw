import { Ionicons } from "@expo/vector-icons";
import { FiveWingAsterisk } from "@/lib/FiveWingAsterisk";
import { Stack, Link, Redirect, useRouter } from "expo-router";
import { useMemo, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Pressable } from "@/lib/Pressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSpacetimeDB } from "@/lib/SpacetimeDBProvider";
import { useBskyChat } from "@/lib/BskyChatProvider";
import { ts } from "@/lib/db";
import { useSession, constituencies } from "@/lib/auth";
import type { Message } from "@/lib/module_bindings/types";
import { isGroupConvo, groupKind, type ConvoView } from "@/lib/bsky-chat";
import Avatar from "@/lib/Avatar";
import BrandLogo from "@/lib/BrandLogo";
import {
  renderRichText,
  ExternalLinkCard,
  QuotedPostCard,
} from "@/lib/bskyPostRender";
import {
  ACCENT,
  ACCENT_DARK,
  ACCENT_SOFT,
  HAIRLINE,
  MUTED,
  SURFACE_ALT,
  SURFACE_HOVER,
  TEXT,
} from "@/lib/theme";

function previewText(c: ConvoView): string {
  const m = c.lastMessage;
  if (!m) {
    if (isGroupConvo(c)) {
      const k = groupKind(c);
      return `${k?.memberCount ?? c.members.length} members`;
    }
    return "No messages yet";
  }
  if (m.$type === "chat.bsky.convo.defs#deletedMessageView") return "Message deleted";
  if (m.$type === "chat.bsky.convo.defs#systemMessageView") return "System message";
  return (m as any).text ?? "";
}

type Row = {
  id: string;
  code: string;
  slug: string;
  nameEn: string;
  nameTa: string;
  district: string;
  number: number;
  reservation?: string;
  messages: { id: string; body: string; createdAt: number }[];
};

type Tab = "feed" | "chats" | "spaces" | "apps";

const EELAM_CONSTITUENCIES: Row[] = [
  {
    id: "eelam-jaffna",
    code: "jaffna",
    slug: "jaffna",
    nameEn: "Jaffna",
    nameTa: "யாழ்ப்பாணம்",
    district: "Jaffna District",
    number: 1,
    messages: [],
  },
  {
    id: "eelam-trinco",
    code: "trincomalee",
    slug: "trincomalee",
    nameEn: "Trincomalee",
    nameTa: "திருகோணமலை",
    district: "Trincomalee District",
    number: 2,
    messages: [],
  },
  {
    id: "eelam-batticaloa",
    code: "batticaloa",
    slug: "batticaloa",
    nameEn: "Batticaloa",
    nameTa: "மட்டக்களப்பு",
    district: "Batticaloa District",
    number: 3,
    messages: [],
  },
  {
    id: "eelam-vanni",
    code: "vanni",
    slug: "vanni",
    nameEn: "Vanni",
    nameTa: "வன்னி",
    district: "Vanni District",
    number: 4,
    messages: [],
  },
  {
    id: "eelam-mannar",
    code: "mannar",
    slug: "mannar",
    nameEn: "Mannar",
    nameTa: "மன்னார்",
    district: "Mannar District",
    number: 5,
    messages: [],
  },
  {
    id: "eelam-malayagam",
    code: "malayagam",
    slug: "malayagam",
    nameEn: "Malayagam",
    nameTa: "மலையகம்",
    district: "Hill Country",
    number: 6,
    messages: [],
  },
  {
    id: "eelam-diaspora",
    code: "diaspora",
    slug: "diaspora",
    nameEn: "Eelam Diaspora",
    nameTa: "ஈழப் புலம்பெயர்",
    district: "Worldwide",
    number: 7,
    messages: [],
  },
];

export default function ConstituenciesIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoading: sessionLoading, user, profile, constituency } = useSession();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("spaces");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [activeLocation, setActiveLocation] = useState<"Tamilnadu" | "Eelam">("Tamilnadu");
  const [bskyPosts, setBskyPosts] = useState<any[]>([]);
  const [bskyLoading, setBskyLoading] = useState(false);
  const [bskyUntil, setBskyUntil] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (tab !== "feed") return;

    let active = true;
    const fetchFeed = async () => {
      setBskyLoading(true);
      setBskyUntil(null);
      try {
        const q = activeLocation === "Tamilnadu" ? "tamilnadu" : "eelam";
        const res = await fetch(
          `https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&limit=30`
        );
        const json = await res.json();
        if (active && json.posts) {
          const seen = new Set<string>();
          const unique = json.posts.filter((p: any) => {
            if (!p?.uri || seen.has(p.uri)) return false;
            seen.add(p.uri);
            return true;
          });
          setBskyPosts(unique);
          if (unique.length > 0) {
            const oldest = unique[unique.length - 1];
            const oldestDate = oldest.record?.createdAt || oldest.indexedAt;
            setBskyUntil(oldestDate || null);
          } else {
            setBskyUntil(null);
          }
        }
      } catch (err) {
        console.error("Error fetching Bluesky feed:", err);
      } finally {
        if (active) setBskyLoading(false);
      }
    };

    fetchFeed();
    return () => {
      active = false;
    };
  }, [activeLocation, tab]);

  const loadMore = async () => {
    if (loadingMore || !bskyUntil || tab !== "feed") return;
    setLoadingMore(true);
    try {
      const q = activeLocation === "Tamilnadu" ? "tamilnadu" : "eelam";
      const res = await fetch(
        `https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&limit=30&until=${encodeURIComponent(bskyUntil)}`
      );
      const json = await res.json();
      if (json.posts && json.posts.length > 0) {
        setBskyPosts((prev) => {
          const existingUris = new Set(prev.map(p => p.uri));
          const seenLocal = new Set<string>();
          const filteredNew = json.posts.filter((p: any) => {
            if (!p?.uri) return false;
            if (existingUris.has(p.uri) || seenLocal.has(p.uri)) return false;
            seenLocal.add(p.uri);
            return true;
          });
          return [...prev, ...filteredNew];
        });
        const oldest = json.posts[json.posts.length - 1];
        const oldestDate = oldest.record?.createdAt || oldest.indexedAt;
        setBskyUntil(oldestDate || null);
      } else {
        setBskyUntil(null);
      }
    } catch (err) {
      console.error("Error loading more Bluesky posts:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const [defaultLocation, setDefaultLocation] = useState<"Tamilnadu" | "Eelam" | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("@pinned_spaces").then((val) => {
      if (val) {
        setPinnedIds(JSON.parse(val));
      }
    });
    AsyncStorage.getItem("@default_location").then((val) => {
      if (val === "Tamilnadu" || val === "Eelam") {
        setDefaultLocation(val);
        setActiveLocation(val);
      }
    });
  }, []);

  const saveDefaultLocation = async (loc: "Tamilnadu" | "Eelam") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const next = defaultLocation === loc ? null : loc;
    setDefaultLocation(next);
    if (next) {
      await AsyncStorage.setItem("@default_location", next);
    } else {
      await AsyncStorage.removeItem("@default_location");
    }
  };

  const togglePin = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const next = pinnedIds.includes(id)
      ? pinnedIds.filter((x) => x !== id)
      : [...pinnedIds, id];
    setPinnedIds(next);
    await AsyncStorage.setItem("@pinned_spaces", JSON.stringify(next));
  };

  const { messages: allMessages } = useSpacetimeDB();
  const { convos: bskyConvos, me: bskyMe } = useBskyChat();
  const constituencyMessages = allMessages.filter(
    (m) => m.roomType === "constituency"
  );

  const chatsUnreadTotal = useMemo(
    () =>
      (bskyConvos ?? []).reduce((sum, c) => sum + (c.unreadCount ?? 0), 0),
    [bskyConvos]
  );

  const privateChats = useMemo(
    () =>
      (bskyConvos ?? [])
        .filter((c) => !isGroupConvo(c))
        .map((c) => {
          const other =
            c.members.find((m) => m.did !== bskyMe?.did) ?? c.members[0];
          const name = other?.displayName ?? other?.handle ?? "Unknown";
          return {
            roomId: c.id,
            otherUserId: other?.did ?? "",
            otherName: name,
            otherHandle: other?.handle ?? "",
            otherAvatar: other?.avatar,
            lastBody: previewText(c),
            lastTime: c.lastEventAt ? Date.parse(c.lastEventAt) || 0 : 0,
            unread: c.unreadCount ?? 0,
          };
        })
        .sort((a, b) => b.lastTime - a.lastTime),
    [bskyConvos, bskyMe]
  );

  const filteredPrivate = useMemo(() => {
    if (!query.trim()) return privateChats;
    const q = query.toLowerCase();
    return privateChats.filter(
      (c) =>
        c.otherName.toLowerCase().includes(q) ||
        c.otherHandle.toLowerCase().includes(q) ||
        c.lastBody.toLowerCase().includes(q)
    );
  }, [privateChats, query]);

  const rows = useMemo(() => {
    if (activeLocation === "Eelam") {
      return EELAM_CONSTITUENCIES;
    }
    return constituencies.map((c) => {
      const msgs = constituencyMessages
        .filter((m) => m.roomId === c.code)
        .sort((a, b) => ts(b.sent) - ts(a.sent));
      return {
        id: c.id,
        code: c.code,
        slug: c.slug,
        nameEn: c.nameEn,
        nameTa: c.nameTa,
        district: c.district,
        number: c.number,
        reservation: c.reservation,
        messages: msgs.map((m, idx) => ({
          id: `${m.sender.toHexString()}_${ts(m.sent)}_${idx}`,
          body: m.body,
          createdAt: ts(m.sent),
        })),
      } as Row;
    });
  }, [constituencyMessages, activeLocation]);

  const feedMessages = useMemo(() => {
    if (activeLocation === "Eelam") {
      return [
        {
          id: "eelam-msg-1",
          body: "Jaffna AI Node started local economic planning. Register for the agricultural cooperative registry.",
          createdAt: Date.now() - 3600000 * 2,
          author: { id: "author-1", displayName: "Tharman S." },
          constituency: { code: "jaffna", nameEn: "Jaffna" }
        },
        {
          id: "eelam-msg-2",
          body: "Trincomalee social audit on land rights distribution is now complete. Review results in the audit ledger.",
          createdAt: Date.now() - 3600000 * 5,
          author: { id: "author-2", displayName: "Kayalvili K." },
          constituency: { code: "trincomalee", nameEn: "Trincomalee" }
        },
        {
          id: "eelam-msg-3",
          body: "Public discussion on the setup of local language councils in Batticaloa starts tonight at 7 PM.",
          createdAt: Date.now() - 3600000 * 12,
          author: { id: "author-3", displayName: "Sanjeev M." },
          constituency: { code: "batticaloa", nameEn: "Batticaloa" }
        }
      ] as any[];
    }
    return constituencyMessages
      .sort((a, b) => ts(b.sent) - ts(a.sent))
      .slice(0, 40)
      .map((m, idx) => ({
        id: `${m.sender.toHexString()}_${ts(m.sent)}_${idx}`,
        body: m.body,
        createdAt: ts(m.sent),
        author: { id: m.sender.toHexString(), displayName: m.sender.toHexString().slice(0, 8) },
        constituency: { code: m.roomId, nameEn: m.roomId },
      }));
  }, [constituencyMessages, activeLocation]);

  const ordered: Row[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? rows.filter(
          (r) =>
            r.nameEn.toLowerCase().includes(q) ||
            (r.nameTa ?? "").toLowerCase().includes(q) ||
            r.district.toLowerCase().includes(q) ||
            String(r.number) === q,
        )
      : rows;

    const pinned = filtered.filter((r) => pinnedIds.includes(r.id));
    const unpinned = filtered.filter((r) => !pinnedIds.includes(r.id));

    pinned.sort((a, b) => a.number - b.number);

    return [...pinned, ...unpinned];
  }, [rows, query, pinnedIds, constituency]);

  if (sessionLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
        }}
      >
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }
  if (!user) return <Redirect href="/sign-in" />;

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top brand header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 8,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "white",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <FiveWingAsterisk size={28} color={ACCENT} />
          
          <LocationSelector
            activeLocation={activeLocation}
            setActiveLocation={setActiveLocation}
            defaultLocation={defaultLocation}
            saveDefaultLocation={saveDefaultLocation}
          />
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.push("/profile");
          }}
          hitSlop={8}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Avatar
            name={profile?.displayName ?? "Me"}
            size={34}
            seed={user.id}
          />
        </Pressable>
      </View>

      {/* Search Bar */}
      {tab === "spaces" ? (
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 10,
            backgroundColor: "white",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: SURFACE_ALT,
              borderRadius: 20,
              height: 40,
              paddingHorizontal: 12,
            }}
          >
            <Ionicons name="search" size={16} color={MUTED} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search spaces or districts..."
              placeholderTextColor={MUTED}
              autoCorrect={false}
              autoCapitalize="none"
              style={{
                flex: 1,
                height: 40,
                paddingHorizontal: 8,
                color: TEXT,
                fontSize: 14,
              }}
            />
            {query ? (
              <Pressable
                onPress={() => setQuery("")}
                hitSlop={8}
                style={{ padding: 2 }}
              >
                <Ionicons name="close-circle" size={16} color={MUTED} />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {tab === "feed" ? (
        <FlashList
          data={bskyPosts}
          keyExtractor={(item) => item.uri}
          getItemType={(item) => {
            if (item.embed?.record) return "quoted";
            if (item.embed?.images?.length) return "image";
            if (item.embed?.external) return "link";
            return "text";
          }}
          refreshing={bskyLoading}
          onRefresh={async () => {
            setBskyLoading(true);
            try {
              const q = activeLocation === "Tamilnadu" ? "tamilnadu" : "eelam";
              const res = await fetch(
                `https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&limit=30`
              );
              const json = await res.json();
              if (json.posts) {
                setBskyPosts(json.posts);
                if (json.posts.length > 0) {
                  const oldest = json.posts[json.posts.length - 1];
                  const oldestDate = oldest.record?.createdAt || oldest.indexedAt;
                  setBskyUntil(oldestDate || null);
                } else {
                  setBskyUntil(null);
                }
              }
            } catch (err) {
              console.error("Error refreshing Bluesky feed:", err);
            } finally {
              setBskyLoading(false);
            }
          }}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 96,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 64 }}>
              {bskyLoading ? (
                <ActivityIndicator color={ACCENT} />
              ) : (
                <Text style={{ fontSize: 13, color: MUTED }}>No updates in feed yet.</Text>
              )}
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator color={ACCENT} />
              </View>
            ) : null
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <BskyFeedCard item={item} />
          )}
        />
      ) : tab === "chats" ? (
        <FlashList
          data={filteredPrivate}
          keyExtractor={(item) => item.roomId}
          contentContainerStyle={{ paddingBottom: insets.bottom + 168, flexGrow: 1 }}
          ListEmptyComponent={
            <ChatsEmpty
              icon="chatbubble-outline"
              title={query ? "No matches" : "No direct chats yet"}
              hint={
                query
                  ? "Try a different search."
                  : "Start a conversation from any space or profile."
              }
            />
          }
          renderItem={({ item }) => {
            const name = item.otherName || item.otherHandle || "Unknown";
            const hasUnread = item.unread > 0;
            return (
              <Pressable
                onPress={() =>
                  router.push(`/chats/private/${item.roomId}` as any)
                }
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: pressed ? SURFACE_HOVER : "white",
                })}
              >
                <Avatar
                  name={name}
                  size={44}
                  seed={item.otherUserId || item.roomId}
                  url={item.otherAvatar}
                />
                <View style={{ flex: 1, marginLeft: 14, minWidth: 0 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 15,
                      color: TEXT,
                      fontWeight: hasUnread ? "700" : "500",
                    }}
                  >
                    {name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 13,
                      color: hasUnread ? TEXT : MUTED,
                      marginTop: 2,
                      fontWeight: hasUnread ? "600" : "400",
                    }}
                  >
                    {item.lastBody}
                  </Text>
                </View>
                {hasUnread ? (
                  <ChatsUnreadBadge count={item.unread} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={MUTED} />
                )}
              </Pressable>
            );
          }}
        />
      ) : tab === "spaces" ? (
        <FlashList
          data={ordered}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{
            paddingVertical: 4,
            paddingBottom: insets.bottom + 96,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                paddingTop: 64,
                alignItems: "center",
                paddingHorizontal: 32,
              }}
            >
              <Text style={{ fontSize: 13, color: MUTED }}>No spaces</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ChatRow
              row={item}
              mine={false}
              isPinned={pinnedIds.includes(item.id)}
              onLongPress={() => togglePin(item.id)}
            />
          )}
        />
      ) : null}

      {/* Apps tab */}
      {tab === "apps" ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 16, paddingTop: 24 }}
        >
          <Pressable
            onPress={() => router.push("/agarathi" as any)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? SURFACE_HOVER : SURFACE_ALT,
              borderRadius: 16,
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              marginBottom: 12,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: ACCENT_SOFT, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="book" size={24} color={ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: TEXT, marginBottom: 2 }}>Agarathi</Text>
              <Text style={{ fontSize: 13, color: MUTED, lineHeight: 18 }}>
                Tamil dictionary powered by Sorkuvai — search any word for definitions, meanings and more.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={MUTED} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/tamil-tokenizer" as any)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? SURFACE_HOVER : SURFACE_ALT,
              borderRadius: 16,
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: ACCENT_SOFT, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="text" size={24} color={ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: TEXT, marginBottom: 2 }}>Tamil Tokenizer</Text>
              <Text style={{ fontSize: 13, color: MUTED, lineHeight: 18 }}>
                Split Tamil text into tokens, analyze syllables, and explore word structure.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={MUTED} />
          </Pressable>
        </ScrollView>
      ) : null}

      {/* New Message button (chats tab) */}
      {tab === "chats" ? (
        <Pressable
          onPress={() => router.push("/chats/private/new" as any)}
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 60 + Math.max(insets.bottom, 12) + 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 14,
            backgroundColor: ACCENT,
            borderRadius: 24,
          }}
        >
          <Ionicons name="create-outline" size={18} color="white" />
          <Text style={{ color: "white", fontSize: 15, fontWeight: "600", marginLeft: 6 }}>
            New Message
          </Text>
        </Pressable>
      ) : null}

      {/* Bottom Navigation Bar */}
      <View
        style={{
          flexDirection: "row",
          borderTopWidth: 1,
          borderTopColor: HAIRLINE,
          backgroundColor: "white",
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 8,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60 + Math.max(insets.bottom, 12),
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        <NavButton
          label="Spaces"
          icon={tab === "spaces" ? "planet" : "planet-outline"}
          active={tab === "spaces"}
          onPress={() => {
            if (tab !== "spaces") setQuery("");
            setTab("spaces");
          }}
        />
        <NavButton
          label="Feed"
          icon="#"
          active={tab === "feed"}
          onPress={() => {
            if (tab !== "feed") setQuery("");
            setTab("feed");
          }}
        />
        <NavButton
          label="Apps"
          icon={tab === "apps" ? "apps" : "apps-outline"}
          active={tab === "apps"}
          onPress={() => {
            if (tab !== "apps") setQuery("");
            setTab("apps");
          }}
        />
        <NavButton
          label="Chats"
          icon={tab === "chats" ? "chatbubble" : "chatbubble-outline"}
          active={tab === "chats"}
          badge={chatsUnreadTotal}
          onPress={() => {
            if (tab !== "chats") setQuery("");
            setTab("chats");
          }}
        />
      </View>
    </View>
  );
}

function ChatsUnreadBadge({ count }: { count: number }) {
  const label = count > 99 ? "99+" : String(count);
  return (
    <View
      style={{
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: ACCENT,
        paddingHorizontal: 6,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 6,
      }}
    >
      <Text style={{ color: "white", fontSize: 11, fontWeight: "700" }}>
        {label}
      </Text>
    </View>
  );
}

function ChatsEmpty({
  icon,
  title,
  hint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint: string;
}) {
  return (
    <View style={{ alignItems: "center", paddingTop: 64, paddingHorizontal: 32 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: SURFACE_ALT,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Ionicons name={icon} size={28} color={MUTED} />
      </View>
      <Text
        style={{
          fontSize: 16,
          color: TEXT,
          fontWeight: "500",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: MUTED,
          textAlign: "center",
          marginTop: 6,
          lineHeight: 18,
        }}
      >
        {hint}
      </Text>
    </View>
  );
}

function NavButton({
  label,
  icon,
  active,
  onPress,
  badge,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap | "#";
  active: boolean;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        height: 48,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View>
        {icon === "#" ? (
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: active ? ACCENT : MUTED,
              height: 22,
              lineHeight: 22,
              marginBottom: 2,
            }}
          >
            #
          </Text>
        ) : (
          <Ionicons
            name={icon as any}
            size={22}
            color={active ? ACCENT : MUTED}
            style={{ marginBottom: 2 }}
          />
        )}
        {badge && badge > 0 ? (
          <View
            style={{
              position: "absolute",
              top: -4,
              right: -10,
              minWidth: 16,
              height: 16,
              paddingHorizontal: 4,
              borderRadius: 8,
              backgroundColor: ACCENT,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1.5,
              borderColor: "white",
            }}
          >
            <Text style={{ color: "white", fontSize: 9, fontWeight: "700" }}>
              {badge > 99 ? "99+" : badge}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        style={{
          fontSize: 10,
          color: active ? ACCENT : MUTED,
          fontWeight: active ? "600" : "500",
          letterSpacing: 0.1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FeedCard({ item }: { item: any }) {
  const router = useRouter();
  
  return (
    <View
      style={{
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: HAIRLINE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      {/* Header: Author & Timestamp */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Avatar name={item.author?.displayName ?? "Anonymous"} size={32} seed={item.author?.id ?? "unknown"} />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: TEXT }}>
              {item.author?.displayName ?? "Anonymous User"}
            </Text>
            <Text style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>
              {formatTimestamp(item.createdAt)}
            </Text>
          </View>
        </View>

        {/* Constituency Badge */}
        {item.constituency ? (
          <Pressable
            onPress={() => router.push(`/spaces/${item.constituency.code}`)}
            style={({ pressed }) => ({
              backgroundColor: ACCENT_SOFT,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 11, color: ACCENT, fontWeight: "600" }}>
              #{item.constituency.nameEn}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Body text */}
      <Text
        style={{
          fontSize: 14,
          color: TEXT,
          lineHeight: 20,
          marginTop: 12,
          letterSpacing: 0.1,
        }}
      >
        {item.body}
      </Text>

      {/* Footer Mocks: Like/Comment */}
      <View
        style={{
          flexDirection: "row",
          marginTop: 14,
          paddingTop: 12,
          borderTopWidth: 0.5,
          borderTopColor: HAIRLINE,
          alignItems: "center",
        }}
      >
        <Pressable
          style={{ flexDirection: "row", alignItems: "center", marginRight: 24 }}
          hitSlop={6}
        >
          <Ionicons name="heart-outline" size={16} color={MUTED} />
          <Text style={{ fontSize: 12, color: MUTED, marginLeft: 4, fontWeight: "500" }}>
            Upvote
          </Text>
        </Pressable>
        
        <Pressable
          style={{ flexDirection: "row", alignItems: "center" }}
          hitSlop={6}
        >
          <Ionicons name="chatbubble-outline" size={15} color={MUTED} style={{ marginTop: 1 }} />
          <Text style={{ fontSize: 12, color: MUTED, marginLeft: 4, fontWeight: "500" }}>
            Discuss
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function BskyFeedCard({ item }: { item: any }) {
  const author = item.author || {};
  const record = item.record || {};
  const createdAt = Date.parse(record.createdAt || item.indexedAt || "");
  const timeLabel = isNaN(createdAt) ? "" : formatTimestamp(createdAt);
  const displayName = author.displayName || author.handle || "Bluesky User";
  const handle = author.handle || "handle";

  return (
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: HAIRLINE,
        backgroundColor: "white",
      }}
    >
      {/* Avatar column */}
      <View style={{ width: 40, marginRight: 12 }}>
        {author.avatar ? (
          <Image
            source={{ uri: author.avatar }}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: SURFACE_ALT }}
            contentFit="cover"
            transition={120}
            cachePolicy="memory-disk"
          />
        ) : (
          <Avatar name={displayName} size={40} seed={author.did || "bsky"} />
        )}
      </View>

      {/* Content column */}
      <View style={{ flex: 1, minWidth: 0 }}>
        {/* Header line: name · @handle · time */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 14, fontWeight: "700", color: TEXT, maxWidth: "55%" }}
          >
            {displayName}
          </Text>
          <Text
            numberOfLines={1}
            style={{ fontSize: 13, color: MUTED, marginLeft: 4, flexShrink: 1 }}
          >
            @{handle}
          </Text>
          {timeLabel ? (
            <>
              <Text style={{ fontSize: 13, color: MUTED, marginHorizontal: 4 }}>·</Text>
              <Text style={{ fontSize: 13, color: MUTED }}>{timeLabel}</Text>
            </>
          ) : null}
        </View>

        {/* Body */}
        {record.text ? (
          <Text style={{ fontSize: 14, color: TEXT, lineHeight: 19, marginTop: 2 }}>
            {renderRichText(record.text, record.facets, item.embed?.external?.uri)}
          </Text>
        ) : null}

        {/* Embedded image */}
        {item.embed?.images?.[0]?.thumb ? (
          <Image
            source={{ uri: item.embed.images[0].thumb }}
            style={{
              width: "100%",
              height: 180,
              borderRadius: 14,
              marginTop: 8,
              backgroundColor: SURFACE_ALT,
              borderWidth: 0.5,
              borderColor: HAIRLINE,
            }}
            contentFit="cover"
            transition={120}
            cachePolicy="memory-disk"
          />
        ) : null}

        {/* External link card */}
        {item.embed?.external ? (
          <ExternalLinkCard external={item.embed.external} />
        ) : null}

        {/* Quoted post */}
        {item.embed?.record ? (
          <QuotedPostCard record={item.embed.record} />
        ) : null}

        {/* Action row */}
        <View
          style={{
            flexDirection: "row",
            marginTop: 8,
            marginLeft: -6,
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: 320,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="chatbubble-outline" size={15} color={MUTED} />
            <Text style={{ fontSize: 12, color: MUTED, marginLeft: 6 }}>
              {item.replyCount ?? 0}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="repeat-outline" size={16} color={MUTED} />
            <Text style={{ fontSize: 12, color: MUTED, marginLeft: 6 }}>
              {item.repostCount ?? 0}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="heart-outline" size={15} color={MUTED} />
            <Text style={{ fontSize: 12, color: MUTED, marginLeft: 6 }}>
              {item.likeCount ?? 0}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="share-outline" size={15} color={MUTED} />
          </View>
        </View>
      </View>
    </View>
  );
}

function ChatRow({
  row,
  mine,
  isPinned,
  onLongPress,
}: {
  row: Row;
  mine: boolean;
  isPinned: boolean;
  onLongPress: () => void;
}) {
  const router = useRouter();
  const last = row.messages?.[0];
  return (
    <Pressable
      onPress={() => router.push(`/spaces/${row.code}`)}
      onLongPress={onLongPress}
      android_ripple={{ color: SURFACE_HOVER }}
      style={({ pressed }) => ({
        backgroundColor: pressed ? SURFACE_HOVER : isPinned ? SURFACE_ALT : "white",
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
      })}
    >
      <Avatar name={row.nameEn} size={44} seed={row.id} />

      <View style={{ flex: 1, marginLeft: 14, minWidth: 0 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: 15,
              color: TEXT,
              fontWeight: mine ? "600" : "500",
              letterSpacing: 0.1,
            }}
          >
            {row.nameEn}
          </Text>
          {last ? (
            <Text
              style={{
                fontSize: 12,
                color: MUTED,
                marginLeft: 8,
              }}
            >
              {formatTimestamp(last.createdAt)}
            </Text>
          ) : null}
        </View>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 13,
            color: MUTED,
            marginTop: 3,
            letterSpacing: 0.1,
          }}
        >
          {last?.body ?? `#${row.number} · ${row.district}`}
        </Text>
      </View>
    </Pressable>
  );
}

function formatTimestamp(t: number) {
  const d = new Date(t);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  const sameYear = d.getFullYear() === now.getFullYear();
  if (sameYear) {
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString([], { year: "numeric", month: "short" });
}

function LocationSelector({
  activeLocation,
  setActiveLocation,
  defaultLocation,
  saveDefaultLocation,
}: any) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const options = [
    { key: "Tamilnadu", label: "Tamil Nadu Community", memberCount: 5 },
    { key: "Eelam", label: "Eelam Community", memberCount: 4 },
  ];

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          opacity: pressed ? 0.7 : 1,
          marginLeft: 10,
        })}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: TEXT,
            letterSpacing: -0.4,
          }}
        >
          {activeLocation === "Tamilnadu" ? "Tamil Nadu Community" : "Eelam Community"}
        </Text>
        <Ionicons name="chevron-down" size={14} color={TEXT} style={{ marginLeft: 5, marginTop: 1 }} />
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "white", paddingTop: insets.top }}>
          {/* Modal Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: HAIRLINE,
            }}
          >
            <View>
              <Text style={{ fontSize: 20, fontWeight: "800", color: TEXT, letterSpacing: -0.3 }}>
                Select Community
              </Text>
              <Text style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                Long press to set as default community
              </Text>
            </View>
            <Pressable
              onPress={() => setOpen(false)}
              hitSlop={10}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: SURFACE_ALT,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="close" size={20} color={TEXT} />
            </Pressable>
          </View>

          {/* Location Flat List */}
          <View style={{ flex: 1 }}>
            {options.map((opt) => {
              const isActive = activeLocation === opt.key;
              const isDefault = defaultLocation === opt.key;

              return (
                <Pressable
                  key={opt.key}
                  onPress={() => {
                    setActiveLocation(opt.key);
                    setOpen(false);
                    router.push({
                      pathname: "/community",
                      params: { id: opt.key },
                    });
                  }}
                  onLongPress={() => {
                    saveDefaultLocation(opt.key as any);
                  }}
                  delayLongPress={350}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                    paddingVertical: 18,
                    backgroundColor: pressed ? SURFACE_HOVER : "white",
                    borderBottomWidth: 1,
                    borderBottomColor: HAIRLINE,
                  })}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: isActive ? "700" : "500",
                        color: isActive ? ACCENT : TEXT,
                      }}
                    >
                      {opt.label}
                    </Text>
                    {isDefault && (
                      <View
                        style={{
                          marginLeft: 8,
                          backgroundColor: ACCENT_SOFT,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                        }}
                      >
                        <Text style={{ fontSize: 10, color: ACCENT, fontWeight: "600" }}>
                          Default
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text
                    style={{
                      fontSize: 14,
                      color: isActive ? ACCENT : MUTED,
                      fontWeight: isActive ? "600" : "400",
                    }}
                  >
                    {opt.memberCount} members
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Footer Roadmap Section */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingBottom: Math.max(insets.bottom, 20),
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: HAIRLINE,
              backgroundColor: "white",
            }}
          >
            <Pressable
              onPress={() => {
                setOpen(false);
                router.push("/roadmap");
              }}
              style={({ pressed }) => ({
                backgroundColor: SURFACE_ALT,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: TEXT }}>
                View Project Roadmap
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

