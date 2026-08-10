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
      bundleIdentifier: "com.africover247.app",
      infoPlist: {
        NSFaceIDUsageDescription: "AfriCover247 uses Face ID to keep your account secure.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        backgroundColor: "#ffffff"
      },
      package: "com.africover247.app",
      permissions: [
        "NOTIFICATIONS",
        "RECEIVE_BOOT_COMPLETED",
        "USE_BIOMETRIC",
        "USE_FINGERPRINT",
      ],
    },
    plugins: [
      "expo-secure-store",
      "expo-asset",
      "expo-font",
      "@react-native-community/datetimepicker",
      "expo-local-authentication",
      "expo-apple-authentication",
      "expo-notifications",
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
    ],
    extra: {
      apiUrl: "https://africover247.onrender.com",
      eas: {
        projectId: "1c5e61d2-65d1-4b21-8150-e983b402a3bc"
      }
    }
  }
}
