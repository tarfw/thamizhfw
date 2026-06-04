import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import ImageViewer from "@/lib/ImageViewer";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Pressable } from "@/lib/Pressable";
import Avatar from "@/lib/Avatar";
import {
  getPostThread,
  replyToPost,
  loadSession,
  findMyLike,
  findMyRepost,
  likePost,
  unlikePost,
  repostPost,
  unrepostPost,
  type BskyThreadView,
  type BskyFeedItem,
} from "@/lib/bluesky-api";
import {
  renderRichText,
  ExternalLinkCard,
  ImageGrid,
  VideoEmbed,
  QuotedPostCard,
} from "@/lib/bskyPostRender";
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

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  if (n < 1_000_000) return Math.round(n / 1000) + "k";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
}

function PostRow({
  item,
  onReply,
  onImagePress,
}: {
  item: BskyFeedItem;
  onReply: () => void;
  onImagePress?: (images: { uri: string; alt?: string }[], index: number) => void;
}) {
  const router = useRouter();
  const author = item.author || {};
  const record = item.record || {};
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likeCount ?? 0);

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

  const handleLike = async () => {
    if (!item.cid) return;
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
    } catch {}
  };

  const handleRepost = async () => {
    if (!item.cid) return;
    try {
      if (reposted) {
        const repost = await findMyRepost(item.uri);
        if (repost) await unrepostPost(repost.rkey);
        setReposted(false);
      } else {
        await repostPost(item.uri, item.cid);
        setReposted(true);
      }
    } catch {}
  };

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
      <View style={{ flexDirection: "row" }}>
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
            <Avatar name={author.displayName || author.handle} size={40} seed={author.did} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: TEXT }}>
              {author.displayName || author.handle}
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 13, color: MUTED, marginLeft: 4, flexShrink: 1 }}>
              @{author.handle}
            </Text>
            {item.indexedAt ? (
              <>
                <Text style={{ color: MUTED, marginHorizontal: 4 }}>·</Text>
                <Text style={{ fontSize: 13, color: MUTED }}>
                  {formatRelative(item.indexedAt)}
                </Text>
              </>
            ) : null}
          </View>

          {record.text ? (
            <Text style={{ fontSize: 15, color: TEXT, lineHeight: 20, marginTop: 3 }}>
              {renderRichText(record.text, record.facets, undefined, (did) => router.push(`/profile?did=${encodeURIComponent(did)}`))}
            </Text>
          ) : null}

          {item.embed?.images && item.embed.images.length > 0 ? (
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
          ) : null}
          {item.embed?.video ? <VideoEmbed video={item.embed.video} /> : null}
          {item.embed?.external ? <ExternalLinkCard external={item.embed.external} /> : null}
          {item.embed?.record ? <QuotedPostCard record={item.embed.record} /> : null}

          <View style={{ flexDirection: "row", marginTop: 10, gap: 24 }}>
            <Pressable onPress={onReply} style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="chatbubble-outline" size={16} color={MUTED} />
              <Text style={{ fontSize: 13, color: MUTED, marginLeft: 4 }}>
                {formatCount(item.replyCount ?? 0)}
              </Text>
            </Pressable>
            <Pressable onPress={handleRepost} style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name={reposted ? "repeat" : "repeat-outline"}
                size={17}
                color={reposted ? ACCENT : MUTED}
              />
              <Text style={{ fontSize: 13, color: reposted ? ACCENT : MUTED, marginLeft: 4 }}>
                {formatCount(item.repostCount ?? 0)}
              </Text>
            </Pressable>
            <Pressable onPress={handleLike} style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={16}
                color={liked ? "#e0245e" : MUTED}
              />
              <Text style={{ fontSize: 13, color: liked ? "#e0245e" : MUTED, marginLeft: 4 }}>
                {formatCount(likeCount)}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function PostThreadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ uri?: string }>();

  const [thread, setThread] = useState<BskyThreadView | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);
  const [viewerImages, setViewerImages] = useState<{ uri: string; alt?: string }[] | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  const loadThread = useCallback(async () => {
    if (!params.uri) return;
    setLoading(true);
    const t = await getPostThread(params.uri);
    setThread(t);
    setLoading(false);
  }, [params.uri]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  const handleReply = async () => {
    if (!replyText.trim() || !thread?.post || posting) return;
    const session = await loadSession();
    if (!session) {
      router.push("/sign-in?reconnect=bluesky");
      return;
    }
    setPosting(true);
    try {
      const parent = thread.post;
      const rootUri = parent.record?.reply?.root?.uri || parent.uri;
      const rootCid = parent.record?.reply?.root?.uri ? "" : parent.cid;
      await replyToPost(
        replyText.trim(),
        parent.uri,
        parent.cid,
        rootUri,
        rootCid
      );
      setReplyText("");
      await loadThread();
    } catch (e) {
      console.error("Reply failed", e);
    } finally {
      setPosting(false);
    }
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
          Post
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          style={{ flex: 1 }}
          size="large"
          color={ACCENT}
        />
      ) : !thread ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: MUTED }}>Could not load thread.</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <FlatList
            data={thread.replies}
            keyExtractor={(_, i) => String(i)}
            ListHeaderComponent={() => (
              <View style={{ borderBottomWidth: 0.5, borderBottomColor: HAIRLINE }}>
                <PostRow
                  item={thread!.post}
                  onReply={() => replyText.length > 0 ? null : null}
                  onImagePress={(imgs, idx) => {
                    setViewerImages(imgs);
                    setViewerIndex(idx);
                  }}
                />
                {thread!.replies.length > 0 ? (
                  <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: TEXT_SECONDARY }}>
                      Replies ({thread!.replies.length})
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
            renderItem={({ item }) => (
              <PostRow
                item={item}
                onReply={() => {}}
                onImagePress={(imgs, idx) => {
                  setViewerImages(imgs);
                  setViewerIndex(idx);
                }}
              />
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
          />

          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderTopWidth: 0.5,
              borderTopColor: HAIRLINE,
              flexDirection: "row",
              alignItems: "center",
              paddingBottom: insets.bottom + 8,
            }}
          >
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Write a reply..."
              placeholderTextColor={MUTED}
              multiline
              style={{
                flex: 1,
                fontSize: 14,
                color: TEXT,
                maxHeight: 80,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: SURFACE_ALT,
                borderRadius: 20,
              }}
            />
            <Pressable
              onPress={handleReply}
              disabled={!replyText.trim() || posting}
              style={({ pressed }) => ({
                marginLeft: 8,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: replyText.trim() && !posting ? ACCENT : MUTED,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              {posting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="arrow-up" size={18} color="white" />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}

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
