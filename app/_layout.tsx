import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* The Tab Bar Group */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* The Detail Screens (Pushed on top of tabs) */}
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
          headerTransparent: true, // Cool effect for the fan view
          headerTintColor: "#000",
        }}
      />
    </Stack>
  );
}
