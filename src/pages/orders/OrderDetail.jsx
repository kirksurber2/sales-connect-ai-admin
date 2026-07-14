import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
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
  const [editingKw, setEditingKw] = useState(false);
  const [kwForm, setKwForm] = useState({ primary: '', secondary: '', localModifiers: '' });

  useEffect(() => {
    api.get(`/site-orders/${orderId}`).then(o => {
      setOrder(o);
      setKwForm({
        primary: o.keywords?.primary || '',
        secondary: (o.keywords?.secondary || []).join(', '),
        localModifiers: (o.keywords?.localModifiers || []).join(', '),
      });
      if (o.businessId) api.get(`/business/${o.businessId}`).then(setClient).catch(() => {});
    }).catch(() => {});
  }, [orderId]);

  async function updateStatus(status) {
    const updated = { ...order, status };
    if (status === 'Complete') updated.completedAt = new Date().toISOString();
    await api.put(`/site-orders/${orderId}`, updated);
    setOrder(updated);
    toast.success(`Status updated to ${status}`);
  }

  async function saveKeywords() {
    const keywords = {
      primary: kwForm.primary,
      secondary: kwForm.secondary.split(',').map(s => s.trim()).filter(Boolean),
      localModifiers: kwForm.localModifiers.split(',').map(s => s.trim()).filter(Boolean),
    };
    const updated = { ...order, keywords };
    await api.put(`/site-orders/${orderId}`, updated);
    setOrder(updated);
    setEditingKw(false);
    toast.success('Keywords updated');
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

      {/* Keywords Section */}
      <div className={styles.section}>
        <div className={styles.kwHeader}>
          <h3 className={styles.sectionTitle}>SEO Keywords</h3>
          <button type="button" className={styles.kwEditBtn} onClick={() => setEditingKw(!editingKw)}>
            {editingKw ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {editingKw ? (
          <div className={styles.fieldGrid}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>Primary Keyword</label>
              <input className={styles.input} value={kwForm.primary} onChange={e => setKwForm({ ...kwForm, primary: e.target.value })} />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>Secondary Keywords</label>
              <input className={styles.input} value={kwForm.secondary} onChange={e => setKwForm({ ...kwForm, secondary: e.target.value })} />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>Local Modifiers</label>
              <input className={styles.input} value={kwForm.localModifiers} onChange={e => setKwForm({ ...kwForm, localModifiers: e.target.value })} />
            </div>
            <div className={styles.fieldFull}>
              <button type="button" className={styles.submitBtn} onClick={saveKeywords}>Save Keywords</button>
            </div>
          </div>
        ) : (
          <div className={styles.fieldGrid}>
            <div className={styles.infoItem}><label>Primary</label><span>{order.keywords?.primary || '—'}</span></div>
            <div className={styles.infoItem}><label>Secondary</label><span>{(order.keywords?.secondary || []).join(', ') || '—'}</span></div>
            <div className={`${styles.infoItem} ${styles.fieldFull}`}><label>Local Modifiers</label><span>{(order.keywords?.localModifiers || []).join(', ') || '—'}</span></div>
          </div>
        )}
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
