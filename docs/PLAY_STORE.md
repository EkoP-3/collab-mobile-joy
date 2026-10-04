# Google Play'e yayın rehberi

Bu rehber, Android Studio kurmadan (GitHub Actions ile) Momentum'u Play Store'a yüklemek içindir.

## 1. Paket adını karar ver

Şu an `io.github.ekop3.momentum`. **Play'e ilk yüklemeden sonra değiştirilemez.** Kendi alan adın varsa (`com.senin-alanin.momentum` gibi) şimdi karar ver. Değiştirmek için aynı değerin geçtiği yerler:

- `capacitor.config.ts` → `appId`
- `android/app/build.gradle` → `namespace` ve `applicationId`
- `android/app/src/main/res/values/strings.xml` → `package_name`, `custom_url_scheme`
- `android/app/src/main/java/io/github/ekop3/momentum/` klasörü ve içindeki her dosyanın `package` satırı
- `android/app/src/main/AndroidManifest.xml` → receiver adları `.AlarmReceiver` gibi göreli olduğu için değişmez
- `ScheduleLogicTest.java` içindeki `package` satırı (`android/app/src/test/java/...`)
- `OngoingEngine.ACTION_TICK` değeri

Karar verince bana yaz, hepsini tek seferde değiştiririm.

## 2. Geliştirici hesabı

- https://play.google.com/console adresinden hesap aç (tek seferlik ücret).
- Kişisel hesaplarda yeni uygulamayı yayınlamadan önce **kapalı test** şartı olabilir (belirli sayıda test kullanıcısıyla belirli gün). Güncel şartı Play Console'da kontrol et.

## 3. İmza anahtarı (bir kez)

Bilgisayarında (Java kuruluysa) ya da GitHub Codespaces'te:

```sh
keytool -genkeypair -v -keystore momentum-release.jks -alias momentum \
  -keyalg RSA -keysize 2048 -validity 10000
```

- Parolaları ve `.jks` dosyasını **güvenli bir yerde yedekle**. Kaybedersen güncelleme yükleyemezsin (Play App Signing açıksa Google yükleme anahtarını sıfırlayabilir).
- `.jks` dosyasını **asla git'e koyma** (`.gitignore` zaten engeller).

GitHub'da **Settings → Secrets and variables → Actions → New repository secret** ile şu dördünü ekle:

| Secret | Değer |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 momentum-release.jks` çıktısı |
| `ANDROID_KEYSTORE_PASSWORD` | anahtar deposu parolası |
| `ANDROID_KEY_ALIAS` | `momentum` |
| `ANDROID_KEY_PASSWORD` | anahtar parolası |

## 4. İmzalı paketi (AAB) üret

**Actions → Android → Run workflow → release ✔** → bitince **momentum-release-aab** dosyasını indir. `versionCode` otomatik olarak çalıştırma numarasıdır (her yüklemede artar).

Sürüm adını değiştirmek için workflow'daki `gradlew` satırına `-PversionName=1.1.0` ekle.

## 5. Play Console'da uygulama oluştur

1. **Uygulama oluştur**: ad "Momentum", dil Türkçe, uygulama (oyun değil), ücretsiz.
2. **Üretim / Dahili test → Sürüm oluştur**: AAB'yi yükle. Play uygulama imzalamayı (Play App Signing) açık bırak.
3. **Mağaza girişi**: metinler `store/listing-tr.md`, görseller `store/` klasöründe (simge 512×512, öne çıkan görsel 1024×500, telefon ekran görüntüleri).
4. **Gizlilik politikası URL'si**: `docs/PRIVACY_POLICY.md` içeriğini herkese açık bir adrese koy (GitHub Pages, Notion herkese açık sayfa, Google Sites…) ve e-posta yerini doldur.
5. **Uygulama içeriği** formları (aşağıya bak).

### Veri güvenliği formu (şu anki sürüm için)

- Toplanan veri: **Hayır** (tüm veriler cihazda kalır, sunucuya gönderilmez).
- Paylaşılan veri: **Hayır**.
- Veri şifreli aktarılıyor mu / silme talebi: geçerli değil (veri toplanmıyor); kullanıcı uygulama verisini silerek/uygulamayı kaldırarak siler.
- **Reklam ya da satın alma eklediğinde** bu formu, gizlilik politikasını ve "Reklamlar içeriyor" seçeneğini güncellemek zorundasın.

### Diğer formlar

- **Reklamlar**: şu an "Hayır".
- **İçerik derecelendirme**: anket doldur (şiddet/uygunsuz içerik yok → herkes).
- **Hedef kitle**: 13+ / yetişkinler öner; çocuklara yönelik değil.
- **Bildirimler**: uygulama `POST_NOTIFICATIONS` izni ister (Android 13+). İzin uygulama içinden, kullanıcı "Aç" dediğinde sorulur.
- **Tam zamanlı alarm** (`SCHEDULE_EXACT_ALARM`): program saatinde bildirimin dakikasında gelmesi için kullanılır. Play, bu izin için ana işlev gerekçesi isteyebilir ("kullanıcının günlük programındaki görevleri saatinde hatırlatma"). Reddedilirse izni `AndroidManifest.xml`'den kaldır: uygulama yaklaşık zamanlı alarmla çalışmaya devam eder (birkaç dakika gecikebilir).

## 6. Yayından önce telefonda test listesi

- [ ] Uygulama açılıyor, alışkanlık ekle/tamamla/sil çalışıyor
- [ ] Bildirimler kartında **Aç** → izin penceresi çıkıyor (Android 13+)
- [ ] Bildirim panosunda "Momentum" sabit bildirimi görünüyor: o anki blok, kalan süre (geri sayım), "Sırada …"
- [ ] Blok değişince (ör. 09:00) bildirim yerinde güncelleniyor, yığılmıyor
- [ ] Hatırlatıcısı açık görev saatinde ayrı bir bildirim geliyor
- [ ] Görevi "tamamlandı" yapınca o gün için hatırlatıcı gelmiyor, sabit bildirimde ✓ görünüyor
- [ ] Telefonu yeniden başlat → sabit bildirim geri geliyor
- [ ] Uygulama arka plandan tamamen kapatılsa bile (son uygulamalardan kaydır) bildirim güncellenmeye devam ediyor
- [ ] Pil tasarrufu modunda gecikme var mı? (üreticiye göre uygulamayı "kısıtlanmamış" yapmak gerekebilir: Xiaomi, Huawei, Samsung…)
- [ ] Durum çubuğu simgeleri okunuyor, içerik çentik/alt çubuğa taşmıyor
- [ ] Karanlık mod açıkken uygulama okunaklı (uygulama şu an yalnızca açık temalıdır)
