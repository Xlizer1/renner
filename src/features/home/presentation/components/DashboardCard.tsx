import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface DashboardCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string; // The accent color (e.g., Yellow, Blue)
  onPress: () => void;
}

export const DashboardCard = ({
  title,
  subtitle,
  icon,
  color,
  onPress,
}: DashboardCardProps) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      {/* Icon Box with 15% opacity of the accent color */}
      <View style={[styles.iconContainer, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#444" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E", // Dark Surface
    padding: 16, // Slightly reduced padding for a tighter look
    borderRadius: 16,
    marginBottom: 12,

    // Borders for Dark Mode separation
    borderWidth: 1,
    borderColor: "#333",

    // Subtle Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: "#252525", // Slightly lighter when pressed
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF", // White Text
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#888", // Grey Subtext
  },
});
