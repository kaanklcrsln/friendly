import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import AddFriendModal from '../friends/AddFriendModal';
import NotificationPanel from '../notifications/NotificationPanel';
import ProfileModal from '../profile/ProfileModal';
import SettingsModal from '../settings/SettingsModal';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <div className={styles.logo}>
            <img src="/friendly/assets/friendly-logo_trans.png" alt="Friendly Logo" />
          </div>

          <div className={styles.actions}>
            {/* Bildirimler Butonu */}
            <button 
              className={styles.iconBtn} 
              title="Bildirimler"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowAddFriend(false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </button>

            {/* Arkadaş Ekle Butonu */}
            <button 
              className={styles.iconBtn} 
              title="Arkadaş Ekle"
              onClick={() => {
                setShowAddFriend(true);
                setShowNotifications(false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
              </svg>
            </button>

            {/* Profil Menüsü */}
            <div className={styles.menu} ref={menuRef}>
              <button
                className={styles.profileBtn}
                onClick={() => setIsOpen(!isOpen)}
                title="Profil"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </button>

              {isOpen && (
                <div className={styles.dropdown}>
                  {user && (
                    <>
                      <div className={styles.userInfo}>
                        <p className={styles.userName}>
                          {user.displayName || user.email?.split('@')[0] || 'Kullanıcı'}
                        </p>
                        <p className={styles.userEmail}>{user.email}</p>
                      </div>
                      <hr className={styles.divider} />
                    </>
                  )}

                  <button 
                    className={styles.menuItem} 
                    onClick={() => {
                      setIsOpen(false);
                      setShowProfile(true);
                    }}
                  >
                    ✏️ Profili Düzenle
                  </button>
                  <button 
                    className={styles.menuItem} 
                    onClick={() => {
                      setIsOpen(false);
                      setShowSettings(true);
                    }}
                  >
                    ⚙️ Ayarlar
                  </button>
                  <hr className={styles.divider} />
                  <button className={styles.menuItemDanger} onClick={handleLogout}>
                    🚪 Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <AddFriendModal 
        isOpen={showAddFriend} 
        onClose={() => setShowAddFriend(false)} 
      />
      
      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
      
      <ProfileModal 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
