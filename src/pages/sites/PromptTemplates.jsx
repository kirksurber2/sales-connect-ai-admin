import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiSave, FiCopy, FiLayers, FiGlobe, FiFileText } from 'react-icons/fi';
import { api } from '../../utils/api';
import { SITE_BUILD_TYPES, PAGE_BUILD_TYPES } from '../../utils/constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import styles from './promptTemplates.module.css';

const EMPTY_PAGE_TEMPLATE = {
  templateType: 'page',
  name: '', buildType: '', description: '', isActive: true,
  services: [{ name: '', description: '', bullets: '' }],
  seo: { primaryKeyword: '', secondaryKeywords: [], localModifiers: [] },
  pages: { galleryPage: false, faqPage: false, reviewsPage: true, financingPage: false, serviceAreaPage: true },
  hero: { ctaButton1: 'Get a Free Quote', ctaButton2: 'Call Now', heroBackground: 'gradient' },
  faqs: [{ q: '', a: '' }],
  whyChooseUs: ['', '', '', ''],
  aiInstructions: '',
  rawPrompt: '',
};

const EMPTY_SITE_TEMPLATE = {
  templateType: 'site',
  name: '', buildType: '', description: '', isActive: true,
  seo: { primaryKeyword: '', secondaryKeywords: [], localModifiers: [] },
  aiInstructions: '',
  rawPrompt: '',
};

