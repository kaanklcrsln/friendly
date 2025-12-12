import styles from './Layout.module.css';
import Navbar from './Navbar';
import BottomBar from './BottomBar';

export default function Layout({ children }) {
  return (
    <div className={styles.layout}>
      <Navbar />
      <main className={styles.main}>
        {children}
      </main>
      <BottomBar />
    </div>
  );
}
