import { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, query, orderByChild, remove } from 'firebase/database';
import { rtdb } from '../../api/firebase';
import { useAuth } from '../../hooks/useAuth';
import { isAdmin } from '../../utils/adminConfig';
import styles from './GeneralChat.module.css';

// Spam ve spam benzeri kelimeler (basit örnek)
const BANNED_PATTERNS = [
  /fuck|shit|asshole/gi,
  /spam+/gi,
  /(.)\1{4,}/g // Tekrar eden karakterler (aaaaa vb.)
];

// Mesaj validasyonu
const validateMessage = (text) => {
  const trimmed = text.trim();
  
  // 1. Boş mesaj kontrolü
  if (!trimmed) {
    return { valid: false, error: 'Mesaj boş olamaz' };
  }
  
  // 2. Max 50 karakter kontrolü
  if (trimmed.length > 50) {
    return { valid: false, error: 'Mesaj max 50 karaktere kadar olabilir' };
  }
  
  // 3. Emoji kontrolü
  const emojiRegex = /[^\w\s,.!?\-'"()]/gu;
  if (emojiRegex.test(trimmed)) {
    return { valid: false, error: 'Emoji kullanılamaz' };
  }
  
  // 4. Spam/Küfür kontrolü
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Mesajda uygunsuz içerik bulundu' };
    }
  }
  
  return { valid: true };
};

export default function GeneralChat() {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [rulesVisible, setRulesVisible] = useState(true);
  const messagesContainerRef = useRef(null);
  const shouldScrollRef = useRef(true);
  const { user } = useAuth();

  // Firebase'den genel chat mesajlarını yükle
  useEffect(() => {
    if (!user) return;

    const chatRef = ref(rtdb, 'chat/general/messages');
    const chatQuery = query(chatRef, orderByChild('timestamp'));
    
    const unsubscribe = onValue(chatQuery, (snapshot) => {
      const messagesData = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const message = child.val();
          messagesData.push({
            id: child.key,
            ...message
          });
        });
      }
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [user]);

  // Mesajlar güncellenince en alta kaydır (sadece kullanıcı en altta ise)
  useEffect(() => {
    if (messagesContainerRef.current && shouldScrollRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Scroll pozisyonunu takip et
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      // Kullanıcı en altta mı kontrol et (20px tolerans)
      shouldScrollRef.current = scrollHeight - scrollTop - clientHeight < 20;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user) {
      console.error('GeneralChat: Kullanıcı giriş yapmamış!');
      return;
    }

    console.log('GeneralChat: Mesaj gönderiliyor...', { text: messageText, userId: user.uid });

    // Validasyon
    const validation = validateMessage(messageText);
    if (!validation.valid) {
      console.warn('GeneralChat: Validasyon hatası:', validation.error);
      setValidationError(validation.error);
      setTimeout(() => setValidationError(''), 3000);
      return;
    }

    setLoading(true);
    setValidationError('');
    try {
      const now = new Date();
      
      const messageData = {
        text: messageText.trim(),
        userId: user.uid,
        userEmail: user.email,
        timestamp: now.toISOString(),
        displayName: user.displayName || user.email.split('@')[0]
      };

      console.log('GeneralChat: Firebase\'e yazılıyor...', messageData);
      
      await push(ref(rtdb, 'chat/general/messages'), messageData);
      
      console.log('GeneralChat: Mesaj başarıyla gönderildi!');
      setMessageText('');
      // Kendi mesajımızı gönderdiğimizde her zaman en alta scroll et
      shouldScrollRef.current = true;
    } catch (error) {
      console.error('GeneralChat: Mesaj gönderme hatası:', error);
      setValidationError('Mesaj gönderilemedi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Mesajı sil (Admin only)
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Bu mesajı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await remove(ref(rtdb, `chat/general/messages/${messageId}`));
    } catch (error) {
      console.error('Mesaj silinirken hata:', error);
    }
  };

  const isCurrentUser = (messageUserId) => messageUserId === user?.uid;

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h2>General Chat</h2>
        <span className={styles.userCount}>{messages.length} mesaj</span>
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
                <div className={styles.messageHeaderRight}>
                  <span className={styles.timestamp}>
                    {new Date(message.timestamp).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {isAdmin(user?.email) && (
                    <button
                      className={styles.deleteMessageBtn}
                      onClick={() => handleDeleteMessage(message.id)}
                      title="Mesajı sil"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
              <div className={styles.messageContent}>
                <p>{message.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSendMessage} className={styles.inputForm}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            value={messageText}
            onChange={(e) => {
              console.log('GeneralChat: Input değişti:', e.target.value);
              setMessageText(e.target.value);
              setValidationError('');
            }}
            onFocus={() => {
              // Input'a tıklandığında kuralları fade out yap
              setRulesVisible(false);
            }}
            onKeyPress={(e) => {
              console.log('GeneralChat: Key pressed:', e.key);
              if (e.key === 'Enter') {
                console.log('GeneralChat: Enter tuşuna basıldı');
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Mesaj yaz..."
            disabled={loading}
            maxLength="50"
            className={styles.input}
          />
          <span className={styles.charCount}>{messageText.length}/50</span>
        </div>
        {validationError && (
          <div className={styles.errorMessage}>{validationError}</div>
        )}
        <button
          type="submit"
          disabled={loading || !messageText.trim()}
          className={styles.sendBtn}
          onClick={(e) => {
            console.log('GeneralChat: Gönder butonu tıklandı', { loading, messageText });
          }}
        >
          {loading ? '...' : 'Gönder'}
        </button>
      </form>
    </div>
  );
}
