import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import React, { useState, useRef } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Pressable } from "@/lib/Pressable";
import { HAIRLINE, MUTED, TEXT } from "./theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type ImageViewerImage = {
  uri: string;
  alt?: string;
};

type Props = {
  images: ImageViewerImage[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
};

function ImageViewerContent({
  images,
  initialIndex = 0,
  onClose,
}: {
  images: ImageViewerImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [pageIndex, setPageIndex] = useState(initialIndex);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const currentImage = images[pageIndex];

  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(5, savedScale.value * e.scale));
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        scale.value = withTiming(1, { duration: 200 });
        translateX.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const pan = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      } else {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (scale.value <= 1 && Math.abs(e.translationY) > 100) {
        runOnJS(onClose)();
      } else {
        translateX.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
        if (scale.value < 1) {
          scale.value = withTiming(1, { duration: 200 });
        }
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1, { duration: 200 });
        translateX.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
      } else {
        scale.value = withTiming(2.5, { duration: 200 });
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: scale.value <= 1
      ? 1 - Math.abs(translateY.value) / SCREEN_H
      : 1,
  }));

  const saveImage = async () => {
    if (!currentImage?.uri) return;
    try {
      let perm = permissionGranted ? { granted: true } : await MediaLibrary.requestPermissionsAsync();
      if (!perm?.granted) {
        Alert.alert("Permission needed", "Allow access to your photo library to save images.");
        return;
      }
      setPermissionGranted(true);
      const ext = currentImage.uri.split(".").pop() || "jpg";
      const localUri = `${FileSystem.cacheDirectory}bsky_${Date.now()}.${ext}`;
      await FileSystem.downloadAsync(currentImage.uri, localUri);
      await MediaLibrary.saveToLibraryAsync(localUri);
      Alert.alert("Saved", "Image saved to your photo library.");
    } catch (e) {
      Alert.alert("Error", "Failed to save image.");
    }
  };

  const prevPage = () => {
    if (pageIndex > 0) setPageIndex(pageIndex - 1);
  };
  const nextPage = () => {
    if (pageIndex < images.length - 1) setPageIndex(pageIndex + 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <StatusBar barStyle="light-content" />

      {/* Top bar */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: Platform.OS === "ios" ? 56 : 40,
          paddingHorizontal: 12,
          paddingBottom: 12,
          zIndex: 10,
        }}
      >
        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="close" size={22} color="white" />
        </Pressable>

        <Pressable
          onPress={saveImage}
          hitSlop={12}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="download-outline" size={20} color="white" />
        </Pressable>
      </View>

      {/* Image area */}
      <GestureDetector gesture={composed}>
        <Animated.View
          style={[
            { flex: 1, alignItems: "center", justifyContent: "center" },
            opacityStyle,
          ]}
        >
          <Animated.View style={animatedStyle}>
            <Image
              source={{ uri: currentImage?.uri }}
              style={{
                width: SCREEN_W,
                height: SCREEN_W,
                maxHeight: SCREEN_H * 0.85,
              }}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={200}
            />
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* Bottom bar */}
      {images.length > 1 ? (
        <View
          style={{
            position: "absolute",
            bottom: Platform.OS === "ios" ? 40 : 24,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 20,
          }}
        >
          <Pressable
            onPress={prevPage}
            disabled={pageIndex === 0}
            hitSlop={12}
            style={({ pressed }) => ({
              opacity: pageIndex === 0 ? 0.3 : pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </Pressable>
          <Text style={{ color: "white", fontSize: 14, fontWeight: "500" }}>
            {pageIndex + 1} of {images.length}
          </Text>
          <Pressable
            onPress={nextPage}
            disabled={pageIndex === images.length - 1}
            hitSlop={12}
            style={({ pressed }) => ({
              opacity: pageIndex === images.length - 1 ? 0.3 : pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="chevron-forward" size={28} color="white" />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function ImageViewer(props: Props) {
  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="fade"
      onRequestClose={props.onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ImageViewerContent {...props} />
      </GestureHandlerRootView>
    </Modal>
  );
}
