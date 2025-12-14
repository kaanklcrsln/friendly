import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { rtdb } from '../api/firebase.js';
import { ref, set } from 'firebase/database';
import styles from './AuthPages.module.css';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUpWithEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validasyon
      if (!email || !password || !confirmPassword || !displayName) {
        setError('Lütfen tüm alanları doldurunuz');
        return;
      }

      if (password.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır');
        return;
      }

      if (password !== confirmPassword) {
        setError('Şifreler eşleşmiyor');
        return;
      }

      if (displayName.length < 2) {
        setError('Ad en az 2 karakter olmalıdır');
        return;
      }

      // Firebase Auth
      const userCredential = await signUpWithEmail(email, password);
      const userId = userCredential.user.uid;

      // Realtime Database'e kullanıcı bilgisi kaydet
      await set(ref(rtdb, `users/${userId}`), {
        uid: userId,
        email: email,
        displayName: displayName,
        createdAt: new Date().toISOString(),
        profilePicture: null,
        bio: '',
        location: null, // İlerde coğrafya bilgisi
      });

      navigate('/main');
    } catch (err) {
      const errorMessages = {
        'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanılmakta',
        'auth/invalid-email': 'Geçersiz e-posta adresi',
        'auth/weak-password': 'Şifre çok zayıf. En az 6 karakter ve karışık karakterler içermeli',
        'auth/operation-not-allowed': 'Kayıt işlemi şu anda yapılamıyor',
      };
      setError(errorMessages[err.code] || 'Kayıt başarısız: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <img src="/friendly/assets/friendly-logo_trans.png" alt="Friendly Logo" className={styles.logo} />
   
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="displayName">Ad Soyad</label>
            <input
              id="displayName"
              type="text"
              placeholder="Adınızı girin"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">E-posta</label>
            <input
              id="email"
              type="email"
              placeholder="ornek@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Şifre</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Şifreyi Onayla</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Hesap oluşturuluyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <div className={styles.divider}>veya</div>

        <div className={styles.authFooter}>
          <p>Zaten hesabın var mı?</p>
          <Link to="/giris" className={styles.link}>
            Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
}
