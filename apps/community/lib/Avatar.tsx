import { Text, View, ImageStyle, ViewStyle, StyleProp } from "react-native";
import { Image } from "expo-image";
import { avatarColor, initialsOf } from "./theme";

type Props = {
  name: string;
  size?: number;
  seed?: string;
  style?: StyleProp<ViewStyle | ImageStyle>;
  url?: string | null;
};

export default function Avatar({ name, size = 40, seed, style, url }: Props) {
  const palette = avatarColor(seed ?? name);
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: palette.bg,
          },
          style as any,
        ]}
        contentFit="cover"
        transition={120}
        cachePolicy="memory-disk"
      />
    );
  }
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.bg,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text
        style={{
          color: palette.fg,
          fontSize: Math.round(size * 0.42),
          fontWeight: "500",
          letterSpacing: 0.2,
        }}
      >
        {initialsOf(name)}
      </Text>
    </View>
  );
}
