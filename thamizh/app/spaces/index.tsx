import { Ionicons } from "@expo/vector-icons";
import { FiveWingAsterisk } from "@/lib/FiveWingAsterisk";
import { Stack, Link, Redirect, useRouter } from "expo-router";
import { useMemo, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Share,
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
import type { BskySearchPost, BskyFeedItem } from "@/lib/bluesky-api";
import { loadSession } from "@/lib/bluesky-auth";
import {
  likePost,
  unlikePost,
  repostPost,
  unrepostPost,
  findMyLike,
  findMyRepost,
  listNotifications,
  sharePostUrl,
} from "@/lib/bluesky-api";
import Avatar from "@/lib/Avatar";
import {
  renderRichText,
  ExternalLinkCard,
  ImageGrid,
  VideoEmbed,
  QuotedPostCard,
} from "@/lib/bskyPostRender";
import ImageViewer from "@/lib/ImageViewer";
import AppsList from "@/lib/AppsList";
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
type BskyPost = BskySearchPost | BskyFeedItem;

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
  const [bskyPosts, setBskyPosts] = useState<BskyPost[]>([]);
  const [bskyLoading, setBskyLoading] = useState(false);
  const [bskyCursor, setBskyCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [bskyAuthed, setBskyAuthed] = useState(false);
  const [notifUnreadTotal, setNotifUnreadTotal] = useState(0);
  const [viewerImages, setViewerImages] = useState<{ uri: string; alt?: string }[] | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    if (tab !== "feed") return;

    let active = true;
    const fetchFeed = async () => {
      setBskyLoading(true);
      setBskyCursor(null);
      try {
        const session = await loadSession();
        if (active) setBskyAuthed(!!session);
      } catch {
        console.warn("Session load failed");
      }

      try {
        const q = activeLocation === "Tamilnadu" ? "tamilnadu" : "eelam";
        const res = await fetch(
          `https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&limit=30`
        );
        const json = await res.json();
        if (active && json.posts) {
          const posts: BskyPost[] = json.posts.filter(
            (p: any): p is BskyPost => !!p?.uri
          );
          const seen = new Set<string>();
          const unique = posts.filter((p) => {
            if (seen.has(p.uri)) return false;
            seen.add(p.uri);
            return true;
          });
          setBskyPosts(unique);
          setBskyCursor(json.cursor ?? null);
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
    if (loadingMore || !bskyCursor || tab !== "feed") return;
    setLoadingMore(true);
    let newPosts: BskyPost[] = [];

    try {
      await loadSession();
      const q = activeLocation === "Tamilnadu" ? "tamilnadu" : "eelam";
      const res = await fetch(
        `https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&limit=30&cursor=${encodeURIComponent(bskyCursor)}`
      );
      const json = await res.json();
      if (json.posts) {
        newPosts = json.posts.filter((p: any): p is BskyPost => !!p?.uri);
      }
      setBskyCursor(json.cursor ?? null);
    } catch (err) {
      console.error("Error loading more Bluesky posts:", err);
    }

    if (newPosts.length > 0) {
      setBskyPosts((prev) => {
        const existingUris = new Set(prev.map(p => p.uri));
        const seenLocal = new Set<string>();
        const filteredNew = newPosts.filter((p) => {
          if (existingUris.has(p.uri) || seenLocal.has(p.uri)) return false;
          seenLocal.add(p.uri);
          return true;
        });
        return [...prev, ...filteredNew];
      });
    } else {
      setBskyCursor(null);
    }

    setLoadingMore(false);
  };

  useEffect(() => {
    if (!bskyAuthed) { setNotifUnreadTotal(0); return; }
    let active = true;
    const check = async () => {
      try {
        const { notifications } = await listNotifications(20);
        if (active) {
          setNotifUnreadTotal(notifications.filter((n) => !n.isRead).length);
        }
      } catch {}
    };
    check();
    const id = setInterval(check, 60000);
    return () => { active = false; clearInterval(id); };
  }, [bskyAuthed]);

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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <FiveWingAsterisk size={28} color={ACCENT} />
          <LocationSelector
            activeLocation={activeLocation}
            setActiveLocation={setActiveLocation}
            defaultLocation={defaultLocation}
            saveDefaultLocation={saveDefaultLocation}
          />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {tab === "feed" && bskyAuthed ? (
            <>
              <Pressable
                onPress={() => router.push("/compose")}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Ionicons name="create-outline" size={22} color={TEXT} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/notifications")}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, position: "relative" })}
              >
                <Ionicons name="notifications-outline" size={22} color={TEXT} />
                {notifUnreadTotal > 0 ? (
                <View
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -4,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: "#FF0050",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 10, fontWeight: "700" }}>
                    {notifUnreadTotal > 9 ? "9+" : notifUnreadTotal}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            </>
          ) : null}
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
            setBskyCursor(null);
            try {
              const session = await loadSession();
              setBskyAuthed(!!session);
            } catch {}
            try {
              const q = activeLocation === "Tamilnadu" ? "tamilnadu" : "eelam";
              const res = await fetch(
                `https://api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&limit=30`
              );
              const json = await res.json();
              if (json.posts) {
                const posts = json.posts.filter((p: any): p is BskyPost => !!p?.uri);
                setBskyPosts(posts);
                setBskyCursor(json.cursor ?? null);
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
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 64, paddingHorizontal: 32 }}>
              {bskyLoading ? (
                <ActivityIndicator color={ACCENT} />
              ) : !bskyAuthed ? (
                <>
                  <Ionicons name="flame-outline" size={48} color={ACCENT} />
                  <Text style={{ fontSize: 15, color: TEXT, marginTop: 12, textAlign: "center" }}>
                    Sign in to Bluesky to see your timeline
                  </Text>
                  <Pressable
                    onPress={() => router.push("/sign-in?reconnect=bluesky")}
                    style={({ pressed }) => ({
                      marginTop: 16,
                      paddingHorizontal: 24,
                      paddingVertical: 10,
                      borderRadius: 20,
                      backgroundColor: pressed ? ACCENT + "CC" : ACCENT,
                    })}
                  >
                    <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
                      Sign in
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Text style={{ fontSize: 13, color: MUTED }}>No posts in your feed yet.</Text>
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
            <BskyFeedCard item={item} onImagePress={(images, idx) => { setViewerImages(images); setViewerIndex(idx); }} />
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
      ) : tab === "apps" ? (
        <AppsList />
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
          badge={notifUnreadTotal}
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

      {viewerImages ? (
        <ImageViewer
          images={viewerImages}
          initialIndex={viewerIndex}
          visible
          onClose={() => setViewerImages(null)}
        />
      ) : null}
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

function formatRelativeTime(iso: string): string {
  const ms = new Date(iso).getTime();
  if (!ms) return "";
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 0) return "now";
  if (diff < 60) return `${diff}s`;
  const min = Math.floor(diff / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const BSKY_REPOST = "#00BA7C";
const BSKY_LIKE = "#FF0050";

function BskyFeedCard({ item, onImagePress }: { item: BskyPost; onImagePress?: (images: { uri: string; alt?: string }[], index: number) => void }) {
  const router = useRouter();
  const author = item.author || {};
  const record = item.record || {};
  const timeLabel = formatRelativeTime(item.indexedAt || record.createdAt || "");
  const displayName = author.displayName || author.handle || "Bluesky User";
  const handle = author.handle || "handle";

  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likeCount ?? 0);
  const [repostCount, setRepostCount] = useState(item.repostCount ?? 0);

  useEffect(() => {
    if (!item.uri) return;
    let active = true;
    const check = async () => {
      const like = await findMyLike(item.uri);
      if (active && like) setLiked(true);
      const repost = await findMyRepost(item.uri);
      if (active && repost) setReposted(true);
    };
    check();
    return () => { active = false; };
  }, [item.uri]);

  const goToProfile = () => {
    const did = author.did;
    if (did) router.push(`/profile?did=${encodeURIComponent(did)}`);
  };

  const handleLike = async () => {
    if (!item.cid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      if (liked) {
        const like = await findMyLike(item.uri);
        if (like) await unlikePost(like.rkey);
        setLiked(false);
        setLikeCount((c) => Math.max(0, c - 1));
      } else {
        await likePost(item.uri, item.cid);
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch (e) {
      console.error("Like toggle failed", e);
    }
  };

  const handleRepost = async () => {
    if (!item.cid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      if (reposted) {
        const repost = await findMyRepost(item.uri);
        if (repost) await unrepostPost(repost.rkey);
        setReposted(false);
        setRepostCount((c) => Math.max(0, c - 1));
      } else {
        await repostPost(item.uri, item.cid);
        setReposted(true);
        setRepostCount((c) => c + 1);
      }
    } catch (e) {
      console.error("Repost toggle failed", e);
    }
  };

  return (
    <Pressable
      onPress={() => {
        if (item.uri) router.push(`/post-thread?uri=${encodeURIComponent(item.uri)}`);
      }}
      style={({ pressed }) => ({
        flexDirection: "row",
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: "#E5E7EB",
        backgroundColor: pressed ? "#F9FAFB" : "white",
      })}
    >
      {/* Avatar column */}
      <Pressable onPress={goToProfile} style={{ width: 42, marginRight: 10 }}>
        {author.avatar ? (
          <Image
            source={{ uri: author.avatar }}
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "#E5E7EB" }}
            contentFit="cover"
            transition={120}
            cachePolicy="memory-disk"
          />
        ) : (
          <Avatar name={displayName} size={42} seed={author.did || "bsky"} />
        )}
      </Pressable>

      {/* Content column */}
      <View style={{ flex: 1, minWidth: 0 }}>
        {/* Header: display name + handle + time */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 15, fontWeight: "600", color: "#1A1A1A", maxWidth: "50%" }}
          >
            {displayName}
          </Text>
          <Text
            numberOfLines={1}
            style={{ fontSize: 14, color: "#8899A6", marginLeft: 4, flexShrink: 1 }}
          >
            @{handle}
          </Text>
          {timeLabel ? (
            <>
              <Text style={{ fontSize: 14, color: "#8899A6", marginHorizontal: 4 }}>·</Text>
              <Text style={{ fontSize: 14, color: "#8899A6" }}>{timeLabel}</Text>
            </>
          ) : null}
        </View>

        {/* Post body */}
        {record.text ? (
          <Text style={{ fontSize: 15, color: "#1A1A1A", lineHeight: 21, letterSpacing: 0.1 }}>
            {renderRichText(record.text, record.facets, item.embed?.external?.uri)}
          </Text>
        ) : null}

        {/* Embedded images */}
        {item.embed?.images && item.embed.images.length > 0 ? (
          <View style={{ marginTop: 8 }}>
            <ImageGrid
              images={item.embed.images}
              onImagePress={(idx) => {
                const imgs = item.embed!.images!.map((img) => ({
                  uri: img.fullsize || img.thumb,
                  alt: img.alt,
                }));
                onImagePress?.(imgs, idx);
              }}
            />
          </View>
        ) : null}

        {/* Video embed */}
        {item.embed?.video ? (
          <View style={{ marginTop: 8 }}><VideoEmbed video={item.embed.video} /></View>
        ) : null}

        {/* External link card */}
        {item.embed?.external ? (
          <View style={{ marginTop: 8 }}><ExternalLinkCard external={item.embed.external} /></View>
        ) : null}

        {/* Quoted post */}
        {item.embed?.record ? (
          <View style={{ marginTop: 8 }}><QuotedPostCard record={item.embed.record} /></View>
        ) : null}

        {/* Action row — Bluesky-style: evenly spaced across full width */}
        <View
          style={{
            flexDirection: "row",
            marginTop: 6,
            marginLeft: -8,
            alignItems: "center",
            justifyContent: "space-between",
            paddingRight: 16,
          }}
        >
          <ActionButton
            icon={item.replyCount && item.replyCount > 0 ? "chatbubble" : "chatbubble-outline"}
            count={item.replyCount ?? 0}
            color="#8899A6"
            activeColor="#8899A6"
            onPress={() => {
              if (item.uri) router.push(`/post-thread?uri=${encodeURIComponent(item.uri)}`);
            }}
          />
          <ActionButton
            icon={reposted ? "repeat" : "repeat-outline"}
            count={repostCount}
            color="#8899A6"
            activeColor={BSKY_REPOST}
            active={reposted}
            onPress={handleRepost}
          />
          <ActionButton
            icon={liked ? "heart" : "heart-outline"}
            count={likeCount}
            color="#8899A6"
            activeColor={BSKY_LIKE}
            active={liked}
            onPress={handleLike}
          />
          <ActionButton
            icon="share-outline"
            color="#8899A6"
            activeColor="#8899A6"
            onPress={async () => {
              const url = await sharePostUrl(item.uri);
              Share.share({ url, message: url });
            }}
          />
        </View>
      </View>
    </Pressable>
  );
}

function ActionButton({
  icon,
  count,
  color,
  activeColor,
  active,
  onPress,
}: {
  icon: string;
  count?: number;
  color: string;
  activeColor: string;
  active?: boolean;
  onPress: () => void;
}) {
  const c = active ? activeColor : color;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Ionicons name={icon as any} size={16} color={c} />
      {count !== undefined ? (
        <Text style={{ fontSize: 12, color: c, marginLeft: 4, minWidth: 12 }}>
          {count > 0 ? count : ""}
        </Text>
      ) : null}
    </Pressable>
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
}: any) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const options = [
    { key: "Tamilnadu", label: "Tamil Nadu Community" },
    { key: "Eelam", label: "Eelam Community" },
  ];

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          alignSelf: "flex-start",
          backgroundColor: ACCENT + "12",
          borderRadius: 16,
          paddingHorizontal: 12,
          paddingVertical: 5,
          marginLeft: 4,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={{ fontSize: 13, fontWeight: "500", color: ACCENT }}>
          {activeLocation === "Tamilnadu" ? "Tamil Nadu" : "Eelam"}
        </Text>
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable
            onPress={() => setOpen(false)}
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
          />

          <View
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 12,
              paddingHorizontal: 20,
              paddingBottom: Math.max(insets.bottom, 20) + 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              elevation: 10,
            }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: HAIRLINE,
                alignSelf: "center",
                marginBottom: 24,
              }}
            />

            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: TEXT,
                marginBottom: 8,
              }}
            >
              Select Community
            </Text>

            <View style={{ gap: 4, marginBottom: 24 }}>
              {options.map((opt) => {
                const isActive = activeLocation === opt.key;

                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => {
                      setActiveLocation(opt.key);
                      setOpen(false);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      backgroundColor: pressed ? SURFACE_HOVER : "transparent",
                    })}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: isActive ? "600" : "400",
                        color: isActive ? ACCENT : TEXT,
                      }}
                    >
                      {opt.label}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={20} color={ACCENT} />
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => {
                setOpen(false);
                router.push({ pathname: "/community", params: { id: activeLocation } });
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: pressed ? SURFACE_HOVER : "transparent",
              })}
            >
              <Ionicons name="people-outline" size={18} color={TEXT} />
              <Text style={{ fontSize: 15, color: TEXT }}>View Members</Text>
            </Pressable>

            <View style={{ height: 12 }} />

            <Pressable
              onPress={() => {
                setOpen(false);
                router.push("/browser");
              }}
              hitSlop={8}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                alignSelf: "flex-start",
              })}
            >
              <Text style={{ fontSize: 13, color: MUTED }}>
                Thamizh docs
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

