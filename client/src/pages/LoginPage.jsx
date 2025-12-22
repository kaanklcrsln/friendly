import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import styles from './AuthPages.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError('Lütfen tüm alanları doldurunuz');
        return;
      }

      await signInWithEmail(email, password);
      navigate('/main');
    } catch (err) {
      const errorMessages = {
        'auth/user-not-found': 'E-posta veya şifre hatalı',
        'auth/wrong-password': 'E-posta veya şifre hatalı',
        'auth/invalid-email': 'Geçersiz e-posta adresi',
        'auth/invalid-credential': 'E-posta veya şifre hatalı. Lütfen tekrar deneyin',
        'auth/user-disabled': 'Bu hesap devre dışı bırakılmış',
        'auth/too-many-requests': 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyiniz',
      };
      setError(errorMessages[err.code] || 'Giriş yapılamadı. Lütfen tekrar deneyin');
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
            <label htmlFor="email">Öğrenci E-posta</label>
            <input
              id="email"
              type="email"
              placeholder="kaankilicarslan@hacettepe.edu.tr"
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

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Girişi devam ediyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className={styles.divider}>veya</div>

        <div className={styles.authFooter}>
          <p>Henüz hesabın yok mu?</p>
          <Link to="/kayit" className={styles.link}>
            Kayıt Ol
          </Link>
        </div>
      </div>
    </div>
  );
}
