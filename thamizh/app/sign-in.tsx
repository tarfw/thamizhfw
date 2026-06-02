import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { Pressable } from "@/lib/Pressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { callReducer, ensureConnected } from "@/lib/db";
import { useSession } from "@/lib/auth";
import { signInWithBluesky } from "@/lib/bluesky-auth";
import { FiveWingAsterisk } from "@/lib/FiveWingAsterisk";
import {
  ACCENT,
  ACCENT_DARK,
  BORDER_IDLE,
  DANGER,
  MUTED,
  SURFACE_ALT,
  TEXT,
} from "@/lib/theme";

const DEFAULT_DOMAIN = ".bsky.social";

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ reconnect?: string }>();
  const { user: sessionUser } = useSession();
  const isReconnect = params.reconnect === "bluesky";
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"handle" | "auth" | "connecting">("handle");

  if (sessionUser && !isReconnect) return <Redirect href="/spaces" />;

  const submit = async () => {
    const raw = handle.trim().replace(/^@/, "");
    const pwd = password.trim();
    if (!raw || !pwd) return;
    const fullHandle = raw.includes(".") ? raw : `${raw}${DEFAULT_DOMAIN}`;
    console.log("[sign-in] submit clicked", { handle: fullHandle });
    setBusy(true);
    setError(null);
    try {
      setStep("auth");
      console.log("[sign-in] calling signInWithBluesky...");
      const bskySession = await signInWithBluesky(fullHandle, pwd);
      console.log("[sign-in] signInWithBluesky succeeded", { did: bskySession.did, pdsUrl: bskySession.pdsUrl });

      setStep("connecting");
      console.log("[sign-in] calling ensureConnected...");
      await ensureConnected();
      console.log("[sign-in] ensureConnected succeeded");

      console.log("[sign-in] calling set_display_name reducer...");
      await callReducer("set_display_name", {
        displayName: bskySession.handle,
        handle: bskySession.handle,
      });
      console.log("[sign-in] set_display_name succeeded, navigating to /");
      router.replace("/");
    } catch (e: any) {
      console.error("[sign-in] submit failed:", e?.message ?? e);
      setError(e.message ?? String(e));
      setStep("handle");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: insets.top + 64, width: "100%" }}>

        <View style={{ marginBottom: 56 }}>
          <View style={{ marginBottom: 16 }}>
            <FiveWingAsterisk size={64} color={ACCENT} />
          </View>
          <Text style={{ fontSize: 48, color: TEXT, fontWeight: "900", letterSpacing: -1.2, lineHeight: 52 }}>
            {"thamizh\nsocial\napp"}
          </Text>
        </View>

        {step === "handle" ? (
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: handle ? ACCENT : BORDER_IDLE, borderRadius: 16, paddingHorizontal: 16, height: 52, backgroundColor: SURFACE_ALT, marginBottom: 12 }}>
              <Text style={{ fontSize: 15, color: MUTED, marginRight: 4 }}>@</Text>
              <TextInput
                value={handle}
                onChangeText={setHandle}
                placeholder="username"
                placeholderTextColor={MUTED}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                style={{ flex: 1, color: TEXT, fontSize: 15, height: 52 }}
              />
              <Text style={{ fontSize: 13, color: MUTED }}>{DEFAULT_DOMAIN}</Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: password ? ACCENT : BORDER_IDLE, borderRadius: 16, paddingHorizontal: 16, height: 52, backgroundColor: SURFACE_ALT, marginBottom: 8 }}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="App Password"
                placeholderTextColor={MUTED}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                returnKeyType="go"
                onSubmitEditing={submit}
                style={{ flex: 1, color: TEXT, fontSize: 15, height: 52 }}
              />
            </View>

            {error ? (
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FCE8E6", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginBottom: 12 }}>
                <Ionicons name="alert-circle" size={14} color={DANGER} style={{ marginRight: 6 }} />
                <Text style={{ color: DANGER, fontSize: 13, flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={submit}
              disabled={busy || !handle.trim() || !password.trim()}
              style={({ pressed }) => ({
                backgroundColor: !handle.trim() || !password.trim() ? SURFACE_ALT : pressed ? ACCENT_DARK : ACCENT,
                paddingVertical: 14,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 8,
              })}
            >
              {busy ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: !handle.trim() || !password.trim() ? MUTED : "white", fontSize: 15, fontWeight: "600" }}>
                  Sign in
                </Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={ACCENT} size="large" />
            <Text style={{ fontSize: 14, color: MUTED, marginTop: 16 }}>
              {step === "auth" ? "Signing in to Bluesky..." : "Connecting to server..."}
            </Text>
          </View>
        )}

        <View style={{ alignItems: "center", paddingTop: 24, paddingBottom: insets.bottom + 16 }}>
          <Text style={{ fontSize: 13, color: MUTED }}>தமிழ்  ·  v1.0.0</Text>
        </View>
      </View>
    </View>
    </KeyboardAvoidingView>
  );
}
