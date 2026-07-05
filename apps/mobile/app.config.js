export default {
  expo: {
    name: "AfriCover247",
    slug: "africover247",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.africover247.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.africover247.app"
    },
    extra: {
      apiUrl: process.env.API_URL || "http://localhost:3001"
    }
  }
}
