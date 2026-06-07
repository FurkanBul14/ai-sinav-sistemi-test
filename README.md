# 🎓 AI Destekli Kopya Tespitli Online Sınav Sistemi (Monorepo)

Bu proje, yapay zeka (AI) destekli, gerçek zamanlı kopya tespiti yapabilen ve B2B SaaS modeliyle diğer platformlara kolayca gömülebilen (embeddable) yeni nesil bir **Çevrimiçi Gözetmenlik (AI Proctoring) ve Sınav Platformu**dur.

Sistem; yüz algılama, göz takibi (bakış sapması), ses/konuşma tespiti ve sekme/tam ekran kontrolleri gibi akıllı gözetim mekanizmaları kullanarak öğrenciler için 0-100 arasında anlık ve dinamik bir **Risk Skoru** üretir.

---

## 📁 Proje Klasör Yapısı

Karmaşıklığı önlemek adına projenin ana yapısı ve hangi klasörün ne işe yaradığı aşağıda özetlenmiştir:

```text
├── frontend/                     # React (Vite) ile kodlanmış Ana Web Uygulaması
│   └── src/pages/                # Öğrenci, Eğitmen ve Yönetici (Admin) ekranları
├── sdk/                          # B2B entegrasyonu için geliştirilmiş Widget (HTML/JS)
├── services/                     # Mikroservis Mimari Servisleri (Node.js & Python)
│   ├── gateway-service/          # API Gateway: Kimlik doğrulama, WebSocket & Webhook yönlendirme (:3000)
│   ├── auth-service/             # Üye olma, Giriş ve Kullanıcı Profili yönetimi (:3001)
│   ├── exam-service/             # Sınav oluşturma, süre ve soru/cevap takibi (:3002)
│   ├── reporting-service/        # PDF & Excel formatında kopya risk raporları oluşturma (:3003)
│   ├── proctoring-service/       # WebSocket ile anlık kamera analizi ve ihlal skorlama (:3004)
│   └── webhook-service/          # Dış platformlara imzalı olay (event) teslimatı (:3005)
├── ai-services/                  # Python (FastAPI) Tabanlı Yapay Zeka Servisleri
│   ├── face-detection/           # Yüz algılama ve doğrulama modülü (:8091)
│   ├── eye-tracking/             # Bakış yönü ve ekrandan sapma kontrolü (:8092)
│   ├── audio-analysis/           # Ses ve konuşma tespiti modülü (:8093)
│   └── risk-scoring/             # Random Forest tabanlı anlık risk hesaplama (:8094)
├── scripts/                      # Kurulum, derleme ve bakım için Node.js / Batch betikleri
├── DEMO_BASLAT.bat               # Tek tıkla Docker Backend + Yerel Frontend'i başlatan dosya
├── PANEL_AC.bat                  # Tarayıcıda web arayüzlerini ve test kılavuzunu açan dosya
└── b2b.md                        # Dış platformlar için B2B Widget & Webhook entegrasyon belgesi
```

---

## 🛠️ Gereksinimler & Kurulum

Sistemi çalıştırmak için bilgisayarınızda **Docker Desktop** ve **Node.js (LTS)** yüklü olmalıdır.

### Tek Tıkla Başlatma (Geliştirme / Test)
1. Projenin ana klasöründeki **`DEMO_BASLAT.bat`** dosyasını çift tıklayarak çalıştırın.
   - Bu komut Docker backend konteynerlerini ayağa kaldıracak ve yerel React frontend sunucusunu (`http://localhost:5173`) başlatacaktır.
2. Servisler açıldıktan sonra **`PANEL_AC.bat`** dosyasını çalıştırarak test arayüzüne hemen erişebilirsiniz.

### Güncelleme Sonrası Yeniden Derleme
Eğer backend kodlarında değişiklik yaparsanız, Docker önbelleğini temizleyip konteynerleri güncellemek için şu komutu çalıştırın:
```bash
node scripts/rebuild_all.js
```

---

## 🔑 Varsayılan Test Hesapları

Geliştirme ve test süreçlerinde kullanabileceğiniz hazır hesap bilgileri:

| Rol | E-posta | Şifre | Erişim Yetkisi |
| :--- | :--- | :--- | :--- |
| **Sistem Yöneticisi (Admin)** | `admin@sinav.com` | `admin123` | Eğitmen hesabı oluşturma, davet kodları ve QR üretimi. |
| **Eğitmen (Instructor)** | `egitmen@sinav.com` | `instructor123` | Sınav oluşturma, QR sınav kodu üretme, canlı ihlal takibi ve rapor indirme. |
| **Öğrenci (Student)** | `ogrenci@sinav.com` | `student123` | Sınava katılma, profil düzenleme, geçmiş sınav raporlarını izleme. |

---

## 🔌 B2B SaaS Entegrasyonu

Eğer bu gözetime kendi web sitenizden veya LMS portalınızdan (Moodle, Canvas vb.) erişmek istiyorsanız:

1. **Iframe Widget:** Sınav sayfanıza aşağıdaki kodu yerleştirerek kamerayı ve AI analizini başlatabilirsiniz:
   ```html
   <iframe
     src="http://localhost:3000/sdk/index.html?apiKey=pk_live_demo12345678901&examCode=EXAM_CODE&studentId=STUDENT_ID&studentName=NAME"
     width="350" height="280"
     allow="camera; microphone; display-capture"
     style="border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
   ></iframe>
   ```
2. **Webhook & HMAC:** Sınav bitiminde veya kopya girişimlerinde `X-Webhook-Signature` header'ı ile SHA256 HMAC imzalı JSON paketlerini kendi webhook sunucunuzda karşılayabilirsiniz.
   - Detaylı entegrasyon rehberi için [b2b.md](file:///d:/Koray/AI_Mulakat_Sistemi-main-yeni%20(1)/AI_Mulakat_Sistemi-main-yeni/b2b.md) kılavuzunu inceleyin.

---

## 💾 GitHub'a Karmaşıklık Olmadan Yükleme

GitHub limitlerini aşmamak ve depoyu temiz tutmak için kütüphane (`node_modules`) ve büyük yedek zip dosyaları `.gitignore` ile devre dışı bırakılmıştır.

GitHub'a temiz yükleme yapmak için terminalde sırasıyla şu komutları çalıştırın:
```bash
# 1. Git deposunu başlatın
git init

# 2. Varsa eski git önbelleğini temizleyin (Önemli!)
git rm -r --cached .

# 3. Dosyaları ekleyin (Kütüphaneler ve büyük ziplemeler elenecektir)
git add .

# 4. Değişiklikleri kaydedin
git commit -m "feat: AI Mulakat ve B2B SaaS Gozetim Platformu"

# 5. GitHub adresinizi ekleyip yükleyin
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/DEPO_ADINIZ.git
git push -u origin main
```
