import { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, query, orderByChild } from 'firebase/database';
import { rtdb } from '../../api/firebase';
import { useAuth } from '../../hooks/useAuth';
import { isAdmin } from '../../utils/adminConfig';
import { areFriends, removeFriend } from '../../utils/chatUtils';
import styles from './PrivateChat.module.css';

export default function PrivateChat({ conversationId, friendId, friendEmail, onClose }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFriend, setIsFriend] = useState(true);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  // Arkadaş durumunu kontrol et
  useEffect(() => {
    if (!user || !friendId) return;

    const checkFriendship = async () => {
      const friends = await areFriends(user.uid, friendId);
      setIsFriend(friends);
    };

    checkFriendship();
  }, [user, friendId]);

  // Firebase'den private chat mesajlarını yükle
  useEffect(() => {
    if (!user || !conversationId || !isFriend) return;

    const messagesRef = ref(rtdb, `chat/kişiler/özel/mesajlar/${conversationId}`);
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
  }, [user, conversationId, isFriend]);

  // Mesajlar güncellenince en alta kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !user || !isFriend) return;

    setLoading(true);
    try {
      await push(ref(rtdb, `chat/kişiler/özel/mesajlar/${conversationId}`), {
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

  const handleRemoveFriend = async () => {
    if (!window.confirm('Arkadaşlığı sonlandırmak istediğine emin misin?')) return;

    try {
      await removeFriend(user.uid, friendId);
      setIsFriend(false);
      onClose?.();
    } catch (error) {
      console.error('Arkadaş silme hatası:', error);
    }
  };

  const isCurrentUser = (messageUserId) => messageUserId === user?.uid;

  if (!isFriend) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <button className={styles.closeBtn} onClick={onClose} title="Kapat">
            ←
          </button>
          <h2>{friendEmail}</h2>
        </div>
        <div className={styles.notFriendsMessage}>
          <p>Bu kullanıcı artık arkadaş değil.</p>
          <button className={styles.closeChat} onClick={onClose}>
            Sohbeti Kapat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <button className={styles.closeBtn} onClick={onClose} title="Kapat">
          ←
        </button>
        <div className={styles.headerTitle}>
          <h2>{friendEmail}</h2>
        </div>
        <button
          className={styles.removeBtn}
          onClick={handleRemoveFriend}
          title="Arkadaşı sil"
        >
          ✕
        </button>
      </div>

      <div className={styles.messagesList}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Henüz mesaj yok. Sohbeti başlat!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${isCurrentUser(message.userId) ? styles.own : ''}`}
            >
              <div className={styles.messageHeader}>
                <div className={styles.userNameContainer}>
                  <span className={styles.userName}>
                    {isCurrentUser(message.userId) ? 'Sen' : message.displayName}
                  </span>
                  {isAdmin(message.userEmail) && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={styles.verifiedBadge} title="Admin">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                    </svg>
                  )}
                </div>
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
  );
}
