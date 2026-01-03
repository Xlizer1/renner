import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.text}>
          We need your permission to use the camera
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !processing) {
      setProcessing(true);
      try {
        // 1. Take Photo
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          skipProcessing: true, // Faster
        });

        if (photo) {
          await processImageColor(photo.uri, photo.width, photo.height);
        }
      } catch (error) {
        console.error(error);
        setProcessing(false);
      }
    }
  };

  const processImageColor = async (
    uri: string,
    imgWidth: number,
    imgHeight: number
  ) => {
    const CROP_SIZE = 20;

    // 1. Crop on phone (save bandwidth)
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          crop: {
            originX: imgWidth / 2 - 10,
            originY: imgHeight / 2 - 10,
            width: 20,
            height: 20,
          },
        },
      ],
      { format: ImageManipulator.SaveFormat.PNG } // No base64 needed, just file
    );

    // 2. Pass the file URI to the results page
    router.push({
      pathname: "/scan/results",
      params: { uri: result.uri },
    });
    setProcessing(false);
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="back">
        <SafeAreaView style={styles.uiContainer}>
          {/* Header */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>

          {/* Crosshair Overlay */}
          <View style={styles.crosshairContainer}>
            <View style={styles.crosshair} />
            <Text style={styles.label}>Align center with color</Text>
          </View>

          {/* Footer / Trigger */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.captureBtnOuter}
              onPress={takePicture}
              disabled={processing}
            >
              <View style={styles.captureBtnInner}>
                {processing && <ActivityIndicator color="#000" />}
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: { textAlign: "center", marginBottom: 10, color: "white" },
  button: { backgroundColor: "#007AFF", padding: 10, borderRadius: 5 },
  buttonText: { color: "white" },
  camera: { flex: 1 },
  uiContainer: { flex: 1, justifyContent: "space-between" },
  closeButton: { marginLeft: 20, marginTop: 10 },

  crosshairContainer: { alignItems: "center", justifyContent: "center" },
  crosshair: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 10,
    backgroundColor: "transparent",
    marginBottom: 10,
  },
  label: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 4,
    borderRadius: 4,
  },

  footer: { alignItems: "center", marginBottom: 40 },
  captureBtnOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtnInner: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
});
