export default {
  expo: {
    name: "AfriCover247",
    slug: "africover247",
    version: "1.0.0",
    sdkVersion: "54.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#15679b"
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.africover247.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        backgroundColor: "#15679b"
      },
      package: "com.africover247.app"
    },
    plugins: [
      "expo-secure-store"
    ],
    extra: {
      apiUrl: process.env.API_URL || "https://africover247.onrender.com"
    }
  }
}
