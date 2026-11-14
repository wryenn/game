# Kale Kapmaca

Osmanlı kalesi temalı, 1–4 oyunculu piksel-art platform kapışma oyunu. Kafaya zıpla, rakipleri kaleden düşür.

## Çalıştırma

```bash
bun install
bun run dev        # http://localhost:3000 (Vite + oyun sunucusu)
bun run build && bun run start   # production
```

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `bun test` | Simülasyon, AI, içerik ve ağ testleri |
| `bunx tsc --noEmit` | Tip kontrolü |
| `bun run balance -- --matches 800` | Headless bot maçlarıyla kahraman/harita denge raporu |

## Mimari

```
src/content   Kahramanlar, haritalar, hikâye, saga, kozmetik (saf veri)
src/sim       Deterministik 60 Hz simülasyon (seed'li RNG, sabit adım)
src/ai        Harita-farkındalıklı bot beyni: navigasyon, zorluk, kişilik, kahraman taktikleri
src/render    Canvas piksel-art renderer
src/audio     WebAudio efekt ve müzik
src/input     Klavye / gamepad / dokunmatik → tek input modeli
src/net       Protokol (zod), snapshot serileştirme, istemci (interpolasyon)
src/state     Ayarlar, ilerleme, başarımlar (localStorage)
src/ui        React arayüzü ve GameSession (oyun döngüsü)
server        Sunucu-otoriteli oda/maç yönetimi (WebSocket, rate limit, TTL)
tools         Denge simülatörü
tests         bun test
```

### Çevrimiçi

Maçlar sunucuda 60 Hz simüle edilir, istemcilere 30 Hz snapshot gönderilir ve istemci iki snapshot geriden interpolasyon yapar. Mesajlar zod ile doğrulanır; 4 KB payload sınırı, token-bucket rate limit, 15 sn heartbeat ve 30 dk oda TTL vardır. Oda sahibi ayrılırsa maç devam eder, ayrılan oyuncunun yerini bot alır.
