import { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, query, orderByChild } from 'firebase/database';
import { rtdb } from '../../api/firebase';
import { useAuth } from '../../hooks/useAuth';
import styles from './GeneralChat.module.css';

export default function GeneralChat() {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  // Firebase'den genel chat mesajlarını yükle
  useEffect(() => {
    if (!user) return;

    const chatRef = ref(rtdb, 'chat/general');
    const chatQuery = query(chatRef, orderByChild('timestamp'));
    
    const unsubscribe = onValue(chatQuery, (snapshot) => {
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
  }, [user]);

  // Mesajlar güncellenince en alta kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !user) return;

    setLoading(true);
    try {
      await push(ref(rtdb, 'chat/general'), {
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
      <div className={styles.chatHeader}>
        <h2>General Chat</h2>
        <span className={styles.userCount}>{messages.length} mesaj</span>
      </div>

      <div className={styles.messagesList}>
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
