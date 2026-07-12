import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ORDER_STATUSES } from '../../utils/constants';
import styles from './orders.module.css';

export default function OrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [client, setClient] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    api.get(`/orders/${orderId}`).then(o => {
      setOrder(o);
      if (o.businessId) api.get(`/business/${o.businessId}`).then(setClient).catch(() => {});
    }).catch(() => {});
  }, [orderId]);

  async function updateStatus(status) {
    const updated = { ...order, status };
    if (status === 'Complete') updated.completedAt = new Date().toISOString();
    await api.put(`/orders/${orderId}`, updated);
    setOrder(updated);
  }

  if (!order) return <LoadingSpinner />;

  return (
    <div className={styles.detail}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.4rem' }}>{order.title}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className={styles.section}>
        <div className={styles.fieldGrid}>
          <div className={styles.infoItem}><label>Client</label><span>{order.businessId}</span></div>
          <div className={styles.infoItem}><label>Page Type</label><span>{order.pageType}</span></div>
          <div className={styles.infoItem}><label>Priority</label><span><StatusBadge status={order.priority} /></span></div>
          <div className={styles.infoItem}><label>Created</label><span>{new Date(order.createdAt).toLocaleDateString()}</span></div>
          <div className={`${styles.infoItem} ${styles.fieldFull}`}><label>Description</label><span>{order.description || '—'}</span></div>
          {order.referenceLinks && <div className={`${styles.infoItem} ${styles.fieldFull}`}><label>Reference Links</label><span>{order.referenceLinks}</span></div>}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Update Status</h3>
        <select className={styles.statusSelect} value={order.status} onChange={e => updateStatus(e.target.value)}>
          {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {client && (
        <div className={styles.section}>
          <button type="button" onClick={() => setShowPrompt(!showPrompt)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.9rem', cursor: 'pointer' }}>
            {showPrompt ? '▼' : '▶'} Client Prompt Config
          </button>
          {showPrompt && (
            <div style={{ marginTop: '1rem' }}>
              <pre style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify({ styleGuide: client.styleGuide, services: client.services, copyVoice: client.copyVoice, socialProof: client.socialProof }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Notes</h3>
        <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{order.notes || 'No notes'}</p>
      </div>
    </div>
  );
}
