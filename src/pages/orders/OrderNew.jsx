import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import styles from './orders.module.css';

export default function OrderNew() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ businessId: '', pageType: '', title: '', description: '', referenceLinks: '', priority: 'Normal', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/clients').then(setClients).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const order = { ...form, status: 'Pending', createdAt: new Date().toISOString() };
      await api.post('/orders', order);
      navigate('/orders');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>New Order</h1>
      <form className={styles.detail} onSubmit={handleSubmit}>
        <div className={styles.section}>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Client *</label>
              <select className={styles.input} required value={form.businessId} onChange={e => setForm({ ...form, businessId: e.target.value })}>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.businessId} value={c.businessId}>{c.businessName}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Page Type</label>
              <input className={styles.input} value={form.pageType} onChange={e => setForm({ ...form, pageType: e.target.value })} placeholder="Pro Page, Blog Post, etc." />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>Title *</label>
              <input className={styles.input} required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>Description</label>
              <textarea className={styles.textarea} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Reference Links</label>
              <input className={styles.input} value={form.referenceLinks} onChange={e => setForm({ ...form, referenceLinks: e.target.value })} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Priority</label>
              <select className={styles.input} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option>Low</option><option>Normal</option><option>High</option><option>Urgent</option>
              </select>
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>Notes</label>
              <textarea className={styles.textarea} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
        </div>
        <button type="submit" className={styles.submitBtn} disabled={saving}>{saving ? 'Creating...' : 'Create Order'}</button>
      </form>
    </div>
  );
}
