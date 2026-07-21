import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiImage, FiX } from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';
import { api } from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import styles from './orders.module.css';

const PAGE_TYPES = ['Pro Page', 'Blog Post', 'Landing Page', 'Full Site', 'Service Page', 'Location Page', 'Photo Gallery', 'Other'];

const PILLARS = [
  { key: 'seo', label: 'SEO', desc: 'Rank and capture organic traffic' },
  { key: 'problem-solution', label: 'Problem → Solution', desc: 'Agitate pain, present the fix' },
  { key: 'achievement-result', label: 'Achievement & Result', desc: 'Lead with transformation outcomes' },
  { key: 'trust-authority', label: 'Trust & Authority', desc: 'Credentials, proof, social trust' },
  { key: 'frictionless', label: 'Frictionless', desc: 'Speed, simplicity, remove barriers' },
  { key: 'buyer-intent', label: 'Buyer Intent', desc: 'Built for people ready to buy now' },
  { key: 'photo-gallery', label: 'Photo Gallery', desc: 'Showcase work with a full image gallery' },
];

const SITES_SUITE_BASE = import.meta.env.VITE_SITE_SUITE_API;

async function getImageUploadUrl(contentType, fileName) {
  const { default: { fetchAuthSession } } = await import('@aws-amplify/auth');
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  const res = await fetch(`${SITES_SUITE_BASE}/image-upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ contentType, fileName }),
  });
  if (!res.ok) throw new Error('Failed to get upload URL');
  return res.json();
}

async function uploadImageToS3(presignedUrl, file) {
  const res = await fetch(presignedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  if (!res.ok) throw new Error('Upload failed');
}

export default function OrderNew() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    businessId: '', pageType: '', pillar: '', title: '', description: '',
    referenceLinks: '', priority: 'Normal', notes: '',
    keywords: { primary: '', secondary: '', localModifiers: '' },
  });
  const [images, setImages] = useState([]); // [{ file, preview, s3Key, uploading, error }]
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const imageInputRef = useRef();

  useEffect(() => {
    api.get('/business').then(setClients).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleClientChange(businessId) {
    setForm(f => ({ ...f, businessId }));
    if (!businessId) return;
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

  function handleImageSelect(e) {
    const files = Array.from(e.target.files);
    setImages(prev => [
      ...prev,
      ...files.map(file => ({ file, preview: URL.createObjectURL(file), s3Key: null, uploading: false, error: null })),
    ]);
    e.target.value = '';
  }

  function removeImage(idx) {
    setImages(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      // Upload pending images
      const uploadedKeys = [];
      const updated = [...images];
      for (let i = 0; i < updated.length; i++) {
        if (updated[i].s3Key) { uploadedKeys.push(updated[i].s3Key); continue; }
        updated[i] = { ...updated[i], uploading: true };
        setImages([...updated]);
        try {
          const { presignedUrl, s3Key } = await getImageUploadUrl(updated[i].file.type, updated[i].file.name);
          await uploadImageToS3(presignedUrl, updated[i].file);
          updated[i] = { ...updated[i], s3Key, uploading: false };
          uploadedKeys.push(s3Key);
        } catch {
          updated[i] = { ...updated[i], uploading: false, error: 'Failed' };
          toast.error(`Failed to upload ${updated[i].file.name}`);
        }
        setImages([...updated]);
      }

      const { keywords: kw, ...rest } = form;
      await api.post('/site-orders', {
        ...rest,
        imageKeys: uploadedKeys,
        keywords: {
          primary: kw.primary,
          secondary: kw.secondary.split(',').map(s => s.trim()).filter(Boolean),
          localModifiers: kw.localModifiers.split(',').map(s => s.trim()).filter(Boolean),
        },
        status: 'Pending',
      });
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

        {/* Basic Info */}
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

        {/* Pillar */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Page Strategy Pillar</h3>
          <div className={styles.pillarGrid}>
            {PILLARS.map(p => (
              <button
                key={p.key}
                type="button"
                className={`${styles.pillarBtn} ${form.pillar === p.key ? styles.pillarBtnActive : ''}`}
                onClick={() => set('pillar', form.pillar === p.key ? '' : p.key)}
              >
                <strong>{p.label}</strong>
                <span>{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Images</h3>
          <p className={styles.kwHint}>Upload photos for this page — gallery images, before/after shots, team photos, etc.</p>
          <div className={styles.imageUploadZone} onClick={() => imageInputRef.current?.click()}>
            <FiImage size={22} />
            <span>Click to add images</span>
            <span className={styles.imageUploadHint}>JPG, PNG, WebP — max 20MB each</span>
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
          {images.length > 0 && (
            <div className={styles.imageGrid}>
              {images.map((img, i) => (
                <div key={i} className={`${styles.imageThumb} ${img.error ? styles.imageThumbError : ''}`}>
                  <img src={img.preview} alt="" />
                  {img.uploading && (
                    <div className={styles.imageOverlay}><FaSpinner className="spin" /></div>
                  )}
                  {img.error && (
                    <div className={`${styles.imageOverlay} ${styles.imageOverlayError}`}>{img.error}</div>
                  )}
                  {!img.uploading && (
                    <button type="button" className={styles.imageRemove} onClick={() => removeImage(i)}>
                      <FiX size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEO Keywords */}
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

        {/* Notes */}
        <div className={styles.section}>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label}>Notes</label>
            <textarea className={styles.textarea} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={saving}>
          {saving ? <><FaSpinner className="spin" style={{ marginRight: '0.4rem' }} />Creating...</> : 'Create Order'}
        </button>
      </form>
    </div>
  );
}
