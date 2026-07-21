import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiSave, FiCopy, FiEdit2, FiLayers } from 'react-icons/fi';
import { api } from '../../utils/api';
import { INDUSTRIES } from '../../utils/constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import styles from './promptTemplates.module.css';

const EMPTY_TEMPLATE = {
  name: '', industry: '', description: '', isActive: true,
  services: [{ name: '', description: '', bullets: '' }],
  seo: { primaryKeyword: '', secondaryKeywords: [], localModifiers: [] },
  pages: { galleryPage: false, faqPage: false, reviewsPage: true, financingPage: false, serviceAreaPage: true },
  hero: { ctaButton1: 'Get a Free Quote', ctaButton2: 'Call Now', heroBackground: 'gradient' },
  faqs: [{ q: '', a: '' }],
  whyChooseUs: ['', '', '', ''],
  aiInstructions: '',
  rawPrompt: '',
};

export default function PromptTemplates() {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('prompt');

  useEffect(() => { loadTemplates(); }, []);

  async function loadTemplates() {
    try {
      const data = await api.get('/prompt-templates');
      setTemplates(data);
    } catch {} finally { setLoading(false); }
  }

  function selectTemplate(tpl) {
    setSelected(tpl._id);
    setForm({
      ...tpl,
      seo: { ...tpl.seo, secondaryKeywords: (tpl.seo?.secondaryKeywords || []).join(', '), localModifiers: (tpl.seo?.localModifiers || []).join(', '), primaryKeyword: tpl.seo?.primaryKeyword || '' },
    });
  }

  function startNew() {
    setSelected('new');
    setForm({ ...EMPTY_TEMPLATE });
  }

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }
  function setNested(section, key, val) { setForm(f => ({ ...f, [section]: { ...f[section], [key]: val } })); }

  function updateService(i, key, val) {
    const s = [...form.services]; s[i] = { ...s[i], [key]: val }; set('services', s);
  }
  function addService() { set('services', [...form.services, { name: '', description: '', bullets: '' }]); }
  function removeService(i) { set('services', form.services.filter((_, idx) => idx !== i)); }

  function updateFaq(i, key, val) {
    const f = [...form.faqs]; f[i] = { ...f[i], [key]: val }; set('faqs', f);
  }
  function addFaq() { set('faqs', [...form.faqs, { q: '', a: '' }]); }

  function updateWhyChoose(i, val) {
    const w = [...form.whyChooseUs]; w[i] = val; set('whyChooseUs', w);
  }

  async function handleSave() {
    if (!form.name || !form.industry) { toast.error('Name and industry required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        seo: {
          primaryKeyword: form.seo.primaryKeyword,
          secondaryKeywords: (typeof form.seo.secondaryKeywords === 'string' ? form.seo.secondaryKeywords : '').split(',').map(s => s.trim()).filter(Boolean),
          localModifiers: (typeof form.seo.localModifiers === 'string' ? form.seo.localModifiers : '').split(',').map(s => s.trim()).filter(Boolean),
        },
      };
      if (selected === 'new') {
        const created = await api.post('/prompt-templates', payload);
        setTemplates([...templates, created]);
        setSelected(created._id);
        toast.success('Template created');
      } else {
        const updated = await api.put(`/prompt-templates/${selected}`, payload);
        setTemplates(templates.map(t => t._id === selected ? updated : t));
        toast.success('Template saved');
      }
    } catch {} finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm('Delete this template?')) return;
    await api.delete(`/prompt-templates/${selected}`);
    setTemplates(templates.filter(t => t._id !== selected));
    setSelected(null);
    setForm(null);
    toast.success('Template deleted');
  }

  function handleDuplicate() {
    const dup = { ...form, name: form.name + ' (Copy)', _id: undefined };
    setSelected('new');
    setForm(dup);
    toast.info('Editing duplicate — save to create');
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1><FiLayers size={20} /> Prompt Templates</h1>
        <button className={styles.newBtn} onClick={startNew}><FiPlus size={14} /> New Template</button>
      </div>

      {/* Template List */}
      <div className={styles.list}>
        {templates.map(t => (
          <button key={t._id} className={`${styles.listItem} ${selected === t._id ? styles.active : ''}`} onClick={() => selectTemplate(t)}>
            <span className={styles.listName}>{t.name}</span>
            <span className={styles.listIndustry}>{t.industry}</span>
            <span className={`${styles.listBadge} ${t.isActive ? styles.badgeActive : styles.badgeInactive}`}>{t.isActive ? 'Active' : 'Inactive'}</span>
          </button>
        ))}
        {templates.length === 0 && <p className={styles.muted}>No templates yet. Create your first one.</p>}
      </div>

      {/* Editor */}
      {form && (
        <div className={styles.editor}>
          <div className={styles.editorActions}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}><FiSave size={14} /> {saving ? 'Saving...' : 'Save'}</button>
            {selected !== 'new' && <button className={styles.actionBtn} onClick={handleDuplicate}><FiCopy size={14} /> Duplicate</button>}
            {selected !== 'new' && <button className={`${styles.actionBtn} ${styles.danger}`} onClick={handleDelete}><FiTrash2 size={14} /> Delete</button>}
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'prompt' ? styles.tabActive : ''}`} onClick={() => setTab('prompt')}>Raw Prompt</button>
            <button className={`${styles.tab} ${tab === 'settings' ? styles.tabActive : ''}`} onClick={() => setTab('settings')}>Structured Settings</button>
          </div>

          {/* Basic Info */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Template Info</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Template Name *</label>
                <input className={styles.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Trades — Pro Page" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Industry *</label>
                <select className={styles.input} value={form.industry} onChange={e => set('industry', e.target.value)}>
                  <option value="">Select...</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div className={`${styles.field} ${styles.full}`}>
                <label className={styles.label}>Description</label>
                <input className={styles.input} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Base prompt for home service trades (roofing, HVAC, plumbing, etc.)" />
              </div>
              <div className={styles.field}>
                <label className={styles.checkbox}><input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} /> Active</label>
              </div>
            </div>
          </div>

          {/* Raw Prompt Tab */}
          {tab === 'prompt' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Full Industry Prompt</h3>
              <p className={styles.hint}>Paste your complete base prompt here. In Site Builder, client data will be merged with this prompt. Use placeholders like [Business Name], [Phone], [Service Area], [Primary Keyword] etc. that get replaced with client data.</p>
              <textarea className={styles.rawPrompt} value={form.rawPrompt || ''} onChange={e => set('rawPrompt', e.target.value)} placeholder="# Client Site Build Prompt

Build this complete Next.js project...

## CLIENT INFORMATION
Business Name: [Business Name]
..." />
              <div className={styles.charCount}>{(form.rawPrompt || '').length} characters</div>
            </div>
          )}

          {/* Structured Settings Tab */}
          {tab === 'settings' && (
            <>

          {/* SEO Defaults */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Default SEO Strategy</h3>
            <div className={styles.grid}>
              <div className={`${styles.field} ${styles.full}`}><label className={styles.label}>Primary Keyword Pattern</label><input className={styles.input} value={form.seo.primaryKeyword} onChange={e => setNested('seo', 'primaryKeyword', e.target.value)} placeholder="[service] [city]" /></div>
              <div className={`${styles.field} ${styles.full}`}><label className={styles.label}>Secondary Keywords (comma-separated)</label><input className={styles.input} value={form.seo.secondaryKeywords} onChange={e => setNested('seo', 'secondaryKeywords', e.target.value)} placeholder="[service] near me, best [service] [city]" /></div>
              <div className={`${styles.field} ${styles.full}`}><label className={styles.label}>Local Modifiers (comma-separated)</label><input className={styles.input} value={form.seo.localModifiers} onChange={e => setNested('seo', 'localModifiers', e.target.value)} placeholder="[city], [suburb1], [suburb2]" /></div>
            </div>
          </div>

          {/* Services */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Default Services</h3>
            {form.services.map((s, i) => (
              <div key={i} className={styles.serviceRow}>
                <div className={styles.grid}>
                  <div className={styles.field}><label className={styles.label}>Service {i + 1}</label><input className={styles.input} value={s.name} onChange={e => updateService(i, 'name', e.target.value)} placeholder="Service name" /></div>
                  <div className={styles.field}><label className={styles.label}>Description</label><input className={styles.input} value={s.description} onChange={e => updateService(i, 'description', e.target.value)} /></div>
                  <div className={`${styles.field} ${styles.full}`}><label className={styles.label}>Key Points</label><input className={styles.input} value={s.bullets} onChange={e => updateService(i, 'bullets', e.target.value)} placeholder="comma-separated" /></div>
                </div>
                {form.services.length > 1 && <button className={styles.removeBtn} onClick={() => removeService(i)}><FiTrash2 size={14} /></button>}
              </div>
            ))}
            <button className={styles.addItemBtn} onClick={addService}><FiPlus size={14} /> Add Service</button>
          </div>

          {/* Why Choose Us */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Default "Why Choose Us"</h3>
            {form.whyChooseUs.map((p, i) => (
              <input key={i} className={styles.input} style={{ marginBottom: '0.5rem', width: '100%' }} value={p} onChange={e => updateWhyChoose(i, e.target.value)} placeholder={`Point ${i + 1}`} />
            ))}
          </div>

          {/* FAQs */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Default FAQs</h3>
            {form.faqs.map((f, i) => (
              <div key={i} className={styles.grid} style={{ marginBottom: '0.5rem' }}>
                <div className={styles.field}><label className={styles.label}>Q{i + 1}</label><input className={styles.input} value={f.q} onChange={e => updateFaq(i, 'q', e.target.value)} /></div>
                <div className={styles.field}><label className={styles.label}>A{i + 1}</label><input className={styles.input} value={f.a} onChange={e => updateFaq(i, 'a', e.target.value)} /></div>
              </div>
            ))}
            <button className={styles.addItemBtn} onClick={addFaq}><FiPlus size={14} /> Add FAQ</button>
          </div>

          {/* AI Instructions */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>AI Instructions Override</h3>
            <p className={styles.hint}>Industry-specific instructions appended to the generated prompt (e.g., "Include before/after gallery section", "Add booking calendar integration")</p>
            <textarea className={styles.textarea} value={form.aiInstructions} onChange={e => set('aiInstructions', e.target.value)} placeholder="Additional AI instructions specific to this industry..." rows={5} />
          </div>

          {/* Page Defaults */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Default Pages</h3>
            <div className={styles.checkboxes}>
              <label className={styles.checkbox}><input type="checkbox" checked={form.pages.galleryPage} onChange={e => setNested('pages', 'galleryPage', e.target.checked)} /> Gallery</label>
              <label className={styles.checkbox}><input type="checkbox" checked={form.pages.faqPage} onChange={e => setNested('pages', 'faqPage', e.target.checked)} /> FAQ</label>
              <label className={styles.checkbox}><input type="checkbox" checked={form.pages.reviewsPage} onChange={e => setNested('pages', 'reviewsPage', e.target.checked)} /> Reviews</label>
              <label className={styles.checkbox}><input type="checkbox" checked={form.pages.financingPage} onChange={e => setNested('pages', 'financingPage', e.target.checked)} /> Financing</label>
              <label className={styles.checkbox}><input type="checkbox" checked={form.pages.serviceAreaPage} onChange={e => setNested('pages', 'serviceAreaPage', e.target.checked)} /> Service Area</label>
            </div>
          </div>

          {/* Hero */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Default Hero / CTA</h3>
            <div className={styles.grid}>
              <div className={styles.field}><label className={styles.label}>CTA Button 1</label><input className={styles.input} value={form.hero.ctaButton1} onChange={e => setNested('hero', 'ctaButton1', e.target.value)} /></div>
              <div className={styles.field}><label className={styles.label}>CTA Button 2</label><input className={styles.input} value={form.hero.ctaButton2} onChange={e => setNested('hero', 'ctaButton2', e.target.value)} /></div>
              <div className={styles.field}><label className={styles.label}>Hero Background</label><input className={styles.input} value={form.hero.heroBackground} onChange={e => setNested('hero', 'heroBackground', e.target.value)} /></div>
            </div>
          </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
