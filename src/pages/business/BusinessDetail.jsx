import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import styles from './business.module.css';

export default function ClientDetail() {
  const { businessId } = useParams();
  const [client, setClient] = useState(null);
  const [tab, setTab] = useState('overview');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get(`/business/${businessId}`).then(setClient).catch(() => {});
    api.get(`/orders?businessId=${businessId}`).then(setOrders).catch(() => {});
  }, [businessId]);

  if (!client) return <LoadingSpinner />;

  const tabs = ['overview', 'prompt', 'orders', 'notes'];

  return (
    <div>
      <div className={styles.detailHeader}>
        <h1>{client.businessName}</h1>
        <StatusBadge status={client.status} />
        {client.industry && <span className={styles.muted}>{client.industry}</span>}
        <Link to={`/business/${businessId}/edit`} className={styles.editLink}>Edit</Link>
      </div>

      <div className={styles.tabs}>
        {tabs.map(t => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className={styles.section}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}><label>Owner</label><span>{client.ownerName || '—'}</span></div>
            <div className={styles.infoItem}><label>Phone</label><span>{client.phone}</span></div>
            <div className={styles.infoItem}><label>Email</label><span>{client.email || '—'}</span></div>
            <div className={styles.infoItem}><label>Address</label><span>{client.address || '—'}</span></div>
            <div className={styles.infoItem}><label>Domain</label><span>{client.domain || '—'}</span></div>
            <div className={styles.infoItem}><label>Service Area</label><span>{client.serviceArea || '—'}</span></div>
            <div className={styles.infoItem}><label>Years</label><span>{client.yearsInBusiness || '—'}</span></div>
            <div className={styles.infoItem}><label>Products</label><span>{Object.entries(client.products || {}).filter(([,v]) => v.active).map(([k]) => k).join(', ') || '—'}</span></div>
          </div>
        </div>
      )}

      {tab === 'prompt' && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Style Guide</h3>
          <div className={styles.infoGrid}>
            {client.styleGuide && Object.entries(client.styleGuide).map(([k, v]) => (
              <div key={k} className={styles.infoItem}>
                <label>{k}</label>
                <span style={k.includes('Color') ? { display: 'flex', alignItems: 'center', gap: '0.5rem' } : {}}>
                  {k.includes('Color') && <span style={{ width: 16, height: 16, borderRadius: 4, background: v, display: 'inline-block' }} />}
                  {v}
                </span>
              </div>
            ))}
          </div>
          {client.services?.length > 0 && (
            <>
              <h3 className={styles.sectionTitle} style={{ marginTop: '1.5rem' }}>Services</h3>
              {client.services.map((s, i) => (
                <div key={i} style={{ marginBottom: '0.5rem' }}>
                  <strong>{s.name}</strong> — {s.description}
                </div>
              ))}
            </>
          )}
          {client.copyVoice && (
            <>
              <h3 className={styles.sectionTitle} style={{ marginTop: '1.5rem' }}>Copy / Voice</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}><label>Brand Voice</label><span>{client.copyVoice.brandVoice}</span></div>
                <div className={styles.infoItem}><label>Words to Avoid</label><span>{client.copyVoice.wordsToAvoid}</span></div>
                <div className={styles.infoItem}><label>Key Selling Points</label><span>{client.copyVoice.keySellingPoints}</span></div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div className={styles.section}>
          {orders.length === 0 ? <p className={styles.muted}>No orders yet</p> : orders.map(o => (
            <Link key={o._id} to={`/orders/${o._id}`} style={{ display: 'block', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
              {o.title} — <StatusBadge status={o.status} />
            </Link>
          ))}
        </div>
      )}

      {tab === 'notes' && (
        <div className={styles.section}>
          <p style={{ whiteSpace: 'pre-wrap' }}>{client.notes || 'No notes'}</p>
        </div>
      )}
    </div>
  );
}
