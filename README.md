# Momentum

Türkçe alışkanlık takibi ve saat saat günlük program uygulaması. Tüm veriler **yalnızca cihazda** tutulur; hesap, sunucu ya da reklam yoktur (şimdilik).

Android uygulamasında bildirim panosunda **kalıcı bir "şu an / sıradaki" bildirimi** durur: hangi program bloğunda olduğunu, bloğun bitmesine kalan süreyi ve sıradaki görevi gösterir. Ayrıca hatırlatıcısı açık görevler başlarken bildirim gelir. Hepsi telefonda hesaplanır, internet gerekmez.

## Teknoloji

- React 19 + TanStack Start (SPA olarak paketlenir) + Vite + Tailwind 4 + shadcn/ui
- [Capacitor](https://capacitorjs.com) ile Android sarmalayıcı (`android/`)
- Özel Android eklentisi: `android/app/src/main/java/io/github/ekop3/momentum/` (bildirim motoru)
- Supabase tarafı (`supabase/`, `src/integrations/supabase/`) **şu an kullanılmıyor**; ileride hesap/senkron eklenirse için bırakıldı.

## Geliştirme

```sh
bun install
bun run dev        # http://localhost:8080 (tarayıcı; Android'e özel bildirimler çalışmaz)
bun run typecheck
bun run lint
```

## Android uygulaması

### Android Studio olmadan: GitHub Actions ile APK

1. Bu depoya bir şey push et (ya da **Actions → Android → Run workflow**).
2. İş bitince çalıştırmanın sayfasında **Artifacts → momentum-debug-apk** dosyasını indir.
3. APK'yı telefona gönder, kurulumda "bilinmeyen kaynaklara izin ver" de. Bildirimleri uygulama içinden aç.

### Kendi bilgisayarında (Android Studio varsa)

```sh
bun run cap:sync          # web paketini derler ve android/ içine kopyalar
bunx cap open android     # Android Studio'da açar → Run
```

### Play Store'a yayın

Adım adım rehber: [`docs/PLAY_STORE.md`](docs/PLAY_STORE.md). Mağaza metinleri ve görseller: [`store/`](store/). Gizlilik politikası taslağı: [`docs/PRIVACY_POLICY.md`](docs/PRIVACY_POLICY.md).

## Notlar

- `appId` (`io.github.ekop3.momentum`) Play'e ilk yüklemeden sonra değiştirilemez. Değiştireceksen **önce** [`docs/PLAY_STORE.md`](docs/PLAY_STORE.md#1-paket-adını-karar-ver) bölümüne bak.
- `.env`, anahtar deposu (`*.jks`) ve `keystore.properties` git'e girmez. Gizli bilgileri asla commit'leme.
- Web sürümü (`bun run build`) Vercel için SSR çıktısı üretir; asıl hedef Android'dir (`bun run build:app`).
