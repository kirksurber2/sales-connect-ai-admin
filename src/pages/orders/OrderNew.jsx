import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import styles from './orders.module.css';

const PAGE_TYPES = ['Pro Page', 'Blog Post', 'Landing Page', 'Full Site', 'Service Page', 'Location Page', 'Other'];

export default function OrderNew() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    businessId: '', pageType: '', title: '', description: '', referenceLinks: '', priority: 'Normal', notes: '',
    keywords: { primary: '', secondary: '', localModifiers: '' },
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/business').then(setClients).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleClientChange(businessId) {
    setForm(f => ({ ...f, businessId }));
    if (!businessId) return;
    // Auto-populate keywords from SitePrompt
    try {
      const prompts = await api.get('/site-prompts?businessId=' + businessId);
      const sp = Array.isArray(prompts) ? prompts[0] : prompts;
      if (sp?.seo) {
        setForm(f => ({
          ...f,
          keywords: {
            primary: sp.seo.primaryKeyword || '',
            secondary: (sp.seo.secondaryKeywords || []).join(', '),
            localModifiers: (sp.seo.localModifiers || []).join(', '),
          },
        }));
        toast.info('Keywords loaded from client profile');
      }
    } catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { keywords: kw, ...rest } = form;
      const order = {
        ...rest,
        keywords: {
          primary: kw.primary,
          secondary: kw.secondary.split(',').map(s => s.trim()).filter(Boolean),
          localModifiers: kw.localModifiers.split(',').map(s => s.trim()).filter(Boolean),
        },
        status: 'Pending',
      };
      await api.post('/site-orders', order);
      toast.success('Order created');
      navigate('/orders');
    } catch {} finally { setSaving(false); }
  }

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }
  function setKw(key, val) { setForm(f => ({ ...f, keywords: { ...f.keywords, [key]: val } })); }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>New Order</h1>
      <form className={styles.detail} onSubmit={handleSubmit}>
        <div className={styles.section}>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Client *</label>
              <select className={styles.input} required value={form.businessId} onChange={e => handleClientChange(e.target.value)}>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.businessId} value={c.businessId}>{c.businessName}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Page Type</label>
              <select className={styles.input} value={form.pageType} onChange={e => set('pageType', e.target.value)}>
                <option value="">Select...</option>
                {PAGE_TYPES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>Title *</label>
              <input className={styles.input} required value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>Description</label>
              <textarea className={styles.textarea} value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Reference Links</label>
              <input className={styles.input} value={form.referenceLinks} onChange={e => set('referenceLinks', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Priority</label>
              <select className={styles.input} value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option>Low</option><option>Normal</option><option>High</option><option>Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Keywords Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>SEO Keywords</h3>
          <p className={styles.kwHint}>Auto-populated from client profile. Override per page as needed.</p>
          <div className={styles.fieldGrid}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>Primary Keyword</label>
              <input className={styles.input} value={form.keywords.primary} onChange={e => setKw('primary', e.target.value)} placeholder="roofing houston" />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>Secondary Keywords (comma-separated)</label>
              <input className={styles.input} value={form.keywords.secondary} onChange={e => setKw('secondary', e.target.value)} placeholder="roof repair, storm damage" />
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>Local Modifiers (comma-separated)</label>
              <input className={styles.input} value={form.keywords.localModifiers} onChange={e => setKw('localModifiers', e.target.value)} placeholder="houston, katy, sugar land" />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label}>Notes</label>
            <textarea className={styles.textarea} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={saving}>{saving ? 'Creating...' : 'Create Order'}</button>
      </form>
    </div>
  );
}
