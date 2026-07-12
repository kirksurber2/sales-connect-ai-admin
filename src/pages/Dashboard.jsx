import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiShoppingCart, FiMessageSquare, FiDollarSign, FiPlus, FiEye } from 'react-icons/fi';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../utils/api';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ clients: 0, orders: 0, tickets: 0, mrr: 0 });

  useEffect(() => {
    async function load() {
      try {
        const [clients, orders, tickets] = await Promise.all([
          api.get('/clients'),
          api.get('/orders'),
          api.get('/tickets'),
        ]);
        setStats({
          clients: clients.filter(c => c.status === 'Active').length,
          orders: orders.filter(o => o.status === 'Pending').length,
          tickets: tickets.filter(t => t.status === 'Open').length,
          mrr: 0,
        });
      } catch { /* mock data fallback */ }
    }
    load();
  }, []);

  const cards = [
    { label: 'Active Clients', value: stats.clients, icon: FiUsers, color: 'var(--accent)' },
    { label: 'Pending Orders', value: stats.orders, icon: FiShoppingCart, color: 'var(--warning)' },
    { label: 'Open Tickets', value: stats.tickets, icon: FiMessageSquare, color: 'var(--error)' },
    { label: 'MRR', value: `$${stats.mrr.toLocaleString()}`, icon: FiDollarSign, color: 'var(--success)' },
  ];

  return (
    <div>
      <h1 className={styles.greeting}>Welcome back, {user?.signInDetails?.loginId?.split('@')[0] || 'Admin'}</h1>

      <div className={styles.statsGrid}>
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ color }}><Icon size={22} /></div>
            <div>
              <div className={styles.statValue}>{value}</div>
              <div className={styles.statLabel}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.quickLinks}>
        <Link to="/clients/new" className={styles.quickLink}><FiPlus /> New Client</Link>
        <Link to="/orders" className={styles.quickLink}><FiEye /> View Orders</Link>
        <Link to="/tickets" className={styles.quickLink}><FiMessageSquare /> Tickets</Link>
      </div>
    </div>
  );
}
