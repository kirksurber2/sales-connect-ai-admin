import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { INDUSTRIES, SITES_TIERS, MAINTENANCE_TIERS, GOOGLE_FONTS, BUTTON_STYLES } from '../../utils/constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import styles from './clients.module.css';

export default function ClientEdit() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/clients/${businessId}`).then(setForm).catch(() => {});
  }, [businessId]);

  if (!form) return <LoadingSpinner />;

  function set(path, value) {
    setForm(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return copy;
    });
  }

  function addService() { set('services', [...(form.services || []), { name: '', description: '', keyPoints: '' }]); }
  function updateService(i, field, val) { const s = [...form.services]; s[i] = { ...s[i], [field]: val }; set('services', s); }
  function removeService(i) { set('services', form.services.filter((_, idx) => idx !== i)); }

  function addTestimonial() { set('socialProof.testimonials', [...(form.socialProof?.testimonials || []), { quote: '', name: '', location: '' }]); }
  function updateTestimonial(i, field, val) { const t = [...form.socialProof.testimonials]; t[i] = { ...t[i], [field]: val }; set('socialProof.testimonials', t); }
  function removeTestimonial(i) { set('socialProof.testimonials', form.socialProof.testimonials.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/clients/${businessId}`, { ...form, updatedAt: new Date().toISOString() });
      navigate(`/clients/${businessId}`);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Edit: {form.businessName}</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Business Info</h2>
          <div className={styles.fieldGrid}>
            <div className={styles.field}><label className={styles.label}>Business Name *</label><input className={styles.input} required value={form.businessName} onChange={e => set('businessName', e.target.value)} /></div>
            <div className={styles.field}><label className={styles.label}>Owner Name</label><input className={styles.input} value={form.ownerName || ''} onChange={e => set('ownerName', e.target.value)} /></div>
            <div className={styles.field}><label className={styles.label}>Industry</label><select className={styles.input} value={form.industry || ''} onChange={e => set('industry', e.target.value)}><option value="">Select...</option>{INDUSTRIES.map(i => <option key={i}>{i}</option>)}</select></div>
            <div className={styles.field}><label className={styles.label}>Phone *</label><input className={styles.input} required value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div className={styles.field}><label className={styles.label}>Email</label><input className={styles.input} value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
            <div className={styles.field}><label className={styles.label}>Address</label><input className={styles.input} value={form.address || ''} onChange={e => set('address', e.target.value)} /></div>
            <div className={`${styles.field} ${styles.fieldFull}`}><label className={styles.label}>Service Area</label><textarea className={styles.textarea} value={form.serviceArea || ''} onChange={e => set('serviceArea', e.target.value)} /></div>
            <div className={styles.field}><label className={styles.label}>Domain</label><input className={styles.input} value={form.domain || ''} onChange={e => set('domain', e.target.value)} /></div>
            <div className={styles.field}><label className={styles.label}>Status</label><select className={styles.input} value={form.status} onChange={e => set('status', e.target.value)}><option>Active</option><option>Onboarding</option><option>Churned</option></select></div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Products</h2>
          <div className={styles.checkboxGroup}>
            <label className={styles.checkbox}><input type="checkbox" checked={form.products?.sitesSuite?.active || false} onChange={e => set('products.sitesSuite.active', e.target.checked)} /> Sites Suite
              {form.products?.sitesSuite?.active && <select className={styles.input} style={{ marginLeft: '0.5rem', width: 'auto' }} value={form.products.sitesSuite.tier || 'Pro'} onChange={e => set('products.sitesSuite.tier', e.target.value)}>{SITES_TIERS.map(t => <option key={t}>{t}</option>)}</select>}
            </label>
            <label className={styles.checkbox}><input type="checkbox" checked={form.products?.communicationsSuite?.active || false} onChange={e => set('products.communicationsSuite.active', e.target.checked)} /> Communications Suite</label>
            <label className={styles.checkbox}><input type="checkbox" checked={form.products?.outboundAutomation?.active || false} onChange={e => set('products.outboundAutomation.active', e.target.checked)} /> Outbound Automation Suite</label>
            <label className={styles.checkbox}><input type="checkbox" checked={form.products?.contentSuite?.active || false} onChange={e => set('products.contentSuite.active', e.target.checked)} /> Content Suite</label>
            <label className={styles.checkbox}><input type="checkbox" checked={form.products?.maintenance?.active || false} onChange={e => set('products.maintenance.active', e.target.checked)} /> Maintenance Plan
              {form.products?.maintenance?.active && <select className={styles.input} style={{ marginLeft: '0.5rem', width: 'auto' }} value={form.products.maintenance.tier || 'Basic'} onChange={e => set('products.maintenance.tier', e.target.value)}>{MAINTENANCE_TIERS.map(t => <option key={t}>{t}</option>)}</select>}
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Style Guide</h2>
          <div className={styles.fieldGrid}>
            <div className={styles.field}><label className={styles.label}>Primary Color</label><div className={styles.colorField}><input type="color" className={styles.colorPicker} value={form.styleGuide?.primaryColor || '#1e3a5f'} onChange={e => set('styleGuide.primaryColor', e.target.value)} /><input className={styles.input} value={form.styleGuide?.primaryColor || ''} onChange={e => set('styleGuide.primaryColor', e.target.value)} style={{ flex: 1 }} /></div></div>
            <div className={styles.field}><label className={styles.label}>Secondary Color</label><div className={styles.colorField}><input type="color" className={styles.colorPicker} value={form.styleGuide?.secondaryColor || '#f59e0b'} onChange={e => set('styleGuide.secondaryColor', e.target.value)} /><input className={styles.input} value={form.styleGuide?.secondaryColor || ''} onChange={e => set('styleGuide.secondaryColor', e.target.value)} style={{ flex: 1 }} /></div></div>
            <div className={styles.field}><label className={styles.label}>Font</label><select className={styles.input} value={form.styleGuide?.font || 'Inter'} onChange={e => set('styleGuide.font', e.target.value)}>{GOOGLE_FONTS.map(f => <option key={f}>{f}</option>)}</select></div>
            <div className={styles.field}><label className={styles.label}>Button Style</label><select className={styles.input} value={form.styleGuide?.buttonStyle || 'Gradient'} onChange={e => set('styleGuide.buttonStyle', e.target.value)}>{BUTTON_STYLES.map(b => <option key={b}>{b}</option>)}</select></div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Services</h2>
          <div className={styles.dynamicList}>
            {(form.services || []).map((s, i) => (
              <div key={i} className={styles.dynamicItem}>
                <input className={styles.input} placeholder="Service name" value={s.name} onChange={e => updateService(i, 'name', e.target.value)} />
                <input className={styles.input} placeholder="Description" value={s.description} onChange={e => updateService(i, 'description', e.target.value)} />
                <input className={styles.input} placeholder="Key points" value={s.keyPoints} onChange={e => updateService(i, 'keyPoints', e.target.value)} />
                <button type="button" className={styles.removeBtn} onClick={() => removeService(i)}>Remove</button>
              </div>
            ))}
            <button type="button" className={styles.addItemBtn} onClick={addService}>+ Add Service</button>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Social Proof</h2>
          <div className={styles.fieldGrid}>
            <div className={styles.field}><label className={styles.label}>Years in Business</label><input className={styles.input} value={form.socialProof?.yearsInBusiness || ''} onChange={e => set('socialProof.yearsInBusiness', e.target.value)} /></div>
            <div className={styles.field}><label className={styles.label}>Jobs Completed</label><input className={styles.input} value={form.socialProof?.jobsCompleted || ''} onChange={e => set('socialProof.jobsCompleted', e.target.value)} /></div>
            <div className={styles.field}><label className={styles.label}>Google Rating</label><input className={styles.input} value={form.socialProof?.googleRating || ''} onChange={e => set('socialProof.googleRating', e.target.value)} /></div>
            <div className={`${styles.field} ${styles.fieldFull}`}><label className={styles.label}>Certifications</label><input className={styles.input} value={form.socialProof?.certifications || ''} onChange={e => set('socialProof.certifications', e.target.value)} /></div>
          </div>
          <div className={styles.dynamicList} style={{ marginTop: '1rem' }}>
            {(form.socialProof?.testimonials || []).map((t, i) => (
              <div key={i} className={styles.dynamicItem}>
                <textarea className={styles.textarea} placeholder="Quote" value={t.quote} onChange={e => updateTestimonial(i, 'quote', e.target.value)} style={{ minHeight: '50px' }} />
                <input className={styles.input} placeholder="Name" value={t.name} onChange={e => updateTestimonial(i, 'name', e.target.value)} />
                <input className={styles.input} placeholder="Location" value={t.location} onChange={e => updateTestimonial(i, 'location', e.target.value)} />
                <button type="button" className={styles.removeBtn} onClick={() => removeTestimonial(i)}>Remove</button>
              </div>
            ))}
            <button type="button" className={styles.addItemBtn} onClick={addTestimonial}>+ Add Testimonial</button>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Copy / Voice</h2>
          <div className={styles.fieldGrid}>
            <div className={`${styles.field} ${styles.fieldFull}`}><label className={styles.label}>Brand Voice</label><textarea className={styles.textarea} value={form.copyVoice?.brandVoice || ''} onChange={e => set('copyVoice.brandVoice', e.target.value)} /></div>
            <div className={`${styles.field} ${styles.fieldFull}`}><label className={styles.label}>Words to Avoid</label><textarea className={styles.textarea} value={form.copyVoice?.wordsToAvoid || ''} onChange={e => set('copyVoice.wordsToAvoid', e.target.value)} /></div>
            <div className={`${styles.field} ${styles.fieldFull}`}><label className={styles.label}>Key Selling Points</label><textarea className={styles.textarea} value={form.copyVoice?.keySellingPoints || ''} onChange={e => set('copyVoice.keySellingPoints', e.target.value)} /></div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Notes</h2>
          <textarea className={styles.textarea} style={{ width: '100%', minHeight: '100px' }} value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </form>
    </div>
  );
}
