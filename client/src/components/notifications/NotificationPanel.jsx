import { useState, useEffect } from 'react';
import { ref, onValue, update, remove, push, set, get } from 'firebase/database';
import { rtdb, auth } from '../../api/firebase';
import styles from './NotificationPanel.module.css';

export default function NotificationPanel({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !auth.currentUser) return;

    const userId = auth.currentUser.uid;

    // Listen to friend requests
    const requestsRef = ref(rtdb, `friendRequests/${userId}`);
    const unsubRequests = onValue(requestsRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const requestsList = await Promise.all(
          Object.entries(data).map(async ([id, request]) => {
            // Get sender info
            const senderRef = ref(rtdb, `users/${request.from}`);
            const senderSnap = await get(senderRef);
            const senderData = senderSnap.val();
            return {
              id,
              ...request,
              senderName: senderData?.displayName || 'Kullanıcı',
              senderEmail: senderData?.email || '',
              senderAvatar: senderData?.profilePicture || null,
              senderUniversity: senderData?.university || null
            };
          })
        );
        setFriendRequests(requestsList.filter(r => r.status === 'pending'));
      } else {
        setFriendRequests([]);
      }
      setLoading(false);
    });

    // Listen to notifications
    const notificationsRef = ref(rtdb, `notifications/${userId}`);
    const unsubNotifications = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationsList = Object.entries(data)
          .map(([id, notification]) => ({
            id,
            ...notification
          }))
          .sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(notificationsList);
      } else {
        setNotifications([]);
      }
    });

    return () => {
      unsubRequests();
      unsubNotifications();
    };
  }, [isOpen]);

  const handleAcceptRequest = async (request) => {
    const userId = auth.currentUser.uid;
    
    try {
      console.log('NotificationPanel: Arkadaşlık isteği kabul ediliyor...', { userId, from: request.from });
      
      // Add to both users' friend lists (correct path)
      const userFriendsRef = ref(rtdb, `users/${userId}/friends/${request.from}`);
      const senderFriendsRef = ref(rtdb, `users/${request.from}/friends/${userId}`);
      
      await set(userFriendsRef, {
        addedAt: Date.now(),
        status: 'accepted'
      });
      
      await set(senderFriendsRef, {
        addedAt: Date.now(),
        status: 'accepted'
      });

      console.log('NotificationPanel: Arkadaş listeleri güncellendi');

      // Remove the request completely
      const requestRef = ref(rtdb, `friendRequests/${userId}/${request.id}`);
      await remove(requestRef);
      
      console.log('NotificationPanel: Arkadaşlık isteği silindi');

      // Send notification to requester
      const notificationRef = push(ref(rtdb, `notifications/${request.from}`));
      await set(notificationRef, {
        type: 'friend_accepted',
        from: userId,
        message: `${auth.currentUser.displayName || 'Bir kullanıcı'} arkadaşlık isteğinizi kabul etti`,
        timestamp: Date.now(),
        read: false
      });
      
      console.log('NotificationPanel: Kabul bildirim gönderildi');

    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleRejectRequest = async (request) => {
    const userId = auth.currentUser.uid;
    
    try {
      console.log('NotificationPanel: Arkadaşlık isteği reddediliyor...', { userId, requestId: request.id });
      
      const requestRef = ref(rtdb, `friendRequests/${userId}/${request.id}`);
      await remove(requestRef);
      
      console.log('NotificationPanel: Arkadaşlık isteği başarıyla reddedildi');
    } catch (error) {
      console.error('NotificationPanel: Red hatası:', error);
    }
  };

  const handleMarkAsRead = async (notification) => {
    const userId = auth.currentUser.uid;
    const notificationRef = ref(rtdb, `notifications/${userId}/${notification.id}`);
    await update(notificationRef, { read: true });
  };

  const handleNotificationClick = async (notification) => {
    console.log('NotificationPanel: Bildirime tıklandı:', notification);
    
    // Bildirimi okundu olarak işaretle
    await handleMarkAsRead(notification);
    
    // Eğer etkinlik bildirimi ise haritayı zoom yap
    if (notification.type === 'new_event' && notification.eventId) {
      console.log('NotificationPanel: Etkinlik bildirimi, haritayı zoomlayacağım:', notification.eventId);
      
      // Haritayı zoom yap
      if (window.focusEventOnMap) {
        window.focusEventOnMap(notification.eventId);
        
        // Notification panelini kapat
        onClose();
      } else {
        console.log('NotificationPanel: focusEventOnMap fonksiyonu bulunamadı');
      }
    }
  };

  const handleDeleteNotification = async (notification) => {
    const userId = auth.currentUser.uid;
    const notificationRef = ref(rtdb, `notifications/${userId}/${notification.id}`);
    await remove(notificationRef);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Az önce';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} dakika önce`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} saat önce`;
    return date.toLocaleDateString('tr-TR');
  };

  if (!isOpen) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.panelContent}>
        <div className={styles.header}>
          <h3>Bildirimler</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'requests' ? styles.active : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            İstekler {friendRequests.length > 0 && <span className={styles.badge}>{friendRequests.length}</span>}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'notifications' ? styles.active : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Bildirimler {notifications.filter(n => !n.read).length > 0 && 
              <span className={styles.badge}>{notifications.filter(n => !n.read).length}</span>}
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Yükleniyor...</div>
          ) : activeTab === 'requests' ? (
            friendRequests.length === 0 ? (
              <div className={styles.empty}>Bekleyen arkadaşlık isteği yok</div>
            ) : (
              friendRequests.map(request => (
                <div key={request.id} className={styles.requestItem}>
                  <div className={styles.requestInfo}>
                    <div className={styles.avatar}>
                      {request.senderAvatar ? (
                        <img src={request.senderAvatar} alt="" />
                      ) : (
                        '👤'
                      )}
                    </div>
                    <div className={styles.details}>
                      <p className={styles.name}>{request.senderName}</p>
                      {request.senderUniversity && (
                        <p className={styles.university}>{request.senderUniversity}</p>
                      )}
                      <p className={styles.time}>{formatTime(request.timestamp)}</p>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button
                      className={styles.acceptBtn}
                      onClick={() => handleAcceptRequest(request)}
                    >
                      ✓
                    </button>
                    <button
                      className={styles.rejectBtn}
                      onClick={() => handleRejectRequest(request)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            notifications.length === 0 ? (
              <div className={styles.empty}>Bildirim yok</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={styles.notificationContent}>
                    <p className={styles.notificationMessage}>{notification.message}</p>
                    <p className={styles.notificationTime}>{formatTime(notification.timestamp)}</p>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
