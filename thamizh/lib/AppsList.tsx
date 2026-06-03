import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { Pressable } from "@/lib/Pressable";
import {
  ACCENT,
  ACCENT_SOFT,
  HAIRLINE,
  MUTED,
  SURFACE_HOVER,
  TEXT,
} from "@/lib/theme";

const APPS = [
  {
    name: "Agarathi",
    description: "Tamil dictionary powered by Sorkuvai — search any word for definitions, meanings and more.",
    icon: "book" as const,
    route: "/agarathi",
  },
  {
    name: "Tamil Tokenizer",
    description: "Split Tamil text into tokens, analyze syllables, and explore word structure.",
    icon: "text" as const,
    route: "/tamil-tokenizer",
  },
  {
    name: "Blood",
    description: "Blood donor registry — find donors, request blood, and manage your donations.",
    icon: "water" as const,
    route: "/blood",
  },
];

export default function AppsList() {
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 200 }}
    >
      <Text
        style={{
          fontSize: 10,
          color: MUTED,
          fontWeight: "700",
          letterSpacing: 1.2,
          marginTop: 28,
          marginBottom: 8,
          marginHorizontal: 20,
          textTransform: "uppercase",
        }}
      >
        Apps
      </Text>

      {APPS.map((app) => (
        <Pressable
          key={app.route}
          onPress={() => router.push(app.route as any)}
          android_ripple={{ color: SURFACE_HOVER }}
          style={({ pressed }) => ({
            backgroundColor: pressed ? SURFACE_HOVER : "white",
            paddingHorizontal: 20,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            borderBottomWidth: 0.5,
            borderBottomColor: HAIRLINE,
          })}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: ACCENT_SOFT,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
          >
            <Ionicons name={app.icon} size={18} color={ACCENT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                color: TEXT,
                fontWeight: "500",
                letterSpacing: 0.1,
              }}
            >
              {app.name}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: MUTED,
                marginTop: 2,
              }}
            >
              {app.description}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={MUTED} />
        </Pressable>
      ))}
    </ScrollView>
  );
}
