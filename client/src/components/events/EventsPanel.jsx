import { useState } from 'react';
import styles from './EventsPanel.module.css';

export default function EventsPanel() {
  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'Ankara Buluşması',
      description: 'Yazılımcılar için ağ kurma etkinliği',
      location: 'Çankaya, Ankara',
      date: '15 Aralık 2025',
      time: '18:00',
      attendees: 12
    },
    {
      id: 2,
      title: 'Spor Turnuvası',
      description: 'Futsal maçı',
      location: 'Keçiören, Ankara',
      date: '16 Aralık 2025',
      time: '19:00',
      attendees: 8
    },
    {
      id: 3,
      title: 'Sanat Sergisi',
      description: 'Yerel sanatçıların eserleri',
      location: 'Çankaya Kültür Merkezi',
      date: '17 Aralık 2025',
      time: '16:00',
      attendees: 25
    }
  ]);

  return (
    <div className={styles.eventsPanel}>
      <div className={styles.header}>
        <h2>Etkinlikler</h2>
      </div>

      <div className={styles.eventsList}>
        {events.map((event) => (
          <div key={event.id} className={styles.eventCard}>
            <div className={styles.eventHeader}>
              <h3>{event.title}</h3>
              <span className={styles.attendees}>👥 {event.attendees}</span>
            </div>

            <p className={styles.description}>{event.description}</p>

            <div className={styles.eventDetails}>
              <div className={styles.detail}>
                <span className={styles.icon}>📍</span>
                <span>{event.location}</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.icon}>📅</span>
                <span>{event.date}</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.icon}>⏰</span>
                <span>{event.time}</span>
              </div>
            </div>

            <button className={styles.joinBtn}>Katıl</button>
          </div>
        ))}
      </div>
    </div>
  );
}
