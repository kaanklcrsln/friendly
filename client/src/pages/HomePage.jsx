import styles from './HomePage.module.css';
import MapContainer from '../components/map/MapContainer';
import ChatPanel from '../components/chat/ChatPanel';
import EventsPanel from '../components/events/EventsPanel';
import Layout from '../components/layout/Layout';

export default function HomePage() {
  return (
    <Layout>
      <div className={styles.homeContainer}>
        <div className={styles.eventsColumn}>
          <EventsPanel />
        </div>

        <div className={styles.mapColumn}>
          <MapContainer />
        </div>

        <div className={styles.chatColumn}>
          <ChatPanel />
        </div>
      </div>
    </Layout>
  );
}
