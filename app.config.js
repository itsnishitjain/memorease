module.exports = {
  expo: {
    name: "Memorease",
    slug: "gemini-api",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "dev.codewithbeto.talkgpt",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_APIKEY,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_APIKEY,
        },
      },
      permissions: ["android.permission.RECORD_AUDIO"],
      package: "dev.codewithbeto.talkgpt",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      [
        "@react-native-voice/voice",
        {
          microphonePermission:
            "CUSTOM: Allow $(PRODUCT_NAME) to access the microphone",
          speechRecognitionPermission:
            "CUSTOM: Allow $(PRODUCT_NAME) to securely recognize user speech",
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "79a33e02-ba0d-4622-9cbb-835575549553",
      },
    },
    owner: "gemiapi",
  },
};
