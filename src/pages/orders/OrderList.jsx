import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { api } from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import styles from './orders.module.css';

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/orders').then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const filtered = orders.filter(o => !statusFilter || o.status === statusFilter);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Orders</h1>
        <Link to="/orders/new" className={styles.addBtn}><FiPlus /> New Order</Link>
      </div>

      <div className={styles.filters}>
        <select className={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Pending</option>
          <option>In Progress</option>
          <option>Review</option>
          <option>Complete</option>
        </select>
      </div>

      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <span>Client</span>
          <span>Title</span>
          <span>Type</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Date</span>
        </div>
        {filtered.map(o => (
          <div key={o._id} className={styles.tableRow} onClick={() => navigate(`/orders/${o._id}`)}>
            <span>{o.businessId}</span>
            <span>{o.title}</span>
            <span className={styles.muted}>{o.pageType}</span>
            <span><StatusBadge status={o.priority} /></span>
            <span><StatusBadge status={o.status} /></span>
            <span className={styles.muted}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</span>
          </div>
        ))}
        {filtered.length === 0 && <div className={styles.empty}>No orders found</div>}
      </div>
    </div>
  );
}
