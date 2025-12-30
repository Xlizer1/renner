/* eslint-disable react/display-name */
import { NcsItem } from "@/src/core/types/ncs";
import React, { memo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

interface Props {
  item: NcsItem;
  isSelected: boolean;
  onPress: () => void;
}

const ColorSwatch = memo(({ item, isSelected, onPress }: Props) => {
  return (
    <Pressable
      style={[
        styles.container,
        { backgroundColor: item.hex },
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
    paddingLeft: 8,
    borderWidth: 0, // Stable layout
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
});

export default ColorSwatch;
