export default {
  expo: {
    name: "AfriCover247",
    slug: "africover247",
    scheme: "africover247",
    version: "1.2.0",
    sdkVersion: "54.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    androidStatusBar: {
      backgroundColor: "#15679b",
      barStyle: "light-content",
      translucent: false,
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.afriglobal.Africover247",
      usesAppleSignIn: true,
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        NSFaceIDUsageDescription: "AfriCover247 uses Face ID to keep your account secure.",
        UIStatusBarStyle: "UIStatusBarStyleLightContent",
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
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
      "./plugins/withRNFirebaseDisableSPM",
    ],
    extra: {
      apiUrl: "https://africover247.onrender.com",
      eas: {
        projectId: "436de704-ba6f-46e8-a6b9-0c7286ce59e1"
      }
    }
  }
}
