import { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, query, orderByChild, get, onDisconnect, set } from 'firebase/database';
import { rtdb } from '../../api/firebase';
import { useAuth } from '../../hooks/useAuth';
import styles from './PrivateChat.module.css';

export default function PrivateChat() {
  const [friends, setFriends] = useState([]);
  const [friendsData, setFriendsData] = useState({});
  const [onlineStatus, setOnlineStatus] = useState({});
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesContainerRef = useRef(null);
  const shouldScrollRef = useRef(true);
  const { user } = useAuth();

  // Arkadaşları yükle
  useEffect(() => {
    if (!user?.uid) return;

    console.log('PrivateChat: Arkadaşlar yükleniyor...');
    const friendsRef = ref(rtdb, `users/${user.uid}/friends`);
    
    const unsubscribe = onValue(friendsRef, async (snapshot) => {
      const friendIds = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          friendIds.push(child.key);
        });
      }

      console.log('PrivateChat: Arkadaş IDs:', friendIds);
      setFriends(friendIds);

      if (friendIds.length === 0) {
        setFriendsData({});
        return;
      }

      const tempData = {};
      for (const friendId of friendIds) {
        try {
          const friendRef = ref(rtdb, `users/${friendId}`);
          const friendSnap = await get(friendRef);
          if (friendSnap.exists()) {
            const userData = friendSnap.val();
            // Veri bütünlüğünü kontrol et
            if (userData && typeof userData === 'object') {
              tempData[friendId] = {
                displayName: userData.displayName || null,
                email: userData.email || null,
                profilePicture: userData.profilePicture || null,
                ...userData
              };
            }
          }
        } catch (error) {
          console.error('Arkadaş bilgisi yükleme hatası:', error);
        }
      }
      
      console.log('PrivateChat: Arkadaş verileri:', tempData);
      setFriendsData(tempData);
      
      // Arkadaşların çevrimiçi durumunu takip et
      trackFriendsOnlineStatus(friendIds);
    });

    return () => unsubscribe();
  }, [user]);

  // Arkadaşların çevrimiçi durumunu takip et
  const trackFriendsOnlineStatus = (friendIds) => {
    const statusUnsubscribes = [];
    const tempStatus = {};

    friendIds.forEach(friendId => {
      const statusRef = ref(rtdb, `presence/${friendId}`);
      const unsubscribe = onValue(statusRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          tempStatus[friendId] = data.online || false;
        } else {
          tempStatus[friendId] = false;
        }
        setOnlineStatus({...tempStatus});
      });
      statusUnsubscribes.push(unsubscribe);
    });

    return () => {
      statusUnsubscribes.forEach(unsub => unsub());
    };
  };

  // Kullanıcının kendi presence durumunu ayarla
  useEffect(() => {
    if (!user?.uid) return;

    const userStatusRef = ref(rtdb, `presence/${user.uid}`);
    
    // Çevrimiçi olarak işaretle
    const setOnline = async () => {
      await set(userStatusRef, {
        online: true,
        lastSeen: Date.now()
      });
    };

    // Çevrimdışı olma durumunu ayarla
    const setOffline = async () => {
      await set(userStatusRef, {
        online: false,
        lastSeen: Date.now()
      });
    };

    setOnline();

    // Tarayıcı kapandığında çevrimdışı yap
    const onDisconnectRef = onDisconnect(userStatusRef);
    onDisconnectRef.set({
      online: false,
      lastSeen: Date.now()
    });

    // Sayfa kapatılırken de çevrimdışı yap
    const handleBeforeUnload = () => {
      setOffline();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setOffline();
    };
  }, [user]);

  // Seçilen arkadaşla mesajları yükle
  useEffect(() => {
    if (!user || !selectedFriend) {
      setMessages([]);
      return;
    }

    const conversationId = [user.uid, selectedFriend].sort().join('_');
    const messagesRef = ref(rtdb, `chat/private/messages/${conversationId}`);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'));

    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      const messagesData = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          messagesData.push({
            id: child.key,
            ...child.val()
          });
        });
      }
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [user, selectedFriend]);

  useEffect(() => {
    if (messagesContainerRef.current && shouldScrollRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Scroll pozisyonunu takip et
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      shouldScrollRef.current = scrollHeight - scrollTop - clientHeight < 20;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !user || !selectedFriend) return;

    setLoading(true);
    try {
      const conversationId = [user.uid, selectedFriend].sort().join('_');
      
      await push(ref(rtdb, `chat/private/messages/${conversationId}`), {
        text: messageText.trim(),
        userId: user.uid,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
        displayName: user.displayName || user.email.split('@')[0]
      });
      setMessageText('');
      shouldScrollRef.current = true;
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const isCurrentUser = (messageUserId) => messageUserId === user?.uid;

  return (
    <div className={styles.chatContainer}>
      {!selectedFriend ? (
        <div className={styles.friendsList}>
          <div className={styles.friendsHeader}>
            <h3>Arkadaşlarınız</h3>
          </div>
          
          {friends.length === 0 ? (
            <div className={styles.emptyFriends}>
              <p>Henüz arkadaşınız yok</p>
              <p>Arkadaş eklemek için bildirimler kısmını kontrol edin!</p>
            </div>
          ) : (
            <div className={styles.friendsListItems}>
              {friends.map((friendId) => {
                const friendData = friendsData[friendId];
                
                // Veri güvenliği kontrolleri
                if (!friendData || typeof friendData !== 'object') {
                  console.warn('PrivateChat: Geçersiz arkadaş verisi:', friendId, friendData);
                  return null;
                }
                
                return (
                  <div
                    key={friendId}
                    className={styles.friendItem}
                    onClick={() => setSelectedFriend(friendId)}
                  >
                    <div className={styles.friendAvatar}>
                      {friendData.profilePicture ? (
                        <img 
                          src={friendData.profilePicture} 
                          alt={friendData.displayName}
                        />
                      ) : (
                        <div className={styles.avatarPlaceholder}>👤</div>
                      )}
                    </div>
                    
                    <div className={styles.friendInfo}>
                      <span className={styles.friendName}>
                        {friendData.displayName || 
                         (friendData.email ? friendData.email.split('@')[0] : 'Kullanıcı')}
                      </span>
                    </div>
                    
                    <div className={styles.onlineStatus}>
                      <div className={`${styles.statusIndicator} ${onlineStatus[friendId] ? styles.online : styles.offline}`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.chatArea}>
          <div className={styles.chatHeader}>
            <button
              className={styles.backBtn}
              onClick={() => setSelectedFriend(null)}
            >
              ← Geri
            </button>
            <h3>
              {friendsData[selectedFriend]?.displayName || 
               (friendsData[selectedFriend]?.email ? 
                 friendsData[selectedFriend].email.split('@')[0] : 
                 'Kullanıcı')}
            </h3>
          </div>
          
          <div className={styles.messagesList} ref={messagesContainerRef} onScroll={handleScroll}>
            {messages.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Henüz mesaj yok. İlk mesajı gönder!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`${styles.message} ${isCurrentUser(message.userId) ? styles.own : ''}`}
                >
                  <div className={styles.messageHeader}>
                    <span className={styles.userName}>
                      {isCurrentUser(message.userId) ? 'Sen' : message.displayName}
                    </span>
                    <span className={styles.timestamp}>
                      {new Date(message.timestamp).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className={styles.messageContent}>
                    <p>{message.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} className={styles.inputForm}>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Mesaj yaz..."
              disabled={loading}
              className={styles.input}
            />
            <button
              type="submit"
              disabled={loading || !messageText.trim()}
              className={styles.sendBtn}
            >
              {loading ? '...' : 'Gönder'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
