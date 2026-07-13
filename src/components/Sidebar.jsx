import { NavLink } from 'react-router-dom';
import { FiHome, FiUsers, FiShoppingCart, FiMessageSquare, FiDollarSign, FiUserCheck, FiFileText, FiBook, FiMenu, FiGlobe } from 'react-icons/fi';
import styles from './Sidebar.module.css';

const links = [
  { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
  { to: '/business', icon: FiUsers, label: 'Business' },
  { to: '/orders', icon: FiShoppingCart, label: 'Orders' },
  { to: '/tickets', icon: FiMessageSquare, label: 'Tickets' },
  { to: '/billing', icon: FiDollarSign, label: 'Billing' },
  { to: '/team', icon: FiUserCheck, label: 'Team' },
  { to: '/templates', icon: FiFileText, label: 'Templates' },
  { to: '/sites/build', icon: FiGlobe, label: 'Site Builder' },
  { to: '/sops', icon: FiBook, label: 'SOPs' },
];

export default function Sidebar({ open, onToggle }) {
  return (
    <>
      <button className={styles.mobileToggle} onClick={onToggle}><FiMenu /></button>
      <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        <div className={styles.brand}>SCA Admin</div>
        <nav className={styles.nav}>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`} onClick={onToggle}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <div className={styles.overlay} onClick={onToggle} />}
    </>
  );
}
