import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Pressable } from "@/lib/Pressable";
import Avatar from "@/lib/Avatar";
import {
  listNotifications,
  type BskyNotification,
} from "@/lib/bluesky-api";
import { renderRichText } from "@/lib/bskyPostRender";
import {
  ACCENT,
  HAIRLINE,
  MUTED,
  SURFACE_ALT,
  SURFACE_HOVER,
  TEXT,
  TEXT_SECONDARY,
} from "@/lib/theme";

function formatRelative(iso: string): string {
  const ms = new Date(iso).getTime();
  if (!ms) return "";
  const diff = Date.now() - ms;
  if (diff < 0) return "now";
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const REASON_ICONS: Record<string, string> = {
  like: "heart",
  repost: "repeat",
  follow: "person-add",
  reply: "chatbubble",
  quote: "quote",
};

const REASON_LABELS: Record<string, string> = {
  like: "liked your post",
  repost: "reposted your post",
  follow: "followed you",
  reply: "replied to your post",
  quote: "quoted your post",
};

function NotificationRow({ item }: { item: BskyNotification }) {
  const router = useRouter();
  const author = item.author || {};
  const icon = REASON_ICONS[item.reason] || "notifications";

  return (
    <Pressable
      onPress={() => {
        if (item.reasonSubject) {
          router.push(`/post-thread?uri=${encodeURIComponent(item.reasonSubject)}`);
        }
      }}
      android_ripple={{ color: SURFACE_HOVER }}
      style={({ pressed }) => ({
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: pressed ? SURFACE_HOVER : item.isRead ? "white" : "#F0F7FF",
        borderBottomWidth: 0.5,
        borderBottomColor: HAIRLINE,
      })}
    >
      <View style={{ width: 40, marginRight: 12, alignItems: "center" }}>
        {author.avatar ? (
          <Image
            source={{ uri: author.avatar }}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: SURFACE_ALT }}
            contentFit="cover"
            transition={120}
            cachePolicy="memory-disk"
          />
        ) : (
          <Avatar name={author.displayName || author.handle} size={40} seed={author.did} />
        )}
        <View
          style={{
            position: "absolute",
            bottom: -2,
            right: -4,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: ACCENT,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon as any} size={10} color="white" />
        </View>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 13, color: TEXT_SECONDARY, lineHeight: 18 }}>
          <Text style={{ fontWeight: "600", color: TEXT }}>
            {author.displayName || author.handle}
          </Text>{" "}
          {REASON_LABELS[item.reason] || "interacted"}
        </Text>
        {item.record?.text ? (
          <Text
            numberOfLines={2}
            style={{ fontSize: 13, color: MUTED, marginTop: 2 }}
          >
            {item.record.text}
          </Text>
        ) : null}
        <Text style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>
          {formatRelative(item.indexedAt)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<BskyNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { notifications: n, cursor: c } = await listNotifications(50);
      setNotifications(n);
      setCursor(c);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    if (loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const { notifications: n, cursor: c } = await listNotifications(50);
      setNotifications((prev) => [...prev, ...n]);
      setCursor(c);
    } catch {}
    setLoadingMore(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 12,
          paddingBottom: 10,
          borderBottomWidth: 0.5,
          borderBottomColor: HAIRLINE,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "700", color: TEXT, marginLeft: 8 }}>
          Notifications
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color={ACCENT} />
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="notifications-off-outline" size={48} color={MUTED} />
          <Text style={{ color: MUTED, marginTop: 12, fontSize: 15 }}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.uri}
          renderItem={({ item }) => <NotificationRow item={item} />}
          onEndReached={loadMore}
          onEndReachedThreshold={3}
        />
      )}
    </View>
  );
}
