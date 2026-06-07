import { Tabs } from 'expo-router';
import { useTheme } from '@tamilfw/ui';
import { Text, View } from 'react-native';

const TAB_ICONS: Record<string, string> = {
  feed: '◆',
  investigate: '⬢',
  workspace: '▣',
};

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color, fontSize: 18, fontWeight: '700' }}>{TAB_ICONS[name]}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.bgElevated,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.fgMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'FEED',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="feed" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="investigate"
        options={{
          title: 'INVESTIGATE',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="investigate" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workspace"
        options={{
          title: 'WORKSPACE',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="workspace" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}