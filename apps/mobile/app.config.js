export default {
  expo: {
    name: "AfriCover247",
    slug: "africover247",
    scheme: "africover247",
    version: "1.0.0",
    sdkVersion: "54.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.africover247.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        backgroundColor: "#ffffff"
      },
      package: "com.africover247.app",
      permissions: ["NOTIFICATIONS", "RECEIVE_BOOT_COMPLETED"]
    },
    plugins: [
      "expo-secure-store",
      "expo-asset",
      "expo-font",
      "@react-native-community/datetimepicker"
    ],
    extra: {
      apiUrl: "https://africover247.onrender.com",
      eas: {
        projectId: "1c5e61d2-65d1-4b21-8150-e983b402a3bc"
      }
    }
  }
}
