import { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, query, orderByChild, get } from 'firebase/database';
import { rtdb } from '../../api/firebase';
import { useAuth } from '../../hooks/useAuth';
import styles from './PrivateChat.module.css';

export default function PrivateChat() {
  const [friends, setFriends] = useState([]);
  const [friendsData, setFriendsData] = useState({});
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
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
            tempData[friendId] = friendSnap.val();
          }
        } catch (error) {
          console.error('Arkadaş bilgisi yükleme hatası:', error);
        }
      }
      
      console.log('PrivateChat: Arkadaş verileri:', tempData);
      setFriendsData(tempData);
    });

    return () => unsubscribe();
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
          <div className={styles.header}>
            <h3>Arkadaşlarınız</h3>
          </div>
          
          {friends.length === 0 ? (
            <div className={styles.emptyFriends}>
              <p>Henüz arkadaşınız yok</p>
              <p>Arkadaş eklemek için bildirimler kısmını kontrol edin!</p>
            </div>
          ) : (
            <div className={styles.friendItems}>
              {friends.map((friendId) => {
                const friendData = friendsData[friendId];
                if (!friendData) return null;
                
                return (
                  <div
                    key={friendId}
                    className={styles.friendItem}
                    onClick={() => setSelectedFriend(friendId)}
                  >
                    {friendData.profilePicture ? (
                      <img 
                        src={friendData.profilePicture} 
                        alt={friendData.displayName}
                        className={styles.friendAvatar}
                      />
                    ) : (
                      <div className={styles.friendAvatarPlaceholder}>👤</div>
                    )}
                    <div className={styles.friendInfo}>
                      <h4>{friendData.displayName}</h4>
                      <p>{friendData.email}</p>
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
            <h3>{friendsData[selectedFriend]?.displayName}</h3>
          </div>
          
          <div className={styles.messagesList}>
            {messages.length === 0 ? (
              <div className={styles.emptyChat}>
                <p>Henüz mesaj yok. Sohbeti başlat!</p>
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
            <div ref={messagesEndRef} />
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