export default function PromptTemplates() {
  const [typeTab, setTypeTab] = useState('page'); // 'page' | 'site'
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadTemplates(); }, [typeTab]);

  async function loadTemplates() {
    setLoading(true);
    setSelected(null);
    setForm(null);
    try {
      const data = await api.get(`/prompt-templates?templateType=${typeTab}`);
      setTemplates(data);
    } catch {} finally { setLoading(false); }
  }

  function selectTemplate(tpl) {
    setSelected(tpl._id);
    setForm({
      ...tpl,
      seo: {
        ...tpl.seo,
        secondaryKeywords: (tpl.seo?.secondaryKeywords || []).join(', '),
        localModifiers: (tpl.seo?.localModifiers || []).join(', '),
        primaryKeyword: tpl.seo?.primaryKeyword || '',
      },
    });
  }

  function startNew() {
    setSelected('new');
    setForm(typeTab === 'site' ? { ...EMPTY_SITE_TEMPLATE } : { ...EMPTY_PAGE_TEMPLATE });
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
    if (!form.name || !form.buildType) { toast.error('Name and build type required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        templateType: typeTab,
        buildType: form.buildType,
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
    setSelected('new');
    setForm({ ...form, name: form.name + ' (Copy)', _id: undefined });
    toast.info('Editing duplicate — save to create');
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1><FiLayers size={20} /> Prompt Templates</h1>
        <button className={styles.newBtn} onClick={startNew}><FiPlus size={14} /> New Template</button>
      </div>

      {/* Type tabs */}
      <div className={styles.typeTabs}>
        <button
          className={`${styles.typeTab} ${typeTab === 'page' ? styles.typeTabActive : ''}`}
          onClick={() => setTypeTab('page')}
        >
          <FiFileText size={14} /> Web Page Templates
        </button>
        <button
          className={`${styles.typeTab} ${typeTab === 'site' ? styles.typeTabActive : ''}`}
          onClick={() => setTypeTab('site')}
        >
          <FiGlobe size={14} /> Website Templates
        </button>
      </div>

      <p className={styles.typeHint}>
        {typeTab === 'page'
          ? 'Base prompts for building individual pages (VideoToPage, Pro Pages, Landing Pages). Business branding and voice are injected at build time.'
          : 'Base prompts for building full Next.js websites (site-build orders). Business branding, services, and order details are injected at build time.'}
      </p>

      {/* Template list */}
      <div className={styles.list}>
        {templates.map(t => (
          <button key={t._id} className={`${styles.listItem} ${selected === t._id ? styles.active : ''}`} onClick={() => selectTemplate(t)}>
            <span className={styles.listName}>{t.name}</span>
            <span className={styles.listIndustry}>{t.buildType}</span>
            <span className={`${styles.listBadge} ${t.isActive ? styles.badgeActive : styles.badgeInactive}`}>{t.isActive ? 'Active' : 'Inactive'}</span>
          </button>
        ))}
        {templates.length === 0 && <p className={styles.muted}>No {typeTab === 'page' ? 'page' : 'website'} templates yet. Create your first one.</p>}
      </div>

      {/* Editor */}
      {form && (
        <div className={styles.editor}>
          <div className={styles.editorActions}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}><FiSave size={14} /> {saving ? 'Saving...' : 'Save'}</button>
            {selected !== 'new' && <button className={styles.actionBtn} onClick={handleDuplicate}><FiCopy size={14} /> Duplicate</button>}
            {selected !== 'new' && <button className={`${styles.actionBtn} ${styles.danger}`} onClick={handleDelete}><FiTrash2 size={14} /> Delete</button>}
          </div>

          {/* Basic info */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Template Info</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Template Name *</label>
                <input className={styles.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder={typeTab === 'page' ? 'Trades — Pro Page' : 'Trades — Full Site'} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Build Type *</label>
                <select className={styles.input} value={form.buildType} onChange={e => set('buildType', e.target.value)}>
                  <option value="">Select...</option>
                  {(typeTab === 'site' ? SITE_BUILD_TYPES : PAGE_BUILD_TYPES).map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className={`${styles.field} ${styles.full}`}>
                <label className={styles.label}>Description</label>
                <input className={styles.input} value={form.description} onChange={e => set('description', e.target.value)} placeholder={typeTab === 'page' ? 'Base prompt for Pro Pages and service pages' : 'Full site build prompt for home service businesses'} />
              </div>
              <div className={styles.field}>
                <label className={styles.checkbox}><input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} /> Active</label>
              </div>
            </div>
          </div>

          {/* Raw prompt — primary for both types */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Raw Prompt</h3>
            <p className={styles.hint}>
              {typeTab === 'page'
                ? 'The base page-building prompt for this industry. At build time, business branding (colors, fonts, voice, avatar) and page-specific data (transcript brief, pillar strategy, services, SEO) are injected automatically.'
                : 'The base site-building prompt for this industry. At build time, business branding, services, social proof, order details (pages, pillar, ecommerce), and SEO are injected automatically.'}
            </p>
            <textarea className={styles.rawPrompt} value={form.rawPrompt || ''} onChange={e => set('rawPrompt', e.target.value)} placeholder={typeTab === 'page'
              ? 'You are an expert Next.js developer. Build ONE single page...\n\n## PAGE\nTitle: [PAGE_TITLE]\nStrategy: [PILLAR_STRATEGY]\n\n## BUSINESS\nName: [BUSINESS_NAME]\n...'
              : 'You are an expert Next.js developer. Build a complete Next.js site...\n\n## BUSINESS\nName: [BUSINESS_NAME]\nIndustry: [INDUSTRY]\n\n## BRAND\nTagline: [TAGLINE]\n...'
            } />
            <div className={styles.charCount}>{(form.rawPrompt || '').length} characters</div>
          </div>

          {/* SEO defaults — both types */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Default SEO Strategy</h3>
            <p className={styles.hint}>Industry-level SEO defaults. Overridden by the client's own sitePrompt SEO settings at build time.</p>
            <div className={styles.grid}>
              <div className={`${styles.field} ${styles.full}`}><label className={styles.label}>Primary Keyword Pattern</label><input className={styles.input} value={form.seo.primaryKeyword} onChange={e => setNested('seo', 'primaryKeyword', e.target.value)} placeholder="[service] [city]" /></div>
              <div className={`${styles.field} ${styles.full}`}><label className={styles.label}>Secondary Keywords (comma-separated)</label><input className={styles.input} value={form.seo.secondaryKeywords} onChange={e => setNested('seo', 'secondaryKeywords', e.target.value)} placeholder="[service] near me, best [service] [city]" /></div>
              <div className={`${styles.field} ${styles.full}`}><label className={styles.label}>Local Modifiers (comma-separated)</label><input className={styles.input} value={form.seo.localModifiers} onChange={e => setNested('seo', 'localModifiers', e.target.value)} placeholder="[city], [suburb1], [suburb2]" /></div>
            </div>
          </div>

          {/* AI instructions — both types */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>AI Instructions Override</h3>
            <p className={styles.hint}>Industry-specific instructions appended at build time (e.g. "Include before/after gallery section", "Add booking calendar integration").</p>
            <textarea className={styles.textarea} value={form.aiInstructions || ''} onChange={e => set('aiInstructions', e.target.value)} placeholder="Additional AI instructions specific to this industry..." rows={4} />
          </div>

          {/* Page-template-only fields */}
          {typeTab === 'page' && (
            <>
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

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Default "Why Choose Us"</h3>
                {form.whyChooseUs.map((p, i) => (
                  <input key={i} className={styles.input} style={{ marginBottom: '0.5rem', width: '100%' }} value={p} onChange={e => updateWhyChoose(i, e.target.value)} placeholder={`Point ${i + 1}`} />
                ))}
              </div>

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
