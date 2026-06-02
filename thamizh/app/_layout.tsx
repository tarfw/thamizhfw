import "../lib/polyfills";
import { DefaultTheme, ThemeProvider, Theme } from "@react-navigation/native";
import "../global.css";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

const AppTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#ffffff",
    card: "#ffffff",
    border: "transparent",
    primary: "#1A73E8",
    text: "#202124",
  },
};

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          gcTime: 5 * 60_000,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });
  }

  useEffect(() => {
    const sub = AppState.addEventListener("change", onAppStateChange);
    return () => sub.remove();
  }, []);

  if (!loaded) return null;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <QueryClientProvider client={queryClientRef.current}>
        <ThemeProvider value={AppTheme}>
          <Stack
              screenOptions={{
                headerShown: false,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: "#ffffff" },
                headerTitleStyle: { color: "#202124", fontWeight: "500" },
                headerTintColor: "#202124",
                contentStyle: { backgroundColor: "#ffffff" },
                statusBarTranslucent: true,
                statusBarStyle: "dark",
                statusBarBackgroundColor: "#ffffff",
                animation: "slide_from_right",
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="sign-in" options={{ headerShown: false }} />
              <Stack.Screen name="pick-constituency" options={{ headerShown: false }} />
              <Stack.Screen name="spaces/index" options={{ headerShown: false }} />
              <Stack.Screen name="profile" options={{ headerShown: false }} />
              <Stack.Screen name="community" options={{ headerShown: false }} />
              <Stack.Screen name="roadmap" options={{ headerShown: false }} />
              <Stack.Screen name="chats/private/new" options={{ headerShown: false, presentation: "modal" }} />
              <Stack.Screen name="chats/private/[id]/index" options={{ headerShown: false }} />
              <Stack.Screen name="chats/groups/index" options={{ headerShown: false }} />
              <Stack.Screen name="chats/groups/create" options={{ headerShown: false }} />
              <Stack.Screen name="chats/groups/[id]/index" options={{ headerShown: false }} />
              <Stack.Screen name="chats/groups/[id]/invite" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
              <Stack.Screen name="agarathi" options={{ headerShown: false }} />
              <Stack.Screen name="tamil-tokenizer" options={{ headerShown: false }} />
            </Stack>

          <StatusBar style="dark" />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
