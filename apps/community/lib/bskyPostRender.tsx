import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ResizeMode, Video } from "expo-av";
import React, { useRef, useState } from "react";
import { Linking, Modal, Platform, StatusBar, Text, View } from "react-native";
import { Pressable } from "@/lib/Pressable";
import { HAIRLINE, MUTED, SURFACE_ALT, TEXT } from "./theme";
import type {
  BskyEmbedExternal,
  BskyEmbedRecord,
  BskyFeedItem,
  BskyPostFacet,
  BskyPostImage,
  BskyVideoEmbed,
} from "./bluesky-api";

export const LINK_BLUE = "#1d9bf0";

export function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname === "/" ? "" : u.pathname;
    const tail = (host + path).replace(/\/$/, "");
    return tail.length > 28 ? tail.slice(0, 27) + "\u2026" : tail;
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, "");
  }
}

/**
 * Render a Bluesky post's text with tappable mentions, links, and tags.
 *
 * Links open in the system browser.
 * Mentions open the Bluesky profile in browser (in-app profile nav coming).
 * Tags open a Bluesky search for that tag.
 *
 * `stripUrl` — if set, the URL that matches will be omitted from the output
 * (used when an external link card is rendered separately).
 *
 * NOTE: Since this returns Pressable elements, the caller must render inside
 * a `<View>` (not `<Text>`) to avoid React Native's nested text restriction.
 */
export function renderRichText(
  text: string,
  facets?: BskyPostFacet[],
  stripUrl?: string,
  onNavigateToProfile?: (did: string) => void
): (string | React.ReactElement | null)[] {
  if (!text) return [];

  const segments = segmentsFromFacets(text, facets);

  if (!facets || facets.length === 0) {
    return fallbackSplit(text, stripUrl);
  }

  return segments.map((seg, i) => {
    if (seg.kind === "text") {
      if (stripUrl && seg.value === stripUrl) return null;
      if (!seg.value) return null;
      return seg.value;
    }
    if (seg.kind === "link") {
      if (stripUrl && seg.value === stripUrl) return null;
      return (
        <Text
          key={`f-${i}`}
          onPress={() => Linking.openURL(seg.uri)}
          style={{ color: LINK_BLUE, textDecorationLine: "underline" as const }}
        >
          {shortenUrl(seg.value)}
        </Text>
      );
    }
    if (seg.kind === "mention") {
      return (
        <Text
          key={`f-${i}`}
          onPress={() => {
            if (onNavigateToProfile) {
              onNavigateToProfile(seg.did);
            } else {
              Linking.openURL(`https://bsky.app/profile/${seg.did}`);
            }
          }}
          style={{ color: LINK_BLUE }}
        >
          {seg.value}
        </Text>
      );
    }
    if (seg.kind === "tag") {
      return (
        <Text
          key={`f-${i}`}
          onPress={() =>
            Linking.openURL(
              `https://bsky.app/search?q=${encodeURIComponent(seg.tag)}`
            )
          }
          style={{ color: LINK_BLUE }}
        >
          {seg.value}
        </Text>
      );
    }
    return null;
  });
}

type RichSegment =
  | { kind: "text"; value: string }
  | { kind: "link"; value: string; uri: string }
  | { kind: "mention"; value: string; did: string }
  | { kind: "tag"; value: string; tag: string };

