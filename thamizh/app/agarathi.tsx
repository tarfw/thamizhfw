import { useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
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
  HAIRLINE,
  MUTED,
  SURFACE_ALT,
  SURFACE_HOVER,
  TEXT,
  TEXT_SECONDARY,
} from "@/lib/theme";

type SorkuvaiResult = {
  EnWo: string;
  TaWo: string;
  POS: string;
};

type SorkuvaiResponse = {
  status: string;
  lang: string;
  list1: { category: string; list: SorkuvaiResult[] }[];
  list2: { category: string; list: string[] }[];
  list3: { category: string; list: SorkuvaiResult[] }[];
  list4: { category: string; list: SorkuvaiResult[] }[];
  list5: { category: string; list: SorkuvaiResult[] }[];
};

export default function Agarathi() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SorkuvaiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://sorkuvai.tn.gov.in/api?q=${encodeURIComponent(q)}`
      );
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: SorkuvaiResponse = await res.json();
      if (data.status !== "Success") throw new Error("No results found");
      setResults(data);
    } catch (e: any) {
      setError(e.message ?? "Failed to fetch");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const hasResults = results && results.list1?.length > 0;
  const isTamilQuery = results?.lang === "ta";
  const definitions = results?.list2?.flatMap((g) => g.list) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top header */}
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
            Agarathi
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {/* Results area */}
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color={ACCENT} size="large" />
            </View>
          ) : error ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
              <Ionicons name="alert-circle-outline" size={40} color={MUTED} />
              <Text style={{ color: TEXT, fontSize: 15, marginTop: 12, textAlign: "center" }}>{error}</Text>
            </View>
          ) : hasResults ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}
            >
              {/* Detailed definitions (list2 - only for Tamil queries) */}
              {isTamilQuery && definitions.length > 0 ? (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                    Definition
                  </Text>
                  {definitions.map((html, i) => (
                    <View
                      key={i}
                      style={{
                        backgroundColor: ACCENT_SOFT,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 8,
                      }}
                    >
                      <DefinitionView html={html} />
                    </View>
                  ))}
                </View>
              ) : null}

              {/* list1 - Primary translations */}
              {results.list1.map((group, gi) => (
                <View key={`l1-${gi}`} style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                    {group.category}
                  </Text>
                  {group.list.map((item, i) => (
                    <ResultRow key={i} item={item} />
                  ))}
                </View>
              ))}

              {/* list3 - Category-specific */}
              {results.list3?.length > 0 ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                    By Category
                  </Text>
                  {results.list3.map((group, gi) => (
                    <View key={`l3-${gi}`} style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 }}>{group.category}</Text>
                      {group.list.map((item, i) => (
                        <ResultRow key={i} item={item} />
                      ))}
                    </View>
                  ))}
                </View>
              ) : null}

              {/* list4, list5 - Additional */}
              {results.list5?.length > 0 ? (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: MUTED, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                    More
                  </Text>
                  {[...(results.list4 ?? []), ...results.list5].flatMap((g) => g.list).map((item, i) => (
                    <ResultRow key={`more-${i}`} item={item} />
                  ))}
                </View>
              ) : null}
            </ScrollView>
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: ACCENT_SOFT, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Ionicons name="book" size={28} color={ACCENT} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "600", color: TEXT, marginBottom: 6 }}>
                Tamil Dictionary
              </Text>
              <Text style={{ fontSize: 13, color: MUTED, textAlign: "center", lineHeight: 18 }}>
                Powered by Sorkuvai{'\n'}Type a word below to search
              </Text>
            </View>
          )}
        </View>

        {/* Bottom search bar - like a chat input */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 8) + 8,
            backgroundColor: "white",
            borderTopWidth: 1,
            borderTopColor: HAIRLINE,
            gap: 8,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: SURFACE_ALT,
              borderRadius: 22,
              paddingHorizontal: 14,
              height: 44,
            }}
          >
            <Ionicons name="search" size={18} color={MUTED} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={search}
              placeholder="Search English or Tamil..."
              placeholderTextColor={MUTED}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={{ flex: 1, color: TEXT, fontSize: 15, marginLeft: 8, paddingVertical: 0 }}
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => {
                  setQuery("");
                  setResults(null);
                  setError(null);
                  inputRef.current?.focus();
                }}
                hitSlop={6}
              >
                <Ionicons name="close-circle" size={18} color={MUTED} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={search}
            disabled={!query.trim() || loading}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: query.trim() && !loading ? ACCENT : SURFACE_ALT,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Ionicons
              name="arrow-up"
              size={22}
              color={query.trim() && !loading ? "white" : MUTED}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function ResultRow({ item }: { item: SorkuvaiResult }) {
  return (
    <View
      style={{
        backgroundColor: SURFACE_ALT,
        borderRadius: 10,
        padding: 12,
        marginBottom: 6,
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: "600", color: ACCENT }}>
        {item.TaWo}
      </Text>
      <Text style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 2 }}>
        {item.EnWo}
        {item.POS && item.POS !== "null" && item.POS !== "unclassified" ? (
          <Text style={{ color: MUTED }}> ({item.POS})</Text>
        ) : null}
      </Text>
    </View>
  );
}

function DefinitionView({ html }: { html: string }) {
  const parts = html.split(/<BR\s?\/?>/i).filter(Boolean);
  const wordLine = parts[0] ?? "";
  const rest = parts.slice(1);

  const word = wordLine.replace(/<[^>]*>/g, "").trim();
  const pronunciation = rest.find((p) => /^[a-zāīūōṉṟṅñṭḷṅṁṉṟ]/i.test(p) && p.length < 30) ?? "";
  const pos = rest.find((p) => /^[அ-ஹ]\./.test(p) || /^[a-z]\./.test(p)) ?? "";
  const meaningLines = rest.filter((p) => p !== pronunciation && p !== pos);

  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: "800", color: TEXT }}>{word}</Text>
      {pronunciation ? (
        <Text style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 2 }}>{pronunciation}</Text>
      ) : null}
      {pos ? (
        <Text style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>{pos}</Text>
      ) : null}
      {meaningLines.map((line, i) => {
        const clean = line.replace(/<[^>]*>/g, "").trim();
        if (!clean) return null;
        return (
          <Text key={i} style={{ fontSize: 14, color: TEXT, marginTop: 6, lineHeight: 20 }}>
            {clean}
          </Text>
        );
      })}
    </View>
  );
}
