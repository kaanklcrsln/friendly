import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { rtdb } from '../../api/firebase';
import { ref, get, push, set, onValue } from 'firebase/database';
import styles from './AddFriendModal.module.css';

export default function AddFriendModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Tüm kullanıcıları yükle (realtime listener)
  useEffect(() => {
    if (!isOpen || !user) {
      console.log('AddFriendModal: Modal kapalı veya user yok', { isOpen, user: !!user });
      return;
    }
    
    console.log('AddFriendModal: Kullanıcılar yükleniyor...');
    setLoading(true);
    const usersRef = ref(rtdb, 'users');
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      console.log('AddFriendModal: Snapshot alındı', { exists: snapshot.exists() });
      const users = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          if (child.key !== user.uid) {
            users.push({ uid: child.key, ...child.val() });
          }
        });
        console.log('AddFriendModal: Kullanıcılar bulundu:', users.length, users);
      } else {
        console.log('AddFriendModal: Snapshot boş - kullanıcı yok');
      }
      
      setAllUsers(users);
      setSearchResults(users);
      setLoading(false);
    }, (error) => {
      console.error('AddFriendModal: Kullanıcılar yüklenirken hata:', error);
      setMessage('Kullanıcılar yüklenemedi: ' + error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  // Arama filtresi
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults(allUsers);
      return;
    }

    const filtered = allUsers.filter(u =>
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.university?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(filtered);
  }, [searchTerm, allUsers]);

  const sendFriendRequest = async (toUserId) => {
    try {
      // Daha önce istek gönderilmiş mi kontrol et
      const requestsRef = ref(rtdb, 'friendRequests');
      const snapshot = await get(requestsRef);
      
      if (snapshot.exists()) {
        let alreadySent = false;
        snapshot.forEach((child) => {
          const data = child.val();
          if (data.from === user.uid && data.to === toUserId) {
            alreadySent = true;
          }
        });
        
        if (alreadySent) {
          setMessage('Bu kullanıcıya zaten istek gönderilmiş!');
          return;
        }
      }

      const newRequestRef = push(requestsRef);
      await set(newRequestRef, {
        from: user.uid,
        to: toUserId,
        status: 'pending',
        createdAt: Date.now()
      });

      setMessage('Arkadaşlık isteği gönderildi! ✅');
      setSearchResults(prev =>
        prev.map(u => u.uid === toUserId ? { ...u, requestSent: true } : u)
      );
      setSelectedUser(null);
    } catch (error) {
      console.error('İstek gönderme hatası:', error);
      setMessage('İstek gönderilirken hata oluştu');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Arkadaş Ekle</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Kullanıcı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {message && (
          <div className={`${styles.message} ${message.includes('✅') ? styles.success : styles.error}`}>
            {message}
          </div>
        )}

        <div className={styles.results}>
          {loading ? (
            <p className={styles.loading}>Yükleniyor...</p>
          ) : searchResults.length > 0 ? (
            searchResults.map((searchUser) => (
              <div
                key={searchUser.uid}
                className={`${styles.userItem} ${selectedUser?.uid === searchUser.uid ? styles.selected : ''}`}
                onClick={() => setSelectedUser(searchUser)}
              >
                <div className={styles.userInfo}>
                  <div className={styles.avatar}>
                    {searchUser.profilePicture ? (
                      <img src={searchUser.profilePicture} alt="Profil" />
                    ) : (
                      '👤'
                    )}
                  </div>
                  <div className={styles.userDetails}>
                    <p className={styles.userName}>
                      {searchUser.displayName || 'İsimsiz'}
                    </p>
                    <p className={styles.userEmail}>{searchUser.email}</p>
                    {searchUser.university && (
                      <p className={styles.userUniversity}>{searchUser.university}</p>
                    )}
                  </div>
                </div>

                {searchUser.requestSent ? (
                  <span className={styles.sentBadge}>✅ Gönderildi</span>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sendFriendRequest(searchUser.uid);
                    }}
                    className={styles.addBtn}
                  >
                    ➕ Ekle
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className={styles.noResults}>Kullanıcı bulunamadı</p>
          )}
        </div>

        {/* Seçili kullanıcı profili */}
        {selectedUser && (
          <div className={styles.profilePreview}>
            <div className={styles.previewHeader}>
              <h4>Profil Bilgileri</h4>
              <button onClick={() => setSelectedUser(null)}>×</button>
            </div>
            <div className={styles.previewContent}>
              <div className={styles.previewAvatar}>
                {selectedUser.profilePicture ? (
                  <img src={selectedUser.profilePicture} alt="Profil" />
                ) : (
                  '👤'
                )}
              </div>
              <h3>{selectedUser.displayName || 'İsimsiz'}</h3>
              <p>{selectedUser.email}</p>
              {selectedUser.university && <p>🎓 {selectedUser.university}</p>}
              {selectedUser.department && <p>📚 {selectedUser.department}</p>}
              {selectedUser.bio && <p className={styles.bio}>"{selectedUser.bio}"</p>}
              
              {!selectedUser.requestSent && (
                <button
                  onClick={() => sendFriendRequest(selectedUser.uid)}
                  className={styles.sendRequestBtn}
                >
                  ➕ Arkadaşlık İsteği Gönder
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
