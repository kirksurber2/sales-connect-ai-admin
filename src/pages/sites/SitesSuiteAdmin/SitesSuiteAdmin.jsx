import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { FaGlobe, FaSpinner, FaCopy, FaChevronLeft, FaCheck, FaServer, FaHammer, FaShoppingCart } from 'react-icons/fa';
import { FiRefreshCw, FiAlertTriangle, FiLink, FiVideo, FiFilter, FiSearch, FiZap, FiTrendingUp, FiShield, FiChevronsRight, FiChevronsLeft, FiTarget, FiImage } from 'react-icons/fi';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import './SitesSuiteAdmin.css';

const BASE = import.meta.env.VITE_SITES_SUITE_API || import.meta.env.VITE_API_BASE;
const BUSINESS_API = import.meta.env.VITE_BUSINESS_API;

const ORDER_STATUSES = ['Pending', 'In Progress', 'Review', 'Revisions', 'Complete'];
export const PILLARS = [
  { key: 'seo', label: 'SEO', icon: FiSearch, desc: 'Rank and capture organic traffic' },
  { key: 'problem-solution', label: 'Problem → Solution', icon: FiZap, desc: 'Agitate pain, present your fix' },
  { key: 'achievement-result', label: 'Achievement & End Result', icon: FiTrendingUp, desc: 'Lead with transformation outcomes' },
  { key: 'trust-authority', label: 'Trust & Authority', icon: FiShield, desc: 'Credentials, proof, and social trust' },
  { key: 'frictionless', label: 'Frictionless Experience', icon: FiChevronsRight, desc: 'Speed, simplicity, remove barriers' },
  { key: 'buyer-intent', label: 'Buyer Intent', icon: FiTarget, desc: 'Built for people ready to buy now' },
  { key: 'photo-gallery', label: 'Photo Gallery', icon: FiImage, desc: 'Showcase work with a full image gallery' },
];

const PAGE_TYPES = ['Service Page', 'Landing Page', 'Location Page', 'Blog Post', 'Pro Page', 'Full Site', 'Other'];

const ORDER_STATUS_COLORS = {
  Pending: '#f59e0b',
  'In Progress': '#0ea5e9',
  Review: '#7c3aed',
  Revisions: '#f97316',
  Complete: '#22c55e',
};

export const STATUS_LABELS = {
  uploading: 'Uploading...',
  transcribing: 'Transcribing video...',
  generating: 'Generating prompt...',
  complete: 'Complete',
  failed: 'Failed',
};

export const STATUS_COLORS = {
  uploading: '#0ea5e9',
  transcribing: '#0ea5e9',
  generating: '#7c3aed',
  complete: '#22c55e',
  failed: '#ef4444',
};


