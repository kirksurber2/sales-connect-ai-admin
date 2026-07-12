import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import styles from './tickets.module.css';

export default function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/tickets').then(setTickets).catch(() => setTickets([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const filtered = tickets.filter(t => !statusFilter || t.status === statusFilter);

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Tickets</h1>
      <div className={styles.filters}>
        <select className={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Waiting on Client</option>
          <option>Resolved</option>
        </select>
      </div>

      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <span>Client</span>
          <span>Subject</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Date</span>
        </div>
        {filtered.map(t => (
          <div key={t._id} className={styles.tableRow} onClick={() => navigate(`/tickets/${t._id}`)}>
            <span>{t.businessId}</span>
            <span>{t.subject}</span>
            <span><StatusBadge status={t.priority} /></span>
            <span><StatusBadge status={t.status} /></span>
            <span className={styles.muted}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</span>
          </div>
        ))}
        {filtered.length === 0 && <div className={styles.empty}>No tickets found</div>}
      </div>
    </div>
  );
}