function segmentsFromFacets(
  text: string,
  facets?: BskyPostFacet[]
): RichSegment[] {
  if (!facets || facets.length === 0) {
    return [{ kind: "text", value: text }];
  }

  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  const len = bytes.length;
  const decoder = new TextDecoder("utf-8");

  const byteSlice = (start: number, end: number) =>
    decoder.decode(bytes.slice(start, end));

  const marks = facets
    .map((f) => {
      const start = f.index?.byteStart ?? 0;
      const end = f.index?.byteEnd ?? 0;
      if (end <= start || end > len) return null;
      const value = byteSlice(start, end);
      const feature = f.features?.[0];
      if (!feature) return null;
      if (feature.$type === "app.bsky.richtext.facet#link") {
        return { start, end, kind: "link" as const, value, uri: feature.uri };
      }
      if (feature.$type === "app.bsky.richtext.facet#mention") {
        return { start, end, kind: "mention" as const, value, did: feature.did };
      }
      if (feature.$type === "app.bsky.richtext.facet#tag") {
        return { start, end, kind: "tag" as const, value, tag: feature.tag };
      }
      return null;
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => a.start - b.start);

  if (marks.length === 0) {
    return [{ kind: "text", value: text }];
  }

  const out: RichSegment[] = [];
  let cursor = 0;
  for (const m of marks) {
    if (m.start > cursor) {
      out.push({ kind: "text", value: byteSlice(cursor, m.start) });
    }
    out.push(m);
    cursor = m.end;
  }
  if (cursor < len) {
    out.push({ kind: "text", value: byteSlice(cursor, len) });
  }
  return out;
}

function fallbackSplit(
  text: string,
  stripUrl?: string
): (string | React.ReactElement | null)[] {
  const parts = text.split(/(#[\p{L}\p{N}_]+|@[\w.-]+|https?:\/\/\S+)/gu);
  return parts
    .map((part, i) => {
      if (!part) return null;
      if (/^https?:\/\//.test(part)) {
        if (stripUrl && part.replace(/\/$/, "") === stripUrl.replace(/\/$/, "")) {
          return null;
        }
        return (
          <Text
            key={`r-${i}`}
            onPress={() => Linking.openURL(part)}
            style={{ color: LINK_BLUE, textDecorationLine: "underline" as const }}
          >
            {shortenUrl(part)}
          </Text>
        );
      }
      if (part[0] === "#") {
        return (
          <Text
            key={`r-${i}`}
            onPress={() =>
              Linking.openURL(
                `https://bsky.app/search?q=${encodeURIComponent(part.slice(1))}`
              )
            }
            style={{ color: LINK_BLUE }}
          >
            {part}
          </Text>
        );
      }
      if (part[0] === "@") {
        return (
          <Text
            key={`r-${i}`}
            onPress={() =>
              Linking.openURL(
                `https://bsky.app/profile/${encodeURIComponent(part.slice(1))}`
              )
            }
            style={{ color: LINK_BLUE }}
          >
            {part}
          </Text>
        );
      }
      return part;
    })
    .filter((p): p is string | React.ReactElement => p !== null);
}

export function ExternalLinkCard({
  external,
}: {
  external: BskyEmbedExternal;
}) {
  if (!external?.uri) return null;
  return (
    <View
      style={{
        marginTop: 8,
        borderWidth: 0.5,
        borderColor: HAIRLINE,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: "white",
        flexDirection: "row",
        alignItems: "stretch",
      }}
    >
      {external.thumb ? (
        <Image
          source={{ uri: external.thumb }}
          style={{ width: 64, height: 64, backgroundColor: SURFACE_ALT }}
          contentFit="cover"
          transition={120}
          cachePolicy="memory-disk"
        />
      ) : null}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 10,
          paddingVertical: 8,
          justifyContent: "center",
          minWidth: 0,
        }}
      >
        {external.title ? (
          <Text
            style={{ fontSize: 13, color: TEXT, fontWeight: "500" }}
            numberOfLines={2}
          >
            {external.title}
          </Text>
        ) : null}
        <Text
          style={{ fontSize: 11, color: MUTED, marginTop: 2 }}
          numberOfLines={1}
        >
          {shortenUrl(external.uri)}
        </Text>
      </View>
    </View>
  );
}

export function QuotedPostCard({
  record,
}: {
  record: BskyEmbedRecord | undefined;
}) {
  if (!record?.uri) return null;
  const author = record.author;
  const text = record.value?.text ?? "";
  return (
    <View
      style={{
        marginTop: 8,
        borderWidth: 0.5,
        borderColor: HAIRLINE,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: "white",
      }}
    >
      {author ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 10,
            paddingTop: 8,
            paddingBottom: 4,
          }}
        >
          {author.avatar ? (
            <Image
              source={{ uri: author.avatar }}
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                marginRight: 6,
                backgroundColor: SURFACE_ALT,
              }}
              contentFit="cover"
              transition={120}
              cachePolicy="memory-disk"
            />
          ) : null}
          <Text
            numberOfLines={1}
            style={{ fontSize: 12, fontWeight: "600", color: TEXT }}
          >
            {author.displayName || author.handle}
          </Text>
          <Text
            numberOfLines={1}
            style={{ fontSize: 12, color: MUTED, marginLeft: 4 }}
          >
            @{author.handle}
          </Text>
        </View>
      ) : null}
      {text ? (
        <Text
          numberOfLines={4}
          style={{
            fontSize: 13,
            color: TEXT,
            lineHeight: 18,
            paddingHorizontal: 10,
            paddingBottom: 10,
          }}
        >
          {renderRichText(text, undefined)}
        </Text>
      ) : null}
    </View>
  );
}

