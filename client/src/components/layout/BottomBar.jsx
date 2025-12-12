import { useState } from 'react';
import styles from './BottomBar.module.css';

export default function BottomBar() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className={styles.bottomBar}></div>

      <button
        className={styles.floatingBtn}
        onClick={() => setShowModal(true)}
        title="Etkinlik Oluştur"
      >
        +
      </button>

      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Etkinlik Oluştur</h2>
            <form>
              <div className={styles.formGroup}>
                <label>Başlık</label>
                <input type="text" placeholder="Etkinlik başlığı" />
              </div>

              <div className={styles.formGroup}>
                <label>Açıklama</label>
                <textarea placeholder="Etkinliğin açıklaması" rows="4"></textarea>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Tarih</label>
                  <input type="date" />
                </div>
                <div className={styles.formGroup}>
                  <label>Saat</label>
                  <input type="time" />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Konum</label>
                <input type="text" placeholder="Ankara, Çankaya" />
              </div>

              <div className={styles.formGroup}>
                <label>Kategori</label>
                <select>
                  <option>Sosyal</option>
                  <option>Spor</option>
                  <option>Eğitim</option>
                  <option>Sanat</option>
                  <option>Diğer</option>
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
    </>
  );
}
