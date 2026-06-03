import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useState, useRef } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  View,
  FlatList,
} from "react-native";
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
} from "@/lib/theme";

const BLOOD_RED = "#D93025";
const BLOOD_RED_SOFT = "#FCE8E6";

const QUICK_ACTIONS = [
  {
    icon: "heart-circle" as const,
    label: "Request Blood",
    desc: "Post an urgent request",
    color: BLOOD_RED,
    bg: BLOOD_RED_SOFT,
  },
  {
    icon: "search" as const,
    label: "Find Donors",
    desc: "AI-matched by vector",
    color: "#E37400",
    bg: "#FFF1E0",
  },
  {
    icon: "medkit" as const,
    label: "Nearby Camps",
    desc: "Donation drives near you",
    color: "#188038",
    bg: "#E6F4EA",
  },
  {
    icon: "sparkles" as const,
    label: "AI Assistant",
    desc: "Ask anything about blood",
    color: ACCENT,
    bg: ACCENT_SOFT,
  },
];

const AI_SUGGESTIONS = [
  "Where can I donate today?",
  "Am I eligible to donate?",
  "Find O- donors near me",
  "Iron-rich food recommendations",
];

type Message = {
  id: string;
  role: "user" | "ai";
  text: string;
};

export default function BloodScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      text: "Hi, I'm your blood AI assistant. I can help you request blood, find donors, locate camps, or answer any blood donation questions. What do you need?",
    },
  ]);

  const handleSend = () => {
    if (!query.trim()) return;
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: query.trim(),
    };
    const aiReply: Message = {
      id: `ai-${Date.now()}`,
      role: "ai",
      text: "I'm scanning donor vectors and nearby camps matching your request. In production, this would connect to the blood donor registry and return AI-curated results.",
    };
    setMessages((prev) => [...prev, userMsg, aiReply]);
    setQuery("");
  };

  const handleSuggestion = (text: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
    };
    const aiReply: Message = {
      id: `ai-${Date.now()}`,
      role: "ai",
      text: "I'm scanning donor vectors and nearby camps matching your request. In production, this would connect to the blood donor registry and return AI-curated results.",
    };
    setMessages((prev) => [...prev, userMsg, aiReply]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: BLOOD_RED,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "700", color: "white" }}>
          Blood
        </Text>
        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
          AI-powered blood donation network
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: SURFACE_ALT,
              borderRadius: 12,
              paddingHorizontal: 12,
              height: 44,
            }}
          >
            <Ionicons name="sparkles" size={16} color={ACCENT} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ask AI — request blood, find donors..."
              placeholderTextColor={MUTED}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              style={{
                flex: 1,
                height: 44,
                paddingHorizontal: 8,
                color: TEXT,
                fontSize: 14,
              }}
            />
            <Pressable
              onPress={handleSend}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Ionicons name="send" size={18} color={query.trim() ? BLOOD_RED : MUTED} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 12 }}
          >
            {AI_SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => handleSuggestion(s)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? SURFACE_HOVER : SURFACE_ALT,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 16,
                  marginRight: 8,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ fontSize: 12, color: TEXT, fontWeight: "500" }}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            paddingHorizontal: 16,
            marginTop: 20,
            gap: 10,
          }}
        >
          {QUICK_ACTIONS.map((a) => (
            <Pressable
              key={a.label}
              onPress={() => handleSuggestion(a.desc)}
              style={({ pressed }) => ({
                width: "48%",
                backgroundColor: pressed ? SURFACE_HOVER : "white",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: HAIRLINE,
                padding: 16,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: a.bg,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                <Ionicons name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: "600", color: TEXT }}>
                {a.label}
              </Text>
              <Text style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                {a.desc}
              </Text>
            </Pressable>
          ))}
        </View>

        {messages.length > 1 && (
          <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
            <Text
              style={{
                fontSize: 10,
                color: MUTED,
                fontWeight: "700",
                letterSpacing: 1.2,
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              Conversation
            </Text>
            {messages.slice(1).map((msg) => (
              <View
                key={msg.id}
                style={{
                  backgroundColor: msg.role === "ai" ? SURFACE_ALT : BLOOD_RED_SOFT,
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8,
                  alignSelf: msg.role === "ai" ? "flex-start" : "flex-end",
                  maxWidth: "85%",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <Ionicons
                    name={msg.role === "ai" ? "sparkles" : "person"}
                    size={12}
                    color={msg.role === "ai" ? ACCENT : BLOOD_RED}
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: msg.role === "ai" ? ACCENT : BLOOD_RED,
                      marginLeft: 4,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {msg.role === "ai" ? "AI" : "You"}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: TEXT, lineHeight: 19 }}>
                  {msg.text}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
