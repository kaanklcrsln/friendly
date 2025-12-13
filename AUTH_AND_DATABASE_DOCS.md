# Friendly - Kullanıcı ve Veri Tabanı Yapısı

## 🔐 Kimlik Doğrulama (Authentication)

### Firebase Auth Yapılandırması
- **Sağlayıcı**: Firebase Authentication
- **Desteklenen Yöntemler**:
  - Email + Şifre (Email/Password)
  - Gelecek: Google, GitHub OAuth

### Giriş / Kayıt Akışı

#### 1. Kayıt (Register)
- **Route**: `/kayit`
- **Gerekli Bilgiler**:
  - `displayName` (Ad Soyad, min 2 karakter)
  - `email` (Geçerli e-posta adresi)
  - `password` (Min 6 karakter)
  - `confirmPassword` (Doğrulama)

- **İşlem Adımları**:
  1. Şifre geçerliliğini kontrol et (min 6 karakter, eşleşme)
  2. Firebase Authentication'da kullanıcı oluştur
  3. Realtime Database'de `users/{uid}` oluştur
  4. Ana sayfaya (`/`) yönlendir

#### 2. Giriş (Login)
- **Route**: `/giris`
- **Gerekli Bilgiler**:
  - `email` (Kayıtlı e-posta)
  - `password` (Doğru şifre)

- **İşlem Adımları**:
  1. Firebase Authentication ile giriş yap
  2. Başarılı ise ana sayfaya yönlendir
  3. Başarısız ise hata mesajı göster

#### 3. Koruma (Protected Routes)
- **Ana Sayfa** (`/`): Giriş yapılı ise HomePage, değilse `/giris`'e yönlendir
- **Diğer Sayfalar** (`/events`, `/chat/:id`, `/profile`, `/about`): Tümü protected
- **Loading State**: Auth durumu kontrol edilirken "Yükleniyor..." göster

---

## 📊 Realtime Database Yapısı

### 1. Users (Kullanıcılar)
```
users/
  {uid}/
    uid: string (Firebase UID)
    email: string (E-posta adresi)
    displayName: string (Görünen ad)
    createdAt: string (ISO 8601 timestamp)
    profilePicture: string | null (Profil resmi URL'si, gelecek)
    bio: string (Biyografi, gelecek)
    location: {
      latitude: number
      longitude: number
      timestamp: string
    } | null (Coğrafi konum, gelecek)
```

**Örnek**:
```json
{
  "uid": "aB1c2D3e4F5g6H7i8J9k0",
  "email": "ahmet@example.com",
  "displayName": "Ahmet Yılmaz",
  "createdAt": "2025-12-12T10:30:00Z",
  "profilePicture": null,
  "bio": "Ankara'da yaşayan yazılım geliştirici",
  "location": null
}
```

---

### 2. Rooms (Sohbet Odaları)
```
rooms/
  {roomId}/
    name: string (Oda adı)
    type: string ("general" | "private")
    createdAt: string (ISO 8601 timestamp)
    createdBy: string (Oda oluşturanın UID'si)
    members: {
      {uid}: true
    }
    messages/
      {messageId}/
        userId: string (Mesaj sahibinin UID'si)
        text: string (Mesaj içeriği)
        timestamp: string (ISO 8601 timestamp)
        edited: boolean (Düzenlenmiş mi?)
        editedAt: string | null (Düzenlenme zamanı)
```

**Örnek**:
```json
{
  "general": {
    "name": "Genel Sohbet",
    "type": "general",
    "createdAt": "2025-12-12T08:00:00Z",
    "createdBy": "admin123",
    "members": {
      "user1": true,
      "user2": true,
      "user3": true
    },
    "messages": {
      "msg001": {
        "userId": "user1",
        "text": "Merhaba herkes!",
        "timestamp": "2025-12-12T09:15:00Z"
      }
    }
  }
}
```

---

### 3. Events (Etkinlikler)
```
events/
  {eventId}/
    title: string (Etkinlik başlığı)
    description: string (Açıklama)
    location: {
      latitude: number
      longitude: number
      address: string (Adres)
    }
    timestamp: string (ISO 8601 - Etkinlik zamanı)
    createdAt: string (Oluşturulma zamanı)
    createdBy: string (Oluşturanın UID'si)
    category: string ("sosyal" | "spor" | "eğitim" | "sanat" | "diğer")
    attendees: {
      {uid}: true
    }
    maxAttendees: number | null (Maksimum katılımcı)
    imageUrl: string | null (Etkinlik fotoğrafı)
```

