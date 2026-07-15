import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiCopy, FiPlus, FiTrash2, FiRefreshCw, FiLayers } from 'react-icons/fi';
import { INDUSTRIES, GOOGLE_FONTS, BUTTON_STYLES } from '../../utils/constants';
import { generatePrompt } from './promptTemplate';
import { api } from '../../utils/api';
import styles from './siteBuilder.module.css';

const COLOR_PRESETS = [
  { name: 'Navy & Gold', primary: '#1e3a5f', secondary: '#f59e0b', bgDark: '#0f172a', bgLight: '#f8fafc' },
  { name: 'Forest & Cream', primary: '#1b4332', secondary: '#d4a373', bgDark: '#1b2a1b', bgLight: '#fefae0' },
  { name: 'Slate & Red', primary: '#1e293b', secondary: '#dc2626', bgDark: '#0f172a', bgLight: '#f8fafc' },
  { name: 'Blue & Orange', primary: '#1d4ed8', secondary: '#ea580c', bgDark: '#0c1a3d', bgLight: '#fff7ed' },
  { name: 'Dark & Teal', primary: '#134e4a', secondary: '#14b8a6', bgDark: '#0f172a', bgLight: '#f0fdfa' },
  { name: 'Purple & Gold', primary: '#4c1d95', secondary: '#eab308', bgDark: '#1e1033', bgLight: '#faf5ff' },
  { name: 'Charcoal & Lime', primary: '#1f2937', secondary: '#84cc16', bgDark: '#111827', bgLight: '#f7fee7' },
  { name: 'Maroon & Silver', primary: '#7f1d1d', secondary: '#94a3b8', bgDark: '#1c1917', bgLight: '#f5f5f4' },
];

const FONT_COMBOS = [
  { name: 'Modern', heading: 'Inter', body: 'Inter' },
  { name: 'Bold', heading: 'Montserrat', body: 'Open Sans' },
  { name: 'Elegant', heading: 'Playfair Display', body: 'Lato' },
  { name: 'Clean', heading: 'Poppins', body: 'Nunito' },
  { name: 'Strong', heading: 'Oswald', body: 'Source Sans Pro' },
  { name: 'Friendly', heading: 'Raleway', body: 'Roboto' },
];

const defaultForm = {
  businessName: '', tagline: '', industry: '', ownerName: '', ownerTitle: 'Owner',
  phone: '', email: '', address: '', serviceArea: '', yearsInBusiness: '',
  gbpUrl: '', domain: '', currentWebsite: '',
  seoKeywords: '', seoSecondary: '', seoLocalModifiers: '',
  primaryColor: '#1e3a5f', secondaryColor: '#f59e0b', accentColor: '#ffffff',
  bgDark: '#0f172a', bgLight: '#f8fafc', textPrimary: '#1e293b', textSecondary: '#64748b',
  fontHeading: 'Inter', fontBody: 'Inter', fontWeightHeading: '800', fontWeightBody: '400',
  borderRadiusCards: '16px', borderRadiusButtons: '12px', buttonStyle: 'Gradient',
  heroHeadline: '', heroSubheadline: '', ctaButton1: 'Get a Free Quote', ctaButton2: 'Call Now',
  heroBackground: 'gradient',
  services: [{ name: '', description: '', bullets: '' }],
  jobsCompleted: '', googleRating: '5.0', certifications: '',
  whyChooseUs: ['', '', '', ''],
  testimonials: [{ quote: '', name: '', location: '' }],
  ctaBannerText: '', ctaBannerButton: 'Schedule Free Consultation',
  companyStory: '', missionStatement: '',
  contactSubmitText: 'Request Free Quote', formEndpoint: 'https://api.salesconnectai.com/leads',
  hours: 'Mon–Fri 7am–6pm, Sat 8am–2pm', googleMapsEmbed: '',
  galleryPage: false, faqPage: false, reviewsPage: false, financingPage: false, serviceAreaPage: false,
  galleryCategories: '', serviceAreaCities: '',
  faqs: [{ q: '', a: '' }],
  scaWidget: true, gaId: '', fbPixel: '', gtmId: '',
  voice: '', avoid: '', emphasize: '', ctaStyle: 'Direct and action-oriented',
};