async function authHeaders() {
  const session = await fetchAuthSession();
  const token = session.tokens.idToken.toString();
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

const ORDER_TYPE_LABELS = { page: 'Page Order', hosting: 'Hosting', 'site-build': 'Site Build' };
const ORDER_TYPE_COLORS = { page: '#0ea5e9', hosting: '#22c55e', 'site-build': '#7c3aed' };
const ORDER_TYPE_ICONS = { page: FaGlobe, hosting: FaServer, 'site-build': FaHammer };

async function getAdminOrders(status, orderType) {
  const headers = await authHeaders();
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (orderType) params.set('orderType', orderType);
  const res = await axios.get(`${BASE}/orders/admin${params.toString() ? '?' + params : ''}`, { headers });
  return res.data;
}

async function updateAdminOrder(orderId, payload) {
  const headers = await authHeaders();
  const res = await axios.patch(`${BASE}/orders/admin/${orderId}`, payload, { headers });
  return res.data;
}

export default function SitesSuiteAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => { loadOrders(); }, [statusFilter, typeFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders(statusFilter, typeFilter);
      setOrders(res.orders || []);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      const res = await updateAdminOrder(orderId, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: res.order.status } : o));
      if (selectedOrder?._id === orderId) setSelectedOrder(prev => ({ ...prev, status: res.order.status }));
      toast.success(`Status updated to ${status}`);
    } catch { toast.error('Failed to update status'); }
  };

  if (selectedOrder) return (
    <OrderDetail
      order={selectedOrder}
      onBack={() => setSelectedOrder(null)}
      onStatusChange={handleStatusChange}
    />
  );

  return (
    <div className="ssa-page">
      <div className="ssa-header">
        <div className="ssa-title-row">
          <FaGlobe className="ssa-title-icon" />
          <h1>Sites Suite — Orders</h1>
        </div>
        <p className="ssa-subtitle">Manage page orders from businesses. Copy the generated prompt to build in VS Code.</p>
      </div>

      <div className="ssa-toolbar">
        <div className="ssa-filter-tabs">
          {['', ...ORDER_STATUSES].map(s => (
            <button
              key={s || 'all'}
              className={`ssa-filter-tab ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
        <div className="ssa-type-filters">
          <FiFilter size={13} />
          {['', 'page', 'hosting', 'site-build'].map(t => (
            <button
              key={t || 'all-types'}
              className={`ssa-type-tab ${typeFilter === t ? 'active' : ''}`}
              style={typeFilter === t && t ? { borderColor: ORDER_TYPE_COLORS[t], color: ORDER_TYPE_COLORS[t] } : {}}
              onClick={() => setTypeFilter(t)}
            >
              {t ? ORDER_TYPE_LABELS[t] : 'All Types'}
            </button>
          ))}
        </div>
        <button className="ssa-refresh-btn" onClick={loadOrders}><FiRefreshCw size={14} /> Refresh</button>
      </div>

      {loading ? (
        <div className="ssa-loading"><FaSpinner className="spin" /> Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="ssa-empty">No orders{statusFilter ? ` with status "${statusFilter}"` : ''} yet.</div>
      ) : (
        <div className="ssa-orders-list">
          {orders.map(order => {
            const TypeIcon = ORDER_TYPE_ICONS[order.orderType] || FaGlobe;
            const typeColor = ORDER_TYPE_COLORS[order.orderType] || '#0ea5e9';
            const displayTitle = order.orderType === 'hosting'
              ? (order.domain || 'Hosting Request')
              : order.orderType === 'site-build'
              ? (order.siteName || 'Site Build Request')
              : (order.title || order.siteName || order.domain || 'Untitled Order');
            return (
            <div key={order._id} className="ssa-order-row" onClick={() => setSelectedOrder(order)}>
              <div className="ssa-order-row-left">
                <strong>{displayTitle}</strong>
                <div className="ssa-order-row-meta">
                  <span className="ssa-tag" style={{ background: `${typeColor}22`, color: typeColor, borderColor: `${typeColor}44` }}>
                    <TypeIcon size={10} /> {ORDER_TYPE_LABELS[order.orderType] || 'Page Order'}
                  </span>
                  <span className="ssa-biz-id">{order.businessId}</span>
                  {order.orderType === 'page' && order.pageType && <span className="ssa-tag">{order.pageType}</span>}
                  {order.orderType === 'page' && order.pillar && (() => { const P = PILLARS.find(p => p.key === order.pillar); return P ? <span className="ssa-tag"><P.icon size={11} /> {P.label}</span> : null; })()}
                  {order.orderType === 'hosting' && order.hostingPlan && <span className="ssa-tag">{order.hostingPlan}</span>}
                  {order.orderType === 'site-build' && order.buildType && <span className="ssa-tag">{order.buildType}</span>}
                  {order.generatedPage && (
                    <span className="ssa-tag prompt-ready" style={{ background: STATUS_COLORS[order.generatedPage.status], color: '#fff' }}>
                      Prompt: {STATUS_LABELS[order.generatedPage.status] || order.generatedPage.status}
                    </span>
                  )}
                </div>
              </div>
              <div className="ssa-order-row-right">
                <select
                  className="ssa-status-select"
                  value={order.status}
                  style={{ borderColor: ORDER_STATUS_COLORS[order.status] }}
                  onClick={e => e.stopPropagation()}
                  onChange={e => handleStatusChange(order._id, e.target.value)}
                >
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="ssa-order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── BUILD PROMPT GENERATOR ───
function generateBuildPrompt(order, branding, sitePrompt, promptTemplate) {
  const b = branding || {};
  const sg = b.styleGuide || {};
  const voice = b.voice || {};
  const avatar = b.customerAvatar || {};
  const sp = sitePrompt || {};
  const proof = sp.socialProof || {};
  const pt = promptTemplate || {};
  const ec = order.ecommerce;
  const pillarObj = PILLARS.find(p => p.key === order.pillar);

  const services = (sp.services || []).map(s =>
    `- ${s.name}${s.description ? `: ${s.description}` : ''}${s.keyPoints ? ` (${s.keyPoints})` : ''}`
  ).join('\n');

  const testimonials = (proof.testimonials || []).map(t =>
    `"${t.quote}" — ${t.name}${t.location ? `, ${t.location}` : ''}`
  ).join('\n');

  const seoBlock = sp.seo?.primaryKeyword ? `Primary Keyword: ${sp.seo.primaryKeyword}
Secondary Keywords: ${(sp.seo.secondaryKeywords || []).join(', ')}
Local Modifiers: ${(sp.seo.localModifiers || []).join(', ')}` : '';

  const borderRadiusBtn = sg.buttonStyle === 'Pill' ? '50px' : '8px';

  // If a matching template has a rawPrompt, inject tokens into it
  if (pt.rawPrompt) {
    const tokens = {
      '[BUSINESS_NAME]': order.siteName || sp.businessName || '',
      '[OWNER_NAME]': sp.ownerName || b.ownerPersona?.name || '',
      '[INDUSTRY]': sp.industry || '',
      '[PHONE]': sp.phone || '',
      '[EMAIL]': sp.email || '',
      '[ADDRESS]': sp.address || '',
      '[SERVICE_AREA]': b.serviceArea || sp.serviceArea || '',
      '[DOMAIN]': sp.domain || '',
      '[HOURS]': sp.hours || '',
      '[TAGLINE]': b.tagline || '',
      '[CORE_OFFER]': b.coreOffer || '',
      '[BRAND_VOICE]': voice.brandVoice || '',
      '[TONE]': voice.tone || '',
      '[WORDS_TO_AVOID]': (voice.wordsToAvoid || []).join(', '),
      '[PREFERRED_PHRASES]': (voice.preferredPhrases || []).join(', '),
      '[DIFFERENTIATORS]': (b.differentiators || []).join(' · '),
      '[KEY_SELLING_POINTS]': (b.keySellingPoints || []).join(' · '),
      '[GUARANTEES]': (b.guarantees || []).join(' · '),
      '[CUSTOMER_AVATAR]': avatar.description || '',
      '[PAIN_POINTS]': (avatar.painPoints || []).join(', '),
      '[OWNER_BACKSTORY]': b.ownerPersona?.backstory || '',
      '[PRIMARY_COLOR]': sg.primaryColor || '#1e3a5f',
      '[SECONDARY_COLOR]': sg.secondaryColor || '#f59e0b',
      '[ACCENT_COLOR]': sg.accentColor || '#ffffff',
      '[FONT_HEADING]': sg.fontHeading || 'Inter',
      '[FONT_BODY]': sg.fontBody || 'Inter',
      '[BUTTON_STYLE]': sg.buttonStyle || 'Solid',
      '[BUTTON_RADIUS]': borderRadiusBtn,
      '[CARD_RADIUS]': sg.borderRadius || '16px',
      '[LOGO_URL]': sg.logoUrl || '/logo.png',
      '[PILLAR_LABEL]': strategy.label,
      '[PILLAR_DIRECTION]': strategy.direction,
      '[SERVICES_LIST]': services || '[Derive from business context]',
      '[YEARS_IN_BUSINESS]': proof.yearsInBusiness || '',
      '[JOBS_COMPLETED]': proof.jobsCompleted || '',
      '[GOOGLE_RATING]': proof.googleRating || '',
      '[CERTIFICATIONS]': proof.certifications || '',
      '[TESTIMONIALS]': testimonials || '[Use realistic placeholders]',
      '[WHY_CHOOSE_US]': (pt.whyChooseUs || []).filter(Boolean).map(w => `- ${w}`).join('\n'),
      '[PRIMARY_KEYWORD]': sp.seo?.primaryKeyword || pt.seo?.primaryKeyword || '',
      '[SECONDARY_KEYWORDS]': (sp.seo?.secondaryKeywords?.length ? sp.seo.secondaryKeywords : pt.seo?.secondaryKeywords || []).join(', '),
      '[LOCAL_MODIFIERS]': (sp.seo?.localModifiers?.length ? sp.seo.localModifiers : pt.seo?.localModifiers || []).join(', '),
      '[PAGES_LIST]': order.selectedPages?.length ? order.selectedPages.map(p => `- ${p}`).join('\n') : '- Home, About, Services, Contact',
      '[ECOMMERCE_BLOCK]': ec ? `Categories: ${(ec.categories || []).join(', ')}\nPayment Processor: ${ec.paymentProcessor || ''}\nSize Variants: ${ec.sizeVariants ? 'Yes' : 'No'}\nEstimated Products: ${ec.estimatedProducts || ''}${ec.notes ? `\nNotes: ${ec.notes}` : ''}` : 'Not required',
      '[ECOMMERCE_CATEGORIES]': (ec?.categories || []).join(', '),
      '[PAYMENT_PROCESSOR]': ec?.paymentProcessor || '',
      '[SIZE_VARIANTS]': ec?.sizeVariants ? 'Yes' : 'No',
      '[REFERENCE_LINKS]': order.referenceLinks || '',
      '[CLIENT_NOTES]': order.description || '',
      '[SCA_WIDGET]': 'Yes',
      '[GA_ID]': sp.tracking?.gaId || 'PLACEHOLDER',
      '[FB_PIXEL]': sp.tracking?.fbPixel || 'PLACEHOLDER',
      '[GTM_ID]': sp.tracking?.gtmId || 'PLACEHOLDER',
      '[AI_INSTRUCTIONS]': pt.aiInstructions || '',
    };
    let result = pt.rawPrompt;
    for (const [token, value] of Object.entries(tokens)) {
      if (value) result = result.replaceAll(token, value);
    }
    return result;
  }

  const PILLAR_STRATEGY = {
    'seo': { label: 'SEO', direction: 'Structure every section for search. Keyword-rich H1, H2s as search queries, meta title + description, LocalBusiness schema.' },
    'problem-solution': { label: 'Problem → Solution', direction: 'Open by agitating the exact pain. Make them feel understood before revealing the solution. Hero names the problem, not the service.' },
    'achievement-result': { label: 'Achievement & End Result', direction: 'Lead with the transformation. Every headline paints life after working with this business. Benefits are outcomes, never features.' },
    'trust-authority': { label: 'Trust & Authority', direction: 'Lead with proof. Years, ratings, certifications front and center. Every claim backed by evidence. FAQ handles hardest objections.' },
    'frictionless': { label: 'Frictionless Experience', direction: 'Short and scannable. One primary CTA repeated top/middle/bottom. Visitor understands the offer and can act in under 30 seconds.' },
    'buyer-intent': { label: 'Buyer Intent', direction: 'Skip education. Lead immediately with offer, outcome, CTA. Urgency throughout. Built for someone searching to buy today.' },
    'photo-gallery': { label: 'Photo Gallery', direction: 'Showcase work visually. Grid-first layout. Categories, before/after, project descriptions. CTAs between gallery sections.' },
  };
  const strategy = PILLAR_STRATEGY[order.pillar] || PILLAR_STRATEGY['problem-solution'];

  return `You are an expert Next.js developer. Build a complete ${order.buildType || 'custom'} Next.js site for ${order.siteName || '[Site Name]'}.

Generate every file in the file structure. All pages fully styled and production-ready. Mobile-first, statically exported (output: 'export'), 95+ PageSpeed mobile.

---

## STRATEGY PILLAR: ${strategy.label}

${strategy.direction}

---

## BUSINESS

Name: ${order.siteName || '[Site Name]'}
Industry: ${sp.industry || '[Industry]'}
Owner: ${sp.ownerName || b.ownerPersona?.name || '[Owner]'}
Phone: ${sp.phone || '[Phone]'}
Email: ${sp.email || '[Email]'}
Address: ${sp.address || '[Address]'}
Service Area: ${b.serviceArea || sp.serviceArea || '[Service Area]'}
Domain: ${sp.domain || '[Domain]'}

---

## BRAND

Tagline: ${b.tagline || '[tagline]'}
Core Offer: ${b.coreOffer || '[core offer]'}
Brand Voice: ${voice.brandVoice || '[voice]'}
Tone: ${voice.tone || '[tone]'}
Words to Avoid: ${(voice.wordsToAvoid || []).join(', ') || '[none]'}
Preferred Phrases: ${(voice.preferredPhrases || []).join(', ') || '[none]'}
Differentiators: ${(b.differentiators || []).join(' · ') || '[differentiators]'}
Key Selling Points: ${(b.keySellingPoints || []).join(' · ') || '[selling points]'}
Guarantees: ${(b.guarantees || []).join(' · ') || '[guarantees]'}
Target Customer: ${avatar.description || '[customer description]'}
Pain Points: ${(avatar.painPoints || []).join(', ') || '[pain points]'}
${b.ownerPersona?.backstory ? `Owner Story: ${b.ownerPersona.backstory}` : ''}

---

## STYLE

Primary Color: ${sg.primaryColor || '#1e3a5f'}
Secondary Color: ${sg.secondaryColor || '#f59e0b'}
Accent Color: ${sg.accentColor || '#ffffff'}
Font Heading: ${sg.fontHeading || 'Inter'}
Font Body: ${sg.fontBody || 'Inter'}
Button Style: ${sg.buttonStyle || 'Solid'}
Button Radius: ${borderRadiusBtn}
Card Radius: ${sg.borderRadius || '16px'}
Logo: ${sg.logoUrl || '/logo.png'}

---

## SERVICES

${services || '[Derive from business context]'}

---

## SOCIAL PROOF

Years in Business: ${proof.yearsInBusiness || '[Years]'}
Jobs Completed: ${proof.jobsCompleted || '[Jobs]'}
Google Rating: ${proof.googleRating || '[Rating]'}
Certifications: ${proof.certifications || '[Certifications]'}
Guarantees: ${(b.guarantees || []).join(', ') || '[Guarantees]'}
${testimonials ? `Testimonials:
${testimonials}` : 'Testimonials: [Use realistic placeholders]'}

---

## PAGES TO BUILD

${order.selectedPages?.length ? order.selectedPages.map(p => `- ${p}`).join('\n') : '- Home, About, Services, Contact'}
${ec ? `
---

## ECOMMERCE

- Categories: ${(ec.categories || []).join(', ') || '[categories]'} — client manages in admin panel
- Payment Processor: ${ec.paymentProcessor || '[processor]'}
- Size Variants: ${ec.sizeVariants ? 'Yes' : 'No'}
- Estimated Products: ${ec.estimatedProducts || '[count]'}
- Needs: cart, checkout, order confirmation, product/category/order admin panel
${ec.notes ? `- Notes: ${ec.notes}` : ''}` : ''}
${order.referenceLinks ? `
---

## REFERENCE SITES

${order.referenceLinks}` : ''}
${seoBlock ? `
---

## SEO

${seoBlock}` : ''}
${order.description ? `
---

## CLIENT NOTES

${order.description}` : ''}

---

## TECHNICAL REQUIREMENTS

- Next.js 14+ App Router, CSS Modules (no Tailwind)
- Static export: next.config.mjs → output: 'export'
- next/font/google for fonts
- LocalBusiness JSON-LD + meta/OG tags on every page
- Sitemap: app/sitemap.js
- Mobile-first, fully responsive
- 'use client' only in component files, never in page.jsx

Generate the complete file structure with every file fully implemented. Include component breakdown and all pages. Production-ready.`;
}

// ─── ORDER DETAIL ───
function OrderDetail({ order: initialOrder, onBack, onStatusChange }) {
  const [order, setOrder] = useState(initialOrder);
  const [copied, setCopied] = useState(false);
  const [buildCopied, setBuildCopied] = useState(false);
  const [generatingBuild, setGeneratingBuild] = useState(false);
  const gp = order.generatedPage;
  const TypeIcon = ORDER_TYPE_ICONS[order.orderType] || FaGlobe;
  const typeColor = ORDER_TYPE_COLORS[order.orderType] || '#0ea5e9';

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Prompt copied — paste into VS Code / Q / Kiro');
    setTimeout(() => setCopied(false), 3000);
  };

  const copyBuild = (text) => {
    navigator.clipboard.writeText(text);
    setBuildCopied(true);
    toast.success('Build prompt copied!');
    setTimeout(() => setBuildCopied(false), 3000);
  };

  const handleGenerateBuildPrompt = async () => {
    setGeneratingBuild(true);
    try {
      const headers = await authHeaders();
      const [brandingRes, sitePromptRes, templatesRes] = await Promise.all([
        axios.get(`${BUSINESS_API}/business/${order.businessId}/branding`, { headers }),
        axios.get(`${BUSINESS_API}/business/${order.businessId}/site-prompt`, { headers }).catch(() => ({ data: null })),
        axios.get(`${BASE}/prompt-templates?templateType=site&active=true`, { headers }).catch(() => ({ data: [] })),
      ]);
      const templates = templatesRes.data || [];
      const matchedTemplate = templates.find(t => t.buildType === order.buildType) || templates[0] || null;
      const prompt = generateBuildPrompt(order, brandingRes.data, sitePromptRes.data, matchedTemplate);
      const now = new Date().toISOString();
      await updateAdminOrder(order._id, {
        generatedBuildPrompt: prompt,
        promptGeneratedAt: now,
        status: 'In Progress',
      });
      setOrder(prev => ({ ...prev, generatedBuildPrompt: prompt, promptGeneratedAt: now, status: 'In Progress' }));
      onStatusChange(order._id, 'In Progress');
      toast.success('Build prompt generated!');
    } catch { toast.error('Failed to generate prompt'); }
    finally { setGeneratingBuild(false); }
  };

  const pillar = PILLARS.find(p => p.key === (order.pillar || gp?.pillar));
  const displayTitle = order.orderType === 'hosting'
    ? (order.domain || 'Hosting Request')
    : order.orderType === 'site-build'
    ? (order.siteName || 'Site Build Request')
    : order.title;

  return (
    <div className="ssa-page">
      <button className="ssa-back-btn" onClick={onBack}><FaChevronLeft /> Back to Orders</button>

      <div className="ssa-detail-header">
        <div className="ssa-detail-title-row">
          <h2>{displayTitle}</h2>
          <select
            className="ssa-status-select"
            value={order.status}
            style={{ borderColor: ORDER_STATUS_COLORS[order.status] }}
            onChange={e => onStatusChange(order._id, e.target.value)}
          >
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="ssa-detail-meta">
          <span className="ssa-tag" style={{ background: `${typeColor}22`, color: typeColor, borderColor: `${typeColor}44` }}>
            <TypeIcon size={11} /> {ORDER_TYPE_LABELS[order.orderType] || 'Page Order'}
          </span>
          <span className="ssa-tag">Business: {order.businessId}</span>
          {order.priority && order.priority !== 'Normal' && <span className="ssa-tag">{order.priority}</span>}
          <span className="ssa-tag">Submitted: {new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* ── Hosting detail ── */}
      {order.orderType === 'hosting' && (
        <div className="ssa-section-block">
          <h3><FaServer size={13} /> Hosting Details</h3>
          <div className="ssa-detail-grid">
            <div><label>Domain</label><p>{order.domain}</p></div>
            {order.needsDomain && <div><label>Needs Domain</label><p>Yes — client needs domain registration</p></div>}
            {order.hostingPlan && <div><label>Plan</label><p>{order.hostingPlan}</p></div>}
            {order.currentSiteUrl && <div><label>Current Site</label><p><a href={order.currentSiteUrl} target="_blank" rel="noreferrer">{order.currentSiteUrl}</a></p></div>}
          </div>
          {order.notes && <p className="ssa-notes">{order.notes}</p>}
        </div>
      )}

      {/* ── Site build detail ── */}
      {order.orderType === 'site-build' && (
        <>
          <div className="ssa-section-block">
            <h3><FaHammer size={13} /> Site Build Details</h3>
            <div className="ssa-detail-grid">
              {order.buildType && <div><label>Build Type</label><p>{order.isCustom ? `Custom — ${order.buildType}` : order.buildType}</p></div>}
              {pillar && <div><label>Strategy Pillar</label><p><pillar.icon size={12} /> {pillar.label}</p></div>}
              {order.selectedPages?.length > 0 && (
                <div className="full-width"><label>Pages Requested</label><p>{order.selectedPages.join(', ')}</p></div>
              )}
            </div>
            {order.description && <p className="ssa-notes">{order.description}</p>}
          </div>

          {order.ecommerce && (
            <div className="ssa-section-block">
              <h3><FaShoppingCart size={13} /> Ecommerce Details</h3>
              <div className="ssa-detail-grid">
                {order.ecommerce.paymentProcessor && <div><label>Payment Processor</label><p>{order.ecommerce.paymentProcessor}</p></div>}
                {order.ecommerce.estimatedProducts && <div><label>Est. Products</label><p>{order.ecommerce.estimatedProducts}</p></div>}
                <div><label>Size Variants</label><p>{order.ecommerce.sizeVariants ? 'Yes' : 'No'}</p></div>
                {order.ecommerce.categories?.length > 0 && (
                  <div className="full-width">
                    <label>Product Categories</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                      {order.ecommerce.categories.map((cat, i) => (
                        <span key={i} className="ssa-tag">{cat}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {order.ecommerce.notes && <p className="ssa-notes">{order.ecommerce.notes}</p>}
            </div>
          )}

          {order.referenceLinks && (
            <div className="ssa-section-block">
              <h3><FiLink size={14} /> Reference Sites</h3>
              <p className="ssa-pre">{order.referenceLinks}</p>
            </div>
          )}

          {order.branding && (
            <div className="ssa-section-block">
              <h3>Branding Snapshot</h3>
              <div className="ssa-detail-grid">
                {order.branding.tagline && <div><label>Tagline</label><p>{order.branding.tagline}</p></div>}
                {order.branding.coreOffer && <div className="full-width"><label>Core Offer</label><p>{order.branding.coreOffer}</p></div>}
                {order.branding.styleGuide?.primaryColor && (
                  <div><label>Primary Color</label><p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 16, height: 16, borderRadius: 4, background: order.branding.styleGuide.primaryColor, display: 'inline-block' }} />
                    {order.branding.styleGuide.primaryColor}
                  </p></div>
                )}
                {order.branding.styleGuide?.fontHeading && <div><label>Heading Font</label><p>{order.branding.styleGuide.fontHeading}</p></div>}
                {order.branding.voice?.tone && <div><label>Brand Tone</label><p>{order.branding.voice.tone}</p></div>}
                {order.branding.differentiators?.length > 0 && (
                  <div className="full-width"><label>Differentiators</label><p>{order.branding.differentiators.join(' · ')}</p></div>
                )}
              </div>
            </div>
          )}

          {/* ── Generate Build Prompt ── */}
          <div className="ssa-section-block">
            <div className="ssa-section-header">
              <h3><FaHammer size={14} /> Build Prompt</h3>
              {order.promptGeneratedAt && (
                <span className="ssa-tag" style={{ background: '#22c55e22', color: '#22c55e', borderColor: '#22c55e44' }}>
                  Generated {new Date(order.promptGeneratedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            {order.generatedBuildPrompt ? (
              <>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <button className={`ssa-copy-btn ${buildCopied ? 'copied' : ''}`} onClick={() => copyBuild(order.generatedBuildPrompt)}>
                    {buildCopied ? <><FaCheck /> Copied!</> : <><FaCopy /> Copy Full Prompt — Paste into VS Code / Q / Kiro</>}
                  </button>
                  <button className="ssa-refresh-btn" onClick={handleGenerateBuildPrompt} disabled={generatingBuild}>
                    {generatingBuild ? <><FaSpinner className="spin" /> Regenerating...</> : <><FiRefreshCw size={13} /> Regenerate</>}
                  </button>
                </div>
                <pre className="ssa-prompt-output">{order.generatedBuildPrompt}</pre>
              </>
            ) : (
              <>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  No build prompt yet. Generate one from the order details and branding snapshot above.
                </p>
                <button className="ssa-copy-btn" onClick={handleGenerateBuildPrompt} disabled={generatingBuild}>
                  {generatingBuild
                    ? <><FaSpinner className="spin" /> Generating...</>
                    : <><FaHammer size={13} /> Generate Build Prompt</>}
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Page order detail ── */}
      {order.orderType === 'page' && (
        <>
          <div className="ssa-detail-meta" style={{ marginBottom: '1rem' }}>
            {order.pageType && <span className="ssa-tag">{order.pageType}</span>}
            {pillar && <span className="ssa-tag"><pillar.icon size={12} /> {pillar.label}</span>}
          </div>

          {order.description && (
            <div className="ssa-section-block">
              <h3><FiAlertTriangle size={14} /> Client Notes</h3>
              <p>{order.description}</p>
            </div>
          )}

          {order.referenceLinks && (
            <div className="ssa-section-block">
              <h3><FiLink size={14} /> Reference Links</h3>
              <p className="ssa-pre">{order.referenceLinks}</p>
            </div>
          )}

          {gp?.gaps?.length > 0 && (
            <div className="ssa-section-block ssa-gaps-block">
              <h3><FiAlertTriangle size={14} /> Content Gaps — Collect Before Building</h3>
              <p className="ssa-gaps-note">These were identified by AI as missing from the video. Collect from the client before the page goes live.</p>
              <ul className="ssa-gaps-list">
                {gp.gaps.map((gap, i) => <li key={i}>{gap}</li>)}
              </ul>
            </div>
          )}

          {gp ? (
            <div className="ssa-section-block">
              <div className="ssa-section-header">
                <h3><FaCopy size={14} /> Generated Prompt</h3>
                <span className="ssa-tag" style={{ background: STATUS_COLORS[gp.status], color: '#fff' }}>
                  {STATUS_LABELS[gp.status] || gp.status}
                </span>
              </div>
              {gp.status === 'complete' && gp.generatedPrompt && (
                <>
                  <button className={`ssa-copy-btn ${copied ? 'copied' : ''}`} onClick={() => copy(gp.generatedPrompt)}>
                    {copied ? <><FaCheck /> Copied!</> : <><FaCopy /> Copy Full Prompt — Paste into VS Code / Q / Kiro</>}
                  </button>
                  {gp.transcriptBullets?.length > 0 && (
                    <div className="ssa-bullets-block">
                      <label>Key Points from Video</label>
                      <ul>{gp.transcriptBullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
                    </div>
                  )}
                  <pre className="ssa-prompt-output">{gp.generatedPrompt}</pre>
                </>
              )}
              {['transcribing', 'generating', 'uploading'].includes(gp.status) && (
                <div className="ssa-processing"><FaSpinner className="spin" /> {STATUS_LABELS[gp.status]}</div>
              )}
              {gp.status === 'failed' && (
                <div className="ssa-error">Prompt generation failed. Business needs to re-upload their video.</div>
              )}
            </div>
          ) : (
            <div className="ssa-section-block ssa-no-prompt">
              <h3><FiVideo size={14} /> No Video Uploaded Yet</h3>
              <p>This order doesn't have a Video To Page prompt attached. The business can generate one from the Video To Page tab, or you can build the page manually using the order details above.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
