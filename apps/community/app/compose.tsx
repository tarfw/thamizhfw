import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Pressable } from "@/lib/Pressable";
import { createPost, uploadBlob } from "@/lib/bluesky-api";
import {
  ACCENT,
  HAIRLINE,
  MUTED,
  SURFACE_ALT,
  TEXT,
  TEXT_SECONDARY,
} from "@/lib/theme";

const MAX_IMAGES = 4;
const MAX_CHARS = 300;
const ALLOWED_VIDEO_MIME = ["video/mp4"];

type SelectedImage = {
  uri: string;
  alt: string;
  mimeType: string;
  width: number;
  height: number;
};

type SelectedVideo = {
  uri: string;
  alt: string;
  mimeType: string;
  width: number;
  height: number;
};

type LinkMeta = {
  uri: string;
  title: string;
  description: string;
};

export default function ComposeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ quoteUri?: string; quoteCid?: string }>();
  const quoteUri = params.quoteUri;
  const quoteCid = params.quoteCid;
  const isQuote = !!(quoteUri && quoteCid);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [video, setVideo] = useState<SelectedVideo | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkMeta, setLinkMeta] = useState<LinkMeta>({ uri: "", title: "", description: "" });
  const [editingAltIndex, setEditingAltIndex] = useState<number | null>(null);
  const [showVideoAlt, setShowVideoAlt] = useState(false);

  const hashtagCount = (text.match(/#\w+/g) || []).length;
  const hasImages = images.length > 0;
  const hasVideo = video !== null;
  const hasMedia = hasImages || hasVideo;
  const hasLink = linkMeta.uri.trim().length > 0;
  const charsLeft = MAX_CHARS - text.length;
  const canPost = (text.trim().length > 0 || hasMedia || hasLink) && !posting;

  const pickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert("Limit reached", `You can attach up to ${MAX_IMAGES} images.`);
      return;
    }
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission required", "Photo library access is needed to attach images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.85,
    });
    if (result.canceled) return;
    const newImages: SelectedImage[] = result.assets.map((a) => ({
      uri: a.uri,
      alt: "",
      mimeType: a.mimeType ?? "image/jpeg",
      width: a.width ?? 0,
      height: a.height ?? 0,
    }));
    setImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
    setVideo(null);
  };

  const pickVideo = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission required", "Video library access is needed.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsMultipleSelection: false,
    });
    if (result.canceled) return;
    const a = result.assets[0];
    const mimeType = a.mimeType ?? "video/mp4";
    if (!ALLOWED_VIDEO_MIME.includes(mimeType)) {
      Alert.alert(
        "Unsupported format",
        `Bluesky requires MP4 video. Got "${mimeType}". Please convert your video to MP4 and try again.`
      );
      return;
    }
    setVideo({
      uri: a.uri,
      alt: "",
      mimeType,
      width: a.width ?? 16,
      height: a.height ?? 9,
    });
    setImages([]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (editingAltIndex === index) setEditingAltIndex(null);
    else if (editingAltIndex !== null && editingAltIndex > index) {
      setEditingAltIndex(editingAltIndex - 1);
    }
  };

  const removeVideo = () => {
    setVideo(null);
    setShowVideoAlt(false);
  };

  const updateAlt = (index: number, alt: string) => {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, alt } : img)));
  };

  const clearLink = () => {
    setLinkMeta({ uri: "", title: "", description: "" });
    setShowLinkInput(false);
  };

  const handlePost = async () => {
    if (!canPost) return;
    setPosting(true);

    try {
      let embed: Record<string, unknown> | undefined;

      if (isQuote) {
        embed = { $type: "app.bsky.embed.record", record: { uri: quoteUri, cid: quoteCid } };
      } else if (hasImages) {
        const uploaded = await Promise.all(
          images.map((img) => uploadBlob(img.uri, img.mimeType))
        );
        embed = {
          $type: "app.bsky.embed.images",
          images: images.map((img, i) => ({
            image: uploaded[i],
            alt: img.alt || "",
            aspectRatio: img.width && img.height
              ? { width: img.width, height: img.height }
              : undefined,
          })),
        };
      } else if (hasVideo && video) {
        const blob = await uploadBlob(video.uri, video.mimeType);
        embed = {
          $type: "app.bsky.embed.video",
          video: blob,
          alt: video.alt || "",
          aspectRatio: video.width && video.height
            ? { width: video.width, height: video.height }
            : undefined,
        };
      } else if (hasLink) {
        embed = {
          $type: "app.bsky.embed.external",
          external: {
            uri: linkMeta.uri,
            title: linkMeta.title || linkMeta.uri,
            description: linkMeta.description || "",
          },
        };
      }

      await createPost(text.trim(), embed);
      router.back();
    } catch (e: any) {
      Alert.alert("Failed to post", e?.message ?? "Unknown error");
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
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => ({
            paddingHorizontal: 8,
            paddingVertical: 6,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ fontSize: 16, color: TEXT_SECONDARY }}>Cancel</Text>
        </Pressable>

        <Pressable
          onPress={handlePost}
          disabled={!canPost}
          style={({ pressed }) => ({
            paddingHorizontal: 20,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: canPost ? ACCENT : MUTED,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          {posting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={{ color: "white", fontSize: 15, fontWeight: "600" }}>Post</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <TextInput
            value={text}
            onChangeText={(val) => {
              const tags = (val.match(/#\w+/g) || []).length;
              if (tags > 3) return;
              setText(val);
            }}
            placeholder="What's on your mind?"
            placeholderTextColor={MUTED}
            multiline
            autoFocus
            style={{
              fontSize: 16,
              color: TEXT,
              lineHeight: 22,
              paddingHorizontal: 16,
              paddingTop: 16,
              minHeight: 120,
              textAlignVertical: "top",
            }}
          />

          {/* Quote indicator */}
          {isQuote ? (
            <View style={{ marginHorizontal: 16, marginTop: 8, padding: 12, backgroundColor: SURFACE_ALT, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: ACCENT }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="chatbox-ellipses-outline" size={14} color={ACCENT} />
                <Text style={{ fontSize: 12, color: MUTED, fontWeight: "600" }}>Quoting a post</Text>
              </View>
              <Text style={{ fontSize: 12, color: TEXT, marginTop: 2 }} numberOfLines={2}>{quoteUri}</Text>
            </View>
          ) : null}

          {/* Image previews */}
          {images.length > 0 ? (
            <View style={{ paddingHorizontal: 12, paddingTop: 8, gap: 8 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {images.map((img, i) => (
                  <View key={i} style={{ position: "relative" }}>
                    <Image
                      source={{ uri: img.uri }}
                      style={{ width: 96, height: 96, borderRadius: 8, backgroundColor: SURFACE_ALT }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                    <Pressable
                      onPress={() => removeImage(i)}
                      hitSlop={8}
                      style={{
                        position: "absolute", top: -6, right: -6, width: 22, height: 22,
                        borderRadius: 11, backgroundColor: "rgba(0,0,0,0.6)",
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Ionicons name="close" size={14} color="white" />
                    </Pressable>
                    <Pressable
                      onPress={() => setEditingAltIndex(editingAltIndex === i ? null : i)}
                      hitSlop={6}
                      style={{
                        position: "absolute", bottom: 4, left: 4,
                        backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 4,
                        paddingHorizontal: 5, paddingVertical: 2,
                      }}
                    >
                      <Text style={{ fontSize: 10, color: "white", fontWeight: "600" }}>ALT</Text>
                    </Pressable>
                  </View>
                ))}
                {images.length < MAX_IMAGES ? (
                  <Pressable
                    onPress={pickImages}
                    style={{
                      width: 96, height: 96, borderRadius: 8, borderWidth: 1.5,
                      borderColor: HAIRLINE, borderStyle: "dashed",
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Ionicons name="add" size={28} color={MUTED} />
                  </Pressable>
                ) : null}
              </ScrollView>
              {editingAltIndex !== null && images[editingAltIndex] ? (
                <TextInput
                  value={images[editingAltIndex].alt}
                  onChangeText={(val) => updateAlt(editingAltIndex, val)}
                  placeholder="Describe this image for accessibility"
                  placeholderTextColor={MUTED}
                  style={{
                    borderWidth: 1, borderColor: HAIRLINE, borderRadius: 8,
                    paddingHorizontal: 10, paddingVertical: 8, fontSize: 13,
                    color: TEXT, backgroundColor: SURFACE_ALT,
                  }}
                />
              ) : null}
            </View>
          ) : null}

          {/* Video preview */}
          {hasVideo && video ? (
            <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
              <View style={{ position: "relative", width: 160, height: 120, borderRadius: 8, backgroundColor: SURFACE_ALT, overflow: "hidden" }}>
                <Image
                  source={{ uri: video.uri }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <View style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  alignItems: "center", justifyContent: "center",
                }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.6)",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Ionicons name="play" size={22} color="white" style={{ marginLeft: 2 }} />
                  </View>
                </View>
                <Pressable
                  onPress={removeVideo}
                  hitSlop={8}
                  style={{
                    position: "absolute", top: -6, right: -6, width: 22, height: 22,
                    borderRadius: 11, backgroundColor: "rgba(0,0,0,0.6)",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Ionicons name="close" size={14} color="white" />
                </Pressable>
              </View>
              <Pressable
                onPress={() => setShowVideoAlt(!showVideoAlt)}
                hitSlop={6}
                style={{ marginTop: 6, alignSelf: "flex-start" }}
              >
                <Text style={{ fontSize: 12, color: ACCENT, fontWeight: "500" }}>
                  {video.alt ? "Edit video alt text" : "Add alt text"}
                </Text>
              </Pressable>
              {showVideoAlt ? (
                <TextInput
                  value={video.alt}
                  onChangeText={(val) => setVideo((prev) => prev ? { ...prev, alt: val } : prev)}
                  placeholder="Describe this video for accessibility"
                  placeholderTextColor={MUTED}
                  style={{
                    borderWidth: 1, borderColor: HAIRLINE, borderRadius: 8,
                    paddingHorizontal: 10, paddingVertical: 8, fontSize: 13,
                    color: TEXT, backgroundColor: SURFACE_ALT, marginTop: 4,
                  }}
                />
              ) : null}
            </View>
          ) : null}

          {/* External link input */}
          {showLinkInput ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: TEXT_SECONDARY }}>Attach Link</Text>
                <Pressable onPress={clearLink} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={MUTED} />
                </Pressable>
              </View>
              <TextInput
                value={linkMeta.uri}
                onChangeText={(val) => setLinkMeta((p) => ({ ...p, uri: val }))}
                placeholder="https://"
                placeholderTextColor={MUTED}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={{
                  borderWidth: 1, borderColor: HAIRLINE, borderRadius: 8,
                  paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: TEXT,
                }}
              />
              <TextInput
                value={linkMeta.title}
                onChangeText={(val) => setLinkMeta((p) => ({ ...p, title: val }))}
                placeholder="Link title (optional)"
                placeholderTextColor={MUTED}
                style={{
                  borderWidth: 1, borderColor: HAIRLINE, borderRadius: 8,
                  paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: TEXT,
                }}
              />
              <TextInput
                value={linkMeta.description}
                onChangeText={(val) => setLinkMeta((p) => ({ ...p, description: val }))}
                placeholder="Link description (optional)"
                placeholderTextColor={MUTED}
                multiline
                numberOfLines={2}
                style={{
                  borderWidth: 1, borderColor: HAIRLINE, borderRadius: 8,
                  paddingHorizontal: 10, paddingVertical: 8, fontSize: 14,
                  color: TEXT, minHeight: 60, textAlignVertical: "top",
                }}
              />
            </View>
          ) : null}

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Toolbar */}
        <View
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            paddingHorizontal: 8, paddingVertical: 6,
            borderTopWidth: 0.5, borderTopColor: HAIRLINE,
            marginBottom: insets.bottom,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Pressable
              onPress={() => {
                if (isQuote) { Alert.alert("Cannot attach", "Quoted posts cannot include media."); return; }
                if (hasVideo) { Alert.alert("Cannot attach", "Remove the video first to add images."); return; }
                pickImages();
              }}
              hitSlop={8}
              style={({ pressed }) => ({ padding: 8, borderRadius: 8, opacity: (pressed || isQuote) ? 0.35 : 1 })}
            >
              <Ionicons name={hasImages ? "images" : "image-outline"} size={22} color={hasImages ? ACCENT : MUTED} />
            </Pressable>
            <Pressable
              onPress={() => {
                if (isQuote) { Alert.alert("Cannot attach", "Quoted posts cannot include media."); return; }
                if (hasImages) { Alert.alert("Cannot attach", "Remove images first to add a video."); return; }
                if (hasLink) { Alert.alert("Cannot attach", "Links cannot be added with video."); return; }
                pickVideo();
              }}
              hitSlop={8}
              style={({ pressed }) => ({ padding: 8, borderRadius: 8, opacity: (pressed || isQuote) ? 0.35 : 1 })}
            >
              <Ionicons name={hasVideo ? "videocam" : "videocam-outline"} size={22} color={hasVideo ? ACCENT : MUTED} />
            </Pressable>
            <Pressable
              onPress={() => {
                if (isQuote) { Alert.alert("Cannot attach", "Quoted posts cannot include media."); return; }
                if (hasMedia) { Alert.alert("Cannot attach", "Links cannot be added with media."); return; }
                setShowLinkInput(!showLinkInput);
              }}
              hitSlop={8}
              style={({ pressed }) => ({ padding: 8, borderRadius: 8, opacity: (pressed || isQuote) ? 0.35 : 1 })}
            >
              <Ionicons name={hasLink ? "link" : "link-outline"} size={22} color={hasLink ? ACCENT : MUTED} />
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {hashtagCount > 0 ? (
              <Text style={{ fontSize: 13, color: hashtagCount > 3 ? "#FF0050" : MUTED, fontWeight: "500", marginRight: 12 }}>
                {hashtagCount}/3 hashtags
              </Text>
            ) : null}
            <Text style={{ fontSize: 13, color: charsLeft < 0 ? "#FF0050" : charsLeft < 20 ? "#E68A00" : MUTED, fontWeight: "500" }}>
              {charsLeft}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