export default function SiteBuilder() {
  const [form, setForm] = useState(defaultForm);
  const [prompt, setPrompt] = useState('');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [sitePrompt, setSitePrompt] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    api.get('/business').then(setClients).catch(() => {});
    api.get('/prompt-templates?active=true').then(setTemplates).catch(() => {});
  }, []);

  function applyTemplate(id) {
    setSelectedTemplate(id);
    if (!id) return;
    const tpl = templates.find(t => t._id === id);
    if (!tpl) return;
    setForm(f => ({
      ...f,
      primaryColor: tpl.styleGuide?.primaryColor || f.primaryColor,
      secondaryColor: tpl.styleGuide?.secondaryColor || f.secondaryColor,
      accentColor: tpl.styleGuide?.accentColor || f.accentColor,
      bgDark: tpl.styleGuide?.bgDark || f.bgDark,
      bgLight: tpl.styleGuide?.bgLight || f.bgLight,
      fontHeading: tpl.styleGuide?.fontHeading || f.fontHeading,
      fontBody: tpl.styleGuide?.fontBody || f.fontBody,
      buttonStyle: tpl.styleGuide?.buttonStyle || f.buttonStyle,
      borderRadiusCards: tpl.styleGuide?.borderRadiusCards || f.borderRadiusCards,
      borderRadiusButtons: tpl.styleGuide?.borderRadiusButtons || f.borderRadiusButtons,
      seoKeywords: tpl.seo?.primaryKeyword || f.seoKeywords,
      seoSecondary: (tpl.seo?.secondaryKeywords || []).join(', ') || f.seoSecondary,
      seoLocalModifiers: (tpl.seo?.localModifiers || []).join(', ') || f.seoLocalModifiers,
      voice: tpl.copyVoice?.voice || f.voice,
      avoid: tpl.copyVoice?.avoid || f.avoid,
      emphasize: tpl.copyVoice?.emphasize || f.emphasize,
      ctaStyle: tpl.copyVoice?.ctaStyle || f.ctaStyle,
      services: tpl.services?.length ? tpl.services : f.services,
      whyChooseUs: tpl.whyChooseUs?.length ? tpl.whyChooseUs : f.whyChooseUs,
      faqs: tpl.faqs?.length ? tpl.faqs : f.faqs,
      galleryPage: tpl.pages?.galleryPage ?? f.galleryPage,
      faqPage: tpl.pages?.faqPage ?? f.faqPage,
      reviewsPage: tpl.pages?.reviewsPage ?? f.reviewsPage,
      financingPage: tpl.pages?.financingPage ?? f.financingPage,
      serviceAreaPage: tpl.pages?.serviceAreaPage ?? f.serviceAreaPage,
      ctaButton1: tpl.hero?.ctaButton1 || f.ctaButton1,
      ctaButton2: tpl.hero?.ctaButton2 || f.ctaButton2,
      heroBackground: tpl.hero?.heroBackground || f.heroBackground,
      aiInstructions: tpl.aiInstructions || '',
    }));
    toast.success(`Template "${tpl.name}" applied`);
  }

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function loadClient(id) {
    setSelectedClient(id);
    const c = clients.find(cl => cl.businessId === id);
    if (!c) return;
    setForm(f => ({
      ...f,
      businessName: c.businessName || '',
      industry: c.industry || '',
      ownerName: c.ownerName || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      domain: c.domain || '',
      currentWebsite: c.website || '',
    }));
    // Auto-apply matching industry template if none selected
    if (!selectedTemplate && c.industry) {
      const match = templates.find(t => t.industry === c.industry);
      if (match) applyTemplate(match._id);
    }
    // Load SitePrompt SEO data for this client
    api.get('/site-prompts?businessId=' + id).then(prompts => {
      const sp = Array.isArray(prompts) ? prompts[0] : prompts;
      if (sp?.seo) {
        setSitePrompt(sp);
        setForm(f => ({
          ...f,
          seoKeywords: sp.seo.primaryKeyword || f.seoKeywords,
          seoSecondary: (sp.seo.secondaryKeywords || []).join(', ') || f.seoSecondary,
          seoLocalModifiers: (sp.seo.localModifiers || []).join(', '),
        }));
      }
    }).catch(() => {});
  }

  function applyColorPreset(preset) {
    setForm(f => ({ ...f, primaryColor: preset.primary, secondaryColor: preset.secondary, bgDark: preset.bgDark, bgLight: preset.bgLight }));
  }

  function applyFontCombo(combo) {
    setForm(f => ({ ...f, fontHeading: combo.heading, fontBody: combo.body }));
  }

  function updateService(i, key, val) {
    const s = [...form.services]; s[i] = { ...s[i], [key]: val }; set('services', s);
  }
  function addService() { set('services', [...form.services, { name: '', description: '', bullets: '' }]); }
  function removeService(i) { set('services', form.services.filter((_, idx) => idx !== i)); }

  function updateTestimonial(i, key, val) {
    const t = [...form.testimonials]; t[i] = { ...t[i], [key]: val }; set('testimonials', t);
  }
  function addTestimonial() { set('testimonials', [...form.testimonials, { quote: '', name: '', location: '' }]); }
  function removeTestimonial(i) { set('testimonials', form.testimonials.filter((_, idx) => idx !== i)); }

  function updateFaq(i, key, val) {
    const f = [...form.faqs]; f[i] = { ...f[i], [key]: val }; set('faqs', f);
  }
  function addFaq() { set('faqs', [...form.faqs, { q: '', a: '' }]); }

  function updateWhyChoose(i, val) {
    const w = [...form.whyChooseUs]; w[i] = val; set('whyChooseUs', w);
  }

  function handleGenerate() {
    // If a template with rawPrompt is selected, merge client data into it
    const tpl = templates.find(t => t._id === selectedTemplate);
    if (tpl?.rawPrompt) {
      const merged = mergeRawPrompt(tpl.rawPrompt, form);
      setPrompt(merged);
    } else {
      const output = generatePrompt(form);
      setPrompt(output);
    }
    toast.success('Prompt generated!');
  }

  function mergeRawPrompt(raw, data) {
    const replacements = {
      '[Business Name]': data.businessName,
      '[Tagline]': data.tagline,
      '[Industry]': data.industry,
      '[Owner Name]': data.ownerName,
      '[Phone]': data.phone,
      '[Email]': data.email,
      '[Address]': data.address,
      '[Service Area]': data.serviceArea,
      '[Years]': data.yearsInBusiness,
      '[Domain]': data.domain,
      '[GBP URL]': data.gbpUrl,
      '[Primary Keyword]': data.seoKeywords,
      '[Secondary Keywords]': data.seoSecondary,
      '[Local Modifiers]': data.seoLocalModifiers,
      '[Primary Color]': data.primaryColor,
      '[Secondary Color]': data.secondaryColor,
      '[Font Heading]': data.fontHeading,
      '[Font Body]': data.fontBody,
      '[CTA Button 1]': data.ctaButton1,
      '[CTA Button 2]': data.ctaButton2,
      '[Voice]': data.voice,
      '[Avoid]': data.avoid,
      '[Emphasize]': data.emphasize,
    };
    let result = raw;
    for (const [placeholder, value] of Object.entries(replacements)) {
      if (value) result = result.replaceAll(placeholder, value);
    }
    return result;
  }

  function handleCopy() {
    navigator.clipboard.writeText(prompt);
    toast.success('Copied to clipboard!');
  }

  return (
    <div className={styles.builder}>
      <div className={styles.pageHeader}>
        <h1>Site Builder</h1>
        <button className={styles.generateBtn} onClick={handleGenerate}><FiRefreshCw size={16} /> Generate Prompt</button>
      </div>

      {/* Step 1: Template + Client Select */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><FiLayers size={16} /> Step 1: Select Base Prompt</h2>
        <p className={styles.stepHint}>Choose an industry template as the foundation. Then optionally load a client to fill in their details.</p>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>Industry Template *</label>
            <select className={styles.input} value={selectedTemplate} onChange={e => applyTemplate(e.target.value)}>
              <option value="">Select template...</option>
              {Object.entries(templates.reduce((acc, t) => { (acc[t.industry] = acc[t.industry] || []).push(t); return acc; }, {})).map(([industry, tpls]) => (
                <optgroup key={industry} label={industry}>
                  {tpls.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Load Client Data (optional)</label>
            <select className={styles.input} value={selectedClient} onChange={e => loadClient(e.target.value)}>
              <option value="">Select existing client...</option>
              {clients.map(c => <option key={c.businessId} value={c.businessId}>{c.businessName}{c.industry ? ` (${c.industry})` : ''}</option>)}
            </select>
          </div>
        </div>
        {selectedTemplate && (
          <div className={styles.templateApplied}>
            ✓ Base prompt loaded. Fill in the details below to complete it.
          </div>
        )}
      </div>

      {/* Step 2: Client Details */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Step 2: Client Details</h2>
        <p className={styles.stepHint}>Fill in the client-specific information. These values replace placeholders in the base prompt.</p>
      </div>

      {/* Business Info */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Business Information</h2>
        <div className={styles.grid}>
          <Field label="Business Name *" value={form.businessName} onChange={v => set('businessName', v)} />
          <Field label="Tagline / Slogan" value={form.tagline} onChange={v => set('tagline', v)} />
          <div className={styles.field}>
            <label className={styles.label}>Industry</label>
            <select className={styles.input} value={form.industry} onChange={e => set('industry', e.target.value)}>
              <option value="">Select...</option>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <Field label="Owner Name" value={form.ownerName} onChange={v => set('ownerName', v)} />
          <Field label="Phone" value={form.phone} onChange={v => set('phone', v)} />
          <Field label="Email" value={form.email} onChange={v => set('email', v)} />
          <Field label="Address" value={form.address} onChange={v => set('address', v)} full />
          <Field label="Service Area" value={form.serviceArea} onChange={v => set('serviceArea', v)} full />
          <Field label="Years in Business" value={form.yearsInBusiness} onChange={v => set('yearsInBusiness', v)} />
          <Field label="Domain" value={form.domain} onChange={v => set('domain', v)} />
          <Field label="Current Website" value={form.currentWebsite} onChange={v => set('currentWebsite', v)} />
          <Field label="Google Business Profile URL" value={form.gbpUrl} onChange={v => set('gbpUrl', v)} />
        </div>
      </div>

      {/* SEO */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>SEO Keywords</h2>
        {sitePrompt?.seo?.keywords?.length > 0 && (
          <div className={styles.keywordTracker}>
            <label className={styles.label}>Keyword Tracker</label>
            <div className={styles.keywordTags}>
              {sitePrompt.seo.keywords.map((kw, i) => (
                <span key={i} className={`${styles.keywordTag} ${styles['kw_' + kw.status.replace(/\s/g, '')]}`}>
                  {kw.term} <small>({kw.status})</small>
                </span>
              ))}
            </div>
          </div>
        )}
        <div className={styles.grid}>
          <Field label="Primary Keyword" value={form.seoKeywords} onChange={v => set('seoKeywords', v)} full placeholder="roofing houston" />
          <Field label="Secondary Keywords (comma-separated)" value={form.seoSecondary} onChange={v => set('seoSecondary', v)} full placeholder="storm damage repair, gutter installation" />
          <Field label="Local Modifiers (comma-separated)" value={form.seoLocalModifiers} onChange={v => set('seoLocalModifiers', v)} full placeholder="houston, katy, sugar land, the woodlands" />
        </div>
      </div>

      {/* Style Guide */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Style Guide</h2>

        <label className={styles.label}>Color Presets</label>
        <div className={styles.presets}>
          {COLOR_PRESETS.map(p => (
            <button key={p.name} className={styles.presetBtn} onClick={() => applyColorPreset(p)}>
              <span className={styles.presetSwatch} style={{ background: p.primary }} />
              <span className={styles.presetSwatch} style={{ background: p.secondary }} />
              <span className={styles.presetLabel}>{p.name}</span>
            </button>
          ))}
        </div>

        <div className={styles.grid} style={{ marginTop: '1rem' }}>
          <ColorField label="Primary Color" value={form.primaryColor} onChange={v => set('primaryColor', v)} />
          <ColorField label="Secondary Color" value={form.secondaryColor} onChange={v => set('secondaryColor', v)} />
          <ColorField label="Accent Color" value={form.accentColor} onChange={v => set('accentColor', v)} />
          <ColorField label="BG Dark" value={form.bgDark} onChange={v => set('bgDark', v)} />
          <ColorField label="BG Light" value={form.bgLight} onChange={v => set('bgLight', v)} />
          <ColorField label="Text Primary" value={form.textPrimary} onChange={v => set('textPrimary', v)} />
        </div>

        <label className={styles.label} style={{ marginTop: '1.25rem' }}>Font Combos</label>
        <div className={styles.presets}>
          {FONT_COMBOS.map(c => (
            <button key={c.name} className={styles.presetBtn} onClick={() => applyFontCombo(c)}>
              <span className={styles.presetLabel}>{c.name}</span>
              <span className={styles.presetSub}>{c.heading} / {c.body}</span>
            </button>
          ))}
        </div>

        <div className={styles.grid} style={{ marginTop: '1rem' }}>
          <div className={styles.field}>
            <label className={styles.label}>Heading Font</label>
            <select className={styles.input} value={form.fontHeading} onChange={e => set('fontHeading', e.target.value)}>
              {GOOGLE_FONTS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Body Font</label>
            <select className={styles.input} value={form.fontBody} onChange={e => set('fontBody', e.target.value)}>
              {GOOGLE_FONTS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Button Style</label>
            <select className={styles.input} value={form.buttonStyle} onChange={e => set('buttonStyle', e.target.value)}>
              {BUTTON_STYLES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <Field label="Card Radius" value={form.borderRadiusCards} onChange={v => set('borderRadiusCards', v)} placeholder="16px" />
          <Field label="Button Radius" value={form.borderRadiusButtons} onChange={v => set('borderRadiusButtons', v)} placeholder="12px" />
        </div>
      </div>

      {/* Hero / Home */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Home Page / Hero</h2>
        <div className={styles.grid}>
          <Field label="Hero Headline" value={form.heroHeadline} onChange={v => set('heroHeadline', v)} full />
          <Field label="Hero Subheadline" value={form.heroSubheadline} onChange={v => set('heroSubheadline', v)} full />
          <Field label="CTA Button 1" value={form.ctaButton1} onChange={v => set('ctaButton1', v)} />
          <Field label="CTA Button 2" value={form.ctaButton2} onChange={v => set('ctaButton2', v)} />
          <div className={styles.field}>
            <label className={styles.label}>Hero Background</label>
            <select className={styles.input} value={form.heroBackground} onChange={e => set('heroBackground', e.target.value)}>
              <option value="gradient">Gradient</option>
              <option value="solid color">Solid Color</option>
              <option value="image">Image</option>
              <option value="video placeholder">Video Placeholder</option>
            </select>
          </div>
          <Field label="Jobs Completed" value={form.jobsCompleted} onChange={v => set('jobsCompleted', v)} placeholder="1,200+" />
          <Field label="Google Rating" value={form.googleRating} onChange={v => set('googleRating', v)} />
          <Field label="Certifications" value={form.certifications} onChange={v => set('certifications', v)} full placeholder="GAF Certified, BBB A+" />
        </div>

        <label className={styles.label} style={{ marginTop: '1rem' }}>Why Choose Us (up to 4)</label>
        {form.whyChooseUs.map((p, i) => (
          <input key={i} className={styles.input} style={{ marginBottom: '0.5rem', width: '100%' }} value={p} onChange={e => updateWhyChoose(i, e.target.value)} placeholder={`Point ${i + 1}`} />
        ))}
      </div>

      {/* Services */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Services</h2>
        {form.services.map((s, i) => (
          <div key={i} className={styles.serviceRow}>
            <div className={styles.grid}>
              <Field label={`Service ${i + 1} Name`} value={s.name} onChange={v => updateService(i, 'name', v)} />
              <Field label="Description" value={s.description} onChange={v => updateService(i, 'description', v)} />
              <Field label="Key Points (comma-separated)" value={s.bullets} onChange={v => updateService(i, 'bullets', v)} full />
            </div>
            {form.services.length > 1 && <button className={styles.removeBtn} onClick={() => removeService(i)}><FiTrash2 size={14} /></button>}
          </div>
        ))}
        <button className={styles.addBtn} onClick={addService}><FiPlus size={14} /> Add Service</button>
      </div>

      {/* Testimonials */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Testimonials</h2>
        {form.testimonials.map((t, i) => (
          <div key={i} className={styles.serviceRow}>
            <div className={styles.grid}>
              <Field label="Quote" value={t.quote} onChange={v => updateTestimonial(i, 'quote', v)} full />
              <Field label="Name" value={t.name} onChange={v => updateTestimonial(i, 'name', v)} />
              <Field label="Location" value={t.location} onChange={v => updateTestimonial(i, 'location', v)} />
            </div>
            {form.testimonials.length > 1 && <button className={styles.removeBtn} onClick={() => removeTestimonial(i)}><FiTrash2 size={14} /></button>}
          </div>
        ))}
        <button className={styles.addBtn} onClick={addTestimonial}><FiPlus size={14} /> Add Testimonial</button>
      </div>

      {/* About / Contact */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>About & Contact</h2>
        <div className={styles.grid}>
          <div className={`${styles.field} ${styles.full}`}>
            <label className={styles.label}>Company Story</label>
            <textarea className={styles.textarea} value={form.companyStory} onChange={e => set('companyStory', e.target.value)} placeholder="2-3 sentences about the business" />
          </div>
          <Field label="Mission Statement" value={form.missionStatement} onChange={v => set('missionStatement', v)} full />
          <Field label="Hours of Operation" value={form.hours} onChange={v => set('hours', v)} full />
          <Field label="Contact Form Submit Text" value={form.contactSubmitText} onChange={v => set('contactSubmitText', v)} />
          <Field label="Form Endpoint" value={form.formEndpoint} onChange={v => set('formEndpoint', v)} />
          <Field label="Google Maps Embed URL" value={form.googleMapsEmbed} onChange={v => set('googleMapsEmbed', v)} full />
        </div>
      </div>

      {/* Additional Pages */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Additional Pages</h2>
        <div className={styles.checkboxes}>
          <Checkbox label="Gallery" checked={form.galleryPage} onChange={v => set('galleryPage', v)} />
          <Checkbox label="FAQ" checked={form.faqPage} onChange={v => set('faqPage', v)} />
          <Checkbox label="Reviews" checked={form.reviewsPage} onChange={v => set('reviewsPage', v)} />
          <Checkbox label="Financing" checked={form.financingPage} onChange={v => set('financingPage', v)} />
          <Checkbox label="Service Area" checked={form.serviceAreaPage} onChange={v => set('serviceAreaPage', v)} />
        </div>
        {form.faqPage && (
          <div style={{ marginTop: '1rem' }}>
            <label className={styles.label}>FAQs</label>
            {form.faqs.map((f, i) => (
              <div key={i} className={styles.grid} style={{ marginBottom: '0.5rem' }}>
                <Field label={`Q${i + 1}`} value={f.q} onChange={v => updateFaq(i, 'q', v)} />
                <Field label={`A${i + 1}`} value={f.a} onChange={v => updateFaq(i, 'a', v)} />
              </div>
            ))}
            <button className={styles.addBtn} onClick={addFaq}><FiPlus size={14} /> Add FAQ</button>
          </div>
        )}
      </div>

      {/* Integrations */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Integrations</h2>
        <div className={styles.grid}>
          <Checkbox label="SCA Booking Widget" checked={form.scaWidget} onChange={v => set('scaWidget', v)} />
          <Field label="Google Analytics ID" value={form.gaId} onChange={v => set('gaId', v)} placeholder="G-XXXXXXXXXX" />
          <Field label="Facebook Pixel ID" value={form.fbPixel} onChange={v => set('fbPixel', v)} />
          <Field label="GTM ID" value={form.gtmId} onChange={v => set('gtmId', v)} placeholder="GTM-XXXXXXX" />
        </div>
      </div>

      {/* Tone */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Tone & Copy Direction</h2>
        <div className={styles.grid}>
          <Field label="Voice" value={form.voice} onChange={v => set('voice', v)} full placeholder="Professional but approachable..." />
          <Field label="Avoid" value={form.avoid} onChange={v => set('avoid', v)} full placeholder="Generic phrases, corporate speak..." />
          <Field label="Emphasize" value={form.emphasize} onChange={v => set('emphasize', v)} full placeholder="Speed, reliability, local trust..." />
          <Field label="CTA Style" value={form.ctaStyle} onChange={v => set('ctaStyle', v)} placeholder="Direct and action-oriented" />
        </div>
      </div>

      {/* CTA Banner */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>CTA Banner</h2>
        <div className={styles.grid}>
          <Field label="Banner Text" value={form.ctaBannerText} onChange={v => set('ctaBannerText', v)} full />
          <Field label="Banner Button" value={form.ctaBannerButton} onChange={v => set('ctaBannerButton', v)} />
        </div>
      </div>

      {/* Step 3: Generate + Copy */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Step 3: Generate & Copy</h2>
        <p className={styles.stepHint}>Generate the final prompt with all your data merged in, then copy it to use in VS Code.</p>
        <div className={styles.actions}>
          <button className={styles.generateBtn} onClick={handleGenerate}><FiRefreshCw size={16} /> Generate Prompt</button>
          {prompt && <button className={styles.copyBtn} onClick={handleCopy}><FiCopy size={14} /> Copy to Clipboard</button>}
        </div>
      </div>

      {/* Output */}
      {prompt && (
        <div className={styles.section}>
          <div className={styles.outputHeader}>
            <h2 className={styles.sectionTitle}>Final Prompt</h2>
            <button className={styles.copyBtn} onClick={handleCopy}><FiCopy size={14} /> Copy</button>
          </div>
          <pre className={styles.output}>{prompt}</pre>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, full, placeholder }) {
  return (
    <div className={`${styles.field} ${full ? styles.full : ''}`}>
      <label className={styles.label}>{label}</label>
      <input className={styles.input} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div className={styles.colorWrap}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className={styles.colorInput} />
        <input className={styles.input} value={value} onChange={e => onChange(e.target.value)} style={{ flex: 1 }} />
      </div>
    </div>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className={styles.checkbox}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
