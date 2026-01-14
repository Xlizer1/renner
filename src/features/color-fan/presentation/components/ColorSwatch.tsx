/* eslint-disable react/display-name */
import { NcsItem } from "@/src/core/types/ncs";
import { Image } from "expo-image";
import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
  item: NcsItem;
  isSelected: boolean;
  onPress: () => void;
}

const ColorSwatch = memo(({ item, isSelected, onPress }: Props) => {
  // 1. TEXTURE MODE (Renner Wood)
  if (item.isTexture) {
    const isCS = item.hue === "CS";

    return (
      <Pressable
        style={[
          styles.container, 
          // No padding applied here, so image fills 100%
          isSelected && styles.selected
        ]}
        onPress={onPress}
      >
        <Image
          source={item.hex}
          style={[
            styles.image,
            isCS && { transform: [{ scale: 2.5 }] },
          ]}
          contentFit="cover"
          transition={0}
          cachePolicy="memory-disk"
          allowDownscaling={true}
        />
        <View style={styles.textOverlay}>
          <Text style={[styles.text, styles.textureText]}>{item.key}</Text>
        </View>
      </Pressable>
    );
  }

  // 2. STANDARD COLOR MODE
  return (
    <Pressable
      style={[
        styles.container,
        styles.colorModeContainer, // <--- Apply padding only here
        { backgroundColor: item.hex as string },
        isSelected && styles.selected,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.text, isSelected && styles.selectedText]}>
        {item.key}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    // paddingLeft: 8, <--- REMOVED FROM HERE
    borderWidth: 0,
    overflow: "hidden", 
  },
  // New style specific to solid colors to keep text indented
  colorModeContainer: {
    paddingLeft: 8, 
  },
  image: {
    width: "100%",
    height: "100%",
    position: "absolute",
    left: 0, // Ensure it aligns to the very edge
    top: 0,
  },
  selected: {
    borderColor: "#007AFF",
    borderWidth: 4,
    zIndex: 10,
  },
  text: {
    color: "rgba(0,0,0,0.6)",
    fontSize: 10,
    fontWeight: "700",
  },
  selectedText: {
    color: "#000",
    fontWeight: "900",
  },
  textOverlay: {
    position: "absolute",
    bottom: 5,
    left: 5,
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  textureText: {
    color: "#000",
    fontSize: 9,
  },
});

export default ColorSwatch;