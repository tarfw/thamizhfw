import { useState, useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "@/lib/Pressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ACCENT,
  ACCENT_SOFT,
  BORDER_IDLE,
  HAIRLINE,
  MUTED,
  SURFACE_ALT,
  SURFACE_HOVER,
  TEXT,
  TEXT_SECONDARY,
} from "@/lib/theme";

const TAMIL_BASE = /[\u0B80-\u0BFF]/;
const COMBINING = /[\u0BBE-\u0BCD\u0BD7]/;

function splitSyllables(word: string): string[] {
  const syllables: string[] = [];
  let current = "";
  for (const ch of word) {
    if (COMBINING.test(ch)) {
      current += ch;
    } else {
      if (current) syllables.push(current);
      current = ch;
    }
  }
  if (current) syllables.push(current);
  return syllables;
}

function splitWords(text: string): string[] {
  return text.split(/[\s\n\r]+/).filter(Boolean);
}

type TokenMode = "words" | "syllables" | "chars";

export default function TamilTokenizer() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<TokenMode>("words");

  const tokens = useMemo(() => {
    if (!text.trim()) return [];
    const words = splitWords(text);
    if (mode === "words") return words;
    if (mode === "chars") return text.split("");
    return words.flatMap((w) => splitSyllables(w));
  }, [text, mode]);

  const stats = useMemo(() => {
    const words = splitWords(text);
    const syllableCount = words.reduce((sum, w) => sum + splitSyllables(w).length, 0);
    return {
      wordCount: words.length,
      charCount: text.length,
      syllableCount,
      uniqueWords: new Set(words.map((w) => w.toLowerCase())).size,
    };
  }, [text]);

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ paddingTop: insets.top, backgroundColor: "white" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            height: 52,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
          >
            <Ionicons name="arrow-back" size={24} color={TEXT} />
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: "700", color: TEXT, marginLeft: 8 }}>
            Tamil Tokenizer
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        >
          {/* Input */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: MUTED,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Enter Tamil Text
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type or paste Tamil text here..."
            placeholderTextColor={MUTED}
            multiline
            numberOfLines={5}
            style={{
              borderWidth: 1,
              borderColor: BORDER_IDLE,
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              color: TEXT,
              lineHeight: 24,
              minHeight: 120,
              textAlignVertical: "top",
              backgroundColor: SURFACE_ALT,
            }}
          />

          {/* Stats */}
          {text.trim().length > 0 ? (
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginTop: 16,
                marginBottom: 20,
              }}
            >
              <StatBox label="Words" value={stats.wordCount} />
              <StatBox label="Syllables" value={stats.syllableCount} />
              <StatBox label="Characters" value={stats.charCount} />
              <StatBox label="Unique" value={stats.uniqueWords} />
            </View>
          ) : null}

          {/* Mode selector */}
          {text.trim().length > 0 ? (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: MUTED,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                View as
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {(["words", "syllables", "chars"] as TokenMode[]).map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    style={({ pressed }) => ({
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: mode === m ? ACCENT : SURFACE_ALT,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: mode === m ? "white" : TEXT,
                      }}
                    >
                      {m === "words" ? "Words" : m === "syllables" ? "Syllables" : "Characters"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {/* Tokens */}
          {tokens.length > 0 ? (
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: MUTED,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                {mode === "words" ? "Words" : mode === "syllables" ? "Syllables" : "Characters"} ({tokens.length})
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                {tokens.map((token, i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: SURFACE_ALT,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ fontSize: 15, color: TEXT }}>
                      {token || "(space)"}
                    </Text>
                    <Text style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>
                      {i + 1}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : text.trim().length > 0 ? (
            <View style={{ alignItems: "center", paddingTop: 40 }}>
              <Text style={{ color: MUTED, fontSize: 13 }}>No tokens to display</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: ACCENT_SOFT,
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "800", color: ACCENT }}>{value}</Text>
      <Text style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{label}</Text>
    </View>
  );
}
