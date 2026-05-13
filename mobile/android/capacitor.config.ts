import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.operyx.app",
  appName: "Operyx",
  webDir: "android/app/src/main/assets/public",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#0b0f16",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0b0f16",
    },
  },
};

export default config;
