import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 1. The Home Dashboard (Entry Point) */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* 2. Fan Pages */}
      <Stack.Screen
        name="fans/selection"
        options={{
          title: "Choose a Fan",
          headerShown: true,
          headerBackTitle: "Home",
        }}
      />
      <Stack.Screen
        name="fans/ncs"
        options={{
          title: "NCS Standard",
          headerShown: true,
          headerTransparent: true,
          headerTintColor: "#000",
        }}
      />

      {/* 3. Scan Pages */}
      <Stack.Screen name="scan/index" options={{ headerShown: false }} />
      <Stack.Screen
        name="scan/results"
        options={{
          title: "Analysis Results",
          headerShown: true,
          headerBackTitle: "Scan",
        }}
      />
    </Stack>
  );
}
