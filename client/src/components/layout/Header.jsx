import styles from './Header.module.css';
import { useAuth } from '../../hooks/useAuth.jsx';
import ProfileMenu from '../header/ProfileMenu.jsx';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <h1>🌍 Friendly</h1>
        </div>

        <nav className={styles.nav}>
          <a href="/">Harita</a>
          <a href="/events">Etkinlikler</a>
          <a href="/chat">Sohbet</a>
          <a href="/about">Hakkında</a>
        </nav>

        <div className={styles.userMenu}>
          {user ? (
            <ProfileMenu />
          ) : (
            <a href="/auth" className={styles.loginBtn}>
              Giriş Yap
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
