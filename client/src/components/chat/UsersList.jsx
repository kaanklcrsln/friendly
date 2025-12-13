import { useState, useEffect } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { rtdb } from '../../api/firebase';
import { useAuth } from '../../hooks/useAuth';
import { addFriend, areFriends } from '../../utils/chatUtils';
import styles from './UsersList.module.css';

export default function UsersList({ friends, friendsData, onFriendSelect }) {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Tüm kullanıcıları yükle (potansiyel arkadaşlar)
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const usersRef = ref(rtdb, 'users');
    
    const unsubscribe = onValue(usersRef, async (snapshot) => {
      const usersList = [];
      
      if (snapshot.exists()) {
        const usersObj = snapshot.val();
        for (const userId of Object.keys(usersObj)) {
          // Kendini hariç tut
          if (userId === user.uid) continue;
          
          const userData = usersObj[userId];
          const isFriend = friends.includes(userId);
          
          usersList.push({
            id: userId,
            email: userData.email,
            displayName: userData.displayName || userData.email.split('@')[0],
            isFriend
          });
        }
      }
      
      setAllUsers(usersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, friends]);

  const handleAddFriend = async (userId, e) => {
    e.stopPropagation();
    
    try {
      const success = await addFriend(user.uid, userId);
      if (success) {
        // Kullanıcı listesi otomatik güncellenir (firebase listener)
      }
    } catch (error) {
      console.error('Arkadaş ekleme hatası:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Arkadaşlar & Kullanıcılar</h2>
        <span className={styles.count}>{friends.length} arkadaş</span>
      </div>

      {loading ? (
        <div className={styles.loading}>Yükleniyor...</div>
      ) : (
        <div className={styles.usersList}>
          {allUsers.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Henüz kullanıcı yok</p>
            </div>
          ) : (
            allUsers.map((u) => (
              <div
                key={u.id}
                className={`${styles.userItem} ${u.isFriend ? styles.friend : ''}`}
                onClick={() => u.isFriend && onFriendSelect(u.id)}
              >
                <div className={styles.userInfo}>
                  <h3>{u.displayName}</h3>
                  <p>{u.email}</p>
                </div>

                {!u.isFriend ? (
                  <button
                    className={styles.addBtn}
                    onClick={(e) => handleAddFriend(u.id, e)}
                    title="Arkadaş ekle"
                  >
                    + Ekle
                  </button>
                ) : (
                  <>
                    <span className={styles.friendBadge}>👥 Arkadaş</span>
                    <svg
                      className={styles.arrow}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