**Örnek**:
```json
{
  "event001": {
    "title": "Ankara Buluşması",
    "description": "Yazılımcılar için ağ kurma etkinliği",
    "location": {
      "latitude": 39.9334,
      "longitude": 32.8597,
      "address": "Ankara, Çankaya"
    },
    "timestamp": "2025-12-15T18:00:00Z",
    "createdAt": "2025-12-12T08:00:00Z",
    "createdBy": "user1",
    "category": "sosyal",
    "attendees": {
      "user1": true,
      "user2": true
    },
    "maxAttendees": 50
  }
}
```

---

## 🔒 Firebase Realtime Database Kuralları

Dosya: `server/firebase-database-rules.json`

### Kural Özeti:

1. **Users**:
   - Her kullanıcı sadece kendi profilini okuyabilir/düzenleyebilir
   - Gerekli alanlar: `uid`, `email`, `displayName`, `createdAt`

2. **Rooms**:
   - Giriş yapan tüm kullanıcılar odaları okuyabilir
   - Giriş yapan kullanıcılar mesaj yazabilir
   - Mesajların gerekli alanları: `userId`, `text`, `timestamp`

3. **Events**:
   - Giriş yapan tüm kullanıcılar etkinlikleri okuyabilir
   - Sadece `users/{uid}` kaydı olan kullanıcılar yeni etkinlik oluşturabilir
   - Etkinliklerin gerekli alanları: `title`, `location`, `timestamp`

4. **Genel**:
   - Hiç kimse açıkça okuyamaz/yazamaz (`.read` ve `.write` false)
   - Tüm erişim kontrollü yollar aracılığıyla

---

## 🚀 İmplantasyon Kontrol Listesi

### Frontend Sayfaları
- ✅ `/giris` - Login sayfası
- ✅ `/kayit` - Register sayfası
- ✅ `/` - Ana sayfa (Protected)
- ✅ `/events` - Etkinlikler (Protected)
- ✅ `/chat/:id` - Sohbet odası (Protected)
- ✅ `/profile` - Profil sayfası (Protected)
- ✅ `/about` - Hakkında sayfası (Protected)

### Gerekli Gelişmeler
- [ ] Profil düzenleme sayfası
- [ ] Etkinlik oluşturma formu
- [ ] Sohbet odası seçimi
- [ ] Coğrafi konum izni
- [ ] Resim yükleme (Storage)
- [ ] Google/GitHub OAuth
- [ ] E-posta doğrulama
- [ ] Şifre sıfırlama

---

## 🔧 Ortam Değişkenleri

`.env` dosyasında (Frontend):
```
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=friendly-2fb02.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=friendly-2fb02
VITE_FIREBASE_STORAGE_BUCKET=friendly-2fb02.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=111111111111
VITE_FIREBASE_APP_ID=1:111111111111:web:abcdef123456
VITE_FIREBASE_DATABASE_URL=https://friendly-2fb02-default-rtdb.europe-west1.firebasedatabase.app
```

---

## 📝 API Endpoints (Gelecek)

Backend Express endpoints (sunucu için):

- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/users/:uid` - Kullanıcı bilgisi
- `PUT /api/users/:uid` - Profil güncelle
- `GET /api/events` - Tüm etkinlikleri getir
- `POST /api/events` - Etkinlik oluştur
- `GET /api/rooms` - Odaları getir
- `POST /api/rooms/:id/messages` - Mesaj gönder

---

## 📞 Hata Yönetimi

### Common Hata Kodları:
- `auth/user-not-found` - Kullanıcı bulunamadı
- `auth/wrong-password` - Yanlış şifre
- `auth/email-already-in-use` - E-posta zaten kayıtlı
- `auth/invalid-email` - Geçersiz e-posta
- `auth/weak-password` - Zayıf şifre
- `permission-denied` - Veritabanı izni yok

Tüm hata kodları UI'da Türkçe mesajlara çevrilmiştir.

---

## 🔄 Veri Senkronizasyonu

- Realtime Database değişiklikleri otomatik olarak tüm bağlı istemcilere iletilir
- Offline desteği: Firebase, verileri yerel olarak önbelleğe alır
- Geri geldiğinde otomatik senkronizasyon yapılır

---

## 📱 Mobil Uyumluluk

Tüm rotalar ve formlar mobil cihazlarda responsive olacak şekilde tasarlanmıştır.
