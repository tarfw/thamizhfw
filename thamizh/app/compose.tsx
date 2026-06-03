import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable } from "@/lib/Pressable";
import { createPost } from "@/lib/bluesky-api";
import {
  ACCENT,
  HAIRLINE,
  MUTED,
  SURFACE_ALT,
  TEXT,
  TEXT_SECONDARY,
} from "@/lib/theme";

export default function ComposeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const canPost = text.trim().length > 0 && !posting;
  const charsLeft = 300 - text.length;

  const handlePost = async () => {
    if (!canPost) return;
    setPosting(true);
    try {
      await createPost(text.trim());
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
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="What's on your mind?"
          placeholderTextColor={MUTED}
          multiline
          autoFocus
          style={{
            flex: 1,
            fontSize: 16,
            color: TEXT,
            lineHeight: 22,
            paddingHorizontal: 16,
            paddingTop: 16,
            textAlignVertical: "top",
          }}
        />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderTopWidth: 0.5,
            borderTopColor: HAIRLINE,
            marginBottom: insets.bottom,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: charsLeft < 0 ? "#FF0050" : charsLeft < 20 ? "#E68A00" : MUTED,
              fontWeight: "500",
            }}
          >
            {charsLeft}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
