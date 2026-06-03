import { Text, View, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable } from "@/lib/Pressable";
import { useState } from "react";
import { HAIRLINE, TEXT } from "@/lib/theme";

const TARGET_URL = "http://thamizh.app/";

export default function Browser() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 8,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: HAIRLINE,
          backgroundColor: "white",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </Pressable>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: TEXT,
            marginLeft: 8,
            letterSpacing: -0.3,
          }}
          numberOfLines={1}
        >
          thamizh.app
        </Text>
      </View>

      {loading && (
        <ActivityIndicator
          size="large"
          color={TEXT}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: [{ translateX: -18 }, { translateY: -18 }],
            zIndex: 10,
          }}
        />
      )}

      <WebView
        source={{ uri: TARGET_URL }}
        onLoad={() => setLoading(false)}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />
    </View>
  );
}