export function VideoEmbed({ video }: { video: BskyVideoEmbed }) {
  const [showPlayer, setShowPlayer] = useState(false);
  if (!video?.playlist) return null;

  const isGif = video.presentation === "gif";
  const aspect = video.aspectRatio
    ? video.aspectRatio.width / video.aspectRatio.height
    : 16 / 9;

  return (
    <>
      <Pressable
        onPress={() => !isGif && setShowPlayer(true)}
        style={{
          marginTop: 8,
          borderRadius: 10,
          overflow: "hidden",
          backgroundColor: SURFACE_ALT,
          aspectRatio: aspect,
        }}
      >
        {video.thumbnail ? (
          <Image
            source={{ uri: video.thumbnail }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={120}
            cachePolicy="memory-disk"
          />
        ) : null}
        {!isGif ? (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "rgba(0,0,0,0.6)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="play" size={24} color="white" style={{ marginLeft: 2 }} />
            </View>
          </View>
        ) : null}
      </Pressable>

      {showPlayer && (
        <VideoPlayerModal
          uri={video.playlist}
          thumbnail={video.thumbnail}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </>
  );
}

function VideoPlayerModal({
  uri,
  thumbnail,
  onClose,
}: {
  uri: string;
  thumbnail?: string;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<any>({});
  const videoRef = useRef<any>(null);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: "black", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" />
        <Pressable
          onPress={onClose}
          style={{
            position: "absolute",
            top: Platform.OS === "ios" ? 56 : 40,
            left: 12,
            zIndex: 10,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="close" size={22} color="white" />
        </Pressable>

        <Video
          ref={videoRef}
          source={{ uri }}
          style={{ width: "100%", aspectRatio: 16 / 9 }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          onPlaybackStatusUpdate={setStatus}
          posterSource={thumbnail ? { uri: thumbnail } : undefined}
          posterStyle={{ resizeMode: "contain" }}
        />
      </View>
    </Modal>
  );
}

export function ImageGrid({
  images,
  onImagePress,
}: {
  images: BskyPostImage[];
  onImagePress?: (index: number) => void;
}) {
  if (!images || images.length === 0) return null;
  const shown = images.slice(0, 4);
  const count = shown.length;
  const single = count === 1;
  const pair = count === 2;
  const quad = count === 4;

  return (
    <View
      style={{
        marginTop: 8,
        borderRadius: 10,
        overflow: "hidden",
        flexDirection: "row",
        flexWrap: "wrap",
      }}
    >
      {shown.map((img, idx) => {
        const widthPct: `${number}%` = single
          ? "100%"
          : pair
            ? "50%"
            : quad
              ? "50%"
              : "33.333%";
        return (
          <Pressable
            key={`img-${idx}-${img.thumb}`}
            onPress={() => onImagePress?.(idx)}
            style={{
              width: widthPct,
              aspectRatio: single ? 16 / 10 : 1,
              padding: 1,
            }}
          >
            <Image
              source={{ uri: img.thumb }}
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: SURFACE_ALT,
                borderRadius: 4,
              }}
              contentFit="cover"
              transition={120}
              cachePolicy="memory-disk"
            />
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Get the primary image for a post (first embed image, or fallback to the
 * `images` field already extracted by the mapper). Returns null if none.
 */
export function getPrimaryImage(item: BskyFeedItem): BskyPostImage | null {
  const fromEmbed = item.embed?.images?.[0];
  if (fromEmbed) return fromEmbed;
  if (item.images?.[0]) return item.images[0];
  return null;
}
