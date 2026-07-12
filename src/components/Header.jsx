import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '../auth/AuthProvider';
import styles from './Header.module.css';

export default function Header() {
  const { user, logout } = useAuth();
  return (
    <header className={styles.header}>
      <div />
      <div className={styles.right}>
        <span className={styles.name}>{user?.signInDetails?.loginId || 'Admin'}</span>
        <button className={styles.logout} onClick={logout}><FiLogOut size={16} /> Logout</button>
      </div>
    </header>
  );
}
