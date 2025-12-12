import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import styles from './ProfileMenu.module.css';

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className={styles.profileMenu} ref={menuRef}>
      <button
        className={styles.profileBtn}
        onClick={() => setIsOpen(!isOpen)}
        title="Profil"
      >
        👤
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {user && (
            <>
              <div className={styles.userInfo}>
                <p className={styles.userName}>
                  {user.email?.split('@')[0] || 'Kullanıcı'}
                </p>
                <p className={styles.userEmail}>{user.email}</p>
              </div>
              <hr className={styles.divider} />
            </>
          )}

          <button className={styles.menuItem} onClick={() => setIsOpen(false)}>
            ✏️ Profili Düzenle
          </button>
          <button className={styles.menuItem} onClick={() => setIsOpen(false)}>
            ⚙️ Ayarlar
          </button>
          <hr className={styles.divider} />
          <button className={styles.menuItemDanger} onClick={handleLogout}>
            🚪 Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
}
