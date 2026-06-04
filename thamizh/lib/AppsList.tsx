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
import { APPS } from "@/lib/apps";

const SECTIONS = [
  { title: "AI AGENTS", items: APPS.filter((a) => a.category === "built") },
  { title: "TAMIL GENOCIDE", items: APPS.filter((a) => a.category === "agent") },
];

export default function AppsList() {
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 200 }}
    >
      {SECTIONS.map((section) => (
        <View key={section.title}>
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
            {section.title}
          </Text>

          {section.items.map((app) => (
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
        </View>
      ))}
    </ScrollView>
  );
}
