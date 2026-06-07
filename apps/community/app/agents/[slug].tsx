import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ACCENT, ACCENT_SOFT, HAIRLINE, MUTED, SURFACE_ALT, TEXT } from "@/lib/theme";
import { getAppBySlug } from "@/lib/apps";

export default function AgentDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const agent = getAppBySlug(slug);
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen options={{ headerTitle: agent?.name ?? "Agent", headerBackVisible: false }} />
      <View
        style={{
          paddingTop: insets.top,
          borderBottomWidth: 1,
          borderBottomColor: HAIRLINE,
        }}
      >
        <View
          style={{
            height: 56,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              flex: 1,
              fontSize: 18,
              color: TEXT,
              fontWeight: "500",
              letterSpacing: 0.1,
            }}
            numberOfLines={1}
          >
            {agent?.name ?? "Agent"}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={{ alignItems: "center", paddingTop: 32, paddingHorizontal: 24 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: ACCENT_SOFT,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={agent?.icon ?? "construct-outline"} size={32} color={ACCENT} />
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "500",
              color: TEXT,
              marginTop: 16,
              textAlign: "center",
              letterSpacing: 0.1,
            }}
          >
            {agent?.name ?? slug}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: TEXT,
              marginTop: 20,
              lineHeight: 22,
              textAlign: "center",
            }}
          >
            {agent?.description ?? "Coming soon."}
          </Text>

          <View
            style={{
              marginTop: 32,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 12,
              backgroundColor: SURFACE_ALT,
            }}
          >
            <Text style={{ fontSize: 12, color: MUTED, fontWeight: "500" }}>
              AI agent · Coming soon
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
