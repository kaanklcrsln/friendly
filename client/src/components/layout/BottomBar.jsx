import { useState, useEffect, useRef } from 'react';
import { ref, push, get, set } from 'firebase/database';
import { rtdb } from '../../api/firebase';
import { useAuth } from '../../hooks/useAuth';
import { isAdmin } from '../../utils/adminConfig';
import AddressSelectionModal from '../modals/AddressSelectionModal';
import styles from './BottomBar.module.css';

export default function BottomBar() {
  const [showModal, setShowModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'Sosyal',
    coordinates: null
  });
  const { user } = useAuth();

  const handleLocationSelect = (locationData) => {
    setFormData(prev => ({
      ...prev,
      location: locationData.fullAddress,
      coordinates: locationData.coordinates
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const eventData = {
        ...formData,
        createdBy: user.uid,
        createdByEmail: user.email,
        createdByName: user.displayName || user.email.split('@')[0],
        createdAt: new Date().toISOString(),
        participation: { [user.uid]: 'approved' },
        participantCount: 1
      };

      // Etkinliği oluştur
      const eventRef = await push(ref(rtdb, 'events'), eventData);
      const eventId = eventRef.key;

      console.log('BottomBar: Yeni etkinlik oluşturuldu:', eventId);

      // Tüm kullanıcıları al ve bildirim gönder
      try {
        const usersRef = ref(rtdb, 'users');
        const usersSnapshot = await get(usersRef);
        
        if (usersSnapshot.exists()) {
          const users = usersSnapshot.val();
          const creatorName = user.displayName || user.email.split('@')[0];
          
          // Her kullanıcıya bildirim gönder (kendisi hariç)
          const notificationPromises = Object.keys(users)
            .filter(userId => userId !== user.uid)
            .map(async userId => {
              try {
                const notificationRef = push(ref(rtdb, `notifications/${userId}`));
                return await set(notificationRef, {
                  type: 'new_event',
                  eventId: eventId,
                  eventTitle: formData.title,
                  from: user.uid,
                  fromName: creatorName,
                  message: `${creatorName} yeni bir etkinlik oluşturdu!`,
                  timestamp: Date.now(),
                  read: false
                });
              } catch (notificationError) {
                console.error(`BottomBar: ${userId} kullanıcısına bildirim gönderilemedi:`, notificationError);
                // Bildirim hatası etkinlik oluşumunu engellemez
                return null;
              }
            });
            
          await Promise.allSettled(notificationPromises);
          console.log('BottomBar: Etkinlik bildirimleri gönderildi');
        }
      } catch (notificationError) {
        console.error('BottomBar: Bildirim gönderme hatası:', notificationError);
        // Bildirim hatası etkinlik oluşumunu engellemez
      }
      
      // Formu sıfırla ve modalı kapat
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        category: 'Sosyal',
        coordinates: null
      });
      setShowModal(false);
    } catch (error) {
      console.error('Etkinlik oluşturulurken hata:', error);
    }
  };

  // Tüm kullanıcılar etkinlik oluşturabilir
  if (!user) {
    return null;
  }

  return (
    <>
      <div className={styles.bottomBar}></div>

      <button
        className={styles.floatingBtn}
        onClick={() => setShowModal(true)}
        title="Etkinlik Oluştur (Admin)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={styles.floatingBtnIcon}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Etkinlik Oluştur</h2>
              <span className={styles.adminBadge}>👨‍💼 Admin</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Başlık</label>
                <input 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Etkinlik başlığı" 
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Açıklama</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Etkinliğin açıklaması" 
                  rows="4"
                  required
                ></textarea>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Tarih</label>
                  <input 
                    type="date" 
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Saat</label>
                  <input 
                    type="time" 
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Konum</label>
                <div className={styles.locationInputWrapper}>
                  <input 
                    type="text" 
                    name="location"
                    value={formData.location}
                    placeholder={formData.location || "Konum seçmek için tıklayın"} 
                    readOnly
                    className={styles.locationInput}
                  />
                  <button
                    type="button"
                    className={styles.locationBtn}
                    onClick={() => setShowAddressModal(true)}
                  >
                    📍 Seç
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Kategori</label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="Sosyal">Sosyal</option>
                  <option value="Spor">Spor</option>
                  <option value="Eğitim">Eğitim</option>
                  <option value="Sanat">Sanat</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowModal(false)}
                >
                  İptal
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AddressSelectionModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onLocationSelect={handleLocationSelect}
      />
    </>
  );
}
