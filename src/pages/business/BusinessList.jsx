import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch } from 'react-icons/fi';
import { api } from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import styles from './business.module.css';

export default function ClientList() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/business').then(setClients).catch(() => setClients([]));
  }, []);

  const filtered = clients.filter(c => {
    if (search && !c.businessName.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Clients</h1>
        <Link to="/business/new" className={styles.addBtn}><FiPlus /> Add Business</Link>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Search by business name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={styles.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Active</option>
          <option>Onboarding</option>
          <option>Churned</option>
        </select>
      </div>

      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <span>Business Name</span>
          <span>Industry</span>
          <span>Status</span>
          <span>Created</span>
        </div>
        {filtered.map(c => (
          <div key={c.businessId || c._id} className={styles.tableRow} onClick={() => navigate(`/business/${c.businessId}`)}>
            <span className={styles.businessName}>{c.businessName}</span>
            <span className={styles.muted}>{c.industry}</span>
            <span><StatusBadge status={c.status} /></span>
            <span className={styles.muted}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</span>
          </div>
        ))}
        {filtered.length === 0 && <div className={styles.empty}>No clients found</div>}
      </div>
    </div>
  );
}
