import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Play Store'a ilk yüklemeden sonra DEĞİŞTİRİLEMEZ. Kendi alan adına/hesabına göre
  // yüklemeden önce güncelle (bkz. docs/PLAY_STORE.md).
  appId: "io.github.ekop3.momentum",
  appName: "Momentum",
  webDir: "dist/client",
  // Sayfa yüklenene kadar görünen zemin (beyaz parlama olmasın).
  backgroundColor: "#e3ebf3",
  plugins: {
    // Uygulama açık renkli: durum çubuğunda koyu simgeler. Güvenli alan değerleri
    // CSS'e --safe-area-inset-* olarak verilir (env(safe-area-inset-*) de çalışır).
    SystemBars: { insetsHandling: "css", style: "LIGHT" },
  },
  android: {
    // Sadece uygulamanın kendi içeriği; harici adresler WebView'da açılmaz.
    allowMixedContent: false,
  },
};

export default config;
