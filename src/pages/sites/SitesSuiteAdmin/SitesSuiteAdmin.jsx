import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { FaGlobe, FaSpinner, FaCopy, FaChevronLeft, FaCheck, FaServer, FaHammer, FaShoppingCart } from 'react-icons/fa';
import { FiRefreshCw, FiAlertTriangle, FiLink, FiVideo, FiFilter, FiSearch, FiZap, FiTrendingUp, FiShield, FiChevronsRight, FiChevronsLeft, FiTarget, FiImage } from 'react-icons/fi';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import './SitesSuiteAdmin.css';

const BASE = import.meta.env.VITE_SITES_SUITE_API || import.meta.env.VITE_API_BASE;

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
function generateBuildPrompt(order) {
  const b = order.branding || {};
  const sg = b.styleGuide || {};
  const voice = b.voice || {};
  const avatar = b.customerAvatar || {};
  const ec = order.ecommerce;
  const pillarObj = PILLARS.find(p => p.key === order.pillar);

  return `Build a ${order.buildType || 'custom'} Next.js website for ${order.siteName || '[Site Name]'}.

You are an expert Next.js developer. Generate a complete, deployable Next.js 14+ project (App Router) with CSS Modules. The site must be fully responsive, statically exported (output: 'export'), score 95+ on PageSpeed mobile, and look like a $5,000 custom build.

---

BUSINESS CONTEXT
- Tagline: ${b.tagline || '[tagline]'}
- Core Offer: ${b.coreOffer || '[core offer]'}
- Brand Tone: ${voice.tone || '[tone]'}${voice.brandVoice ? ` — ${voice.brandVoice}` : ''}
- Target Customer: ${avatar.description || '[customer description]'}
- Pain Points: ${Array.isArray(avatar.painPoints) ? avatar.painPoints.join(', ') : (avatar.painPoints || '[pain points]')}
- Differentiators: ${Array.isArray(b.differentiators) ? b.differentiators.join(' · ') : (b.differentiators || '[differentiators]')}
- Guarantees: ${Array.isArray(b.guarantees) ? b.guarantees.join(' · ') : (b.guarantees || '[guarantees]')}
- Service Area: ${b.serviceArea || '[service area]'}
${b.ownerPersona ? `- Owner Persona: ${b.ownerPersona}` : ''}

---

STYLE GUIDE
- Primary Color: ${sg.primaryColor || '[primary]'}
- Secondary Color: ${sg.secondaryColor || '[secondary]'}
- Heading Font: ${sg.fontHeading || 'Inter'}
- Body Font: ${sg.fontBody || 'Inter'}
- Button Style: ${sg.buttonStyle || 'Gradient'}
${sg.logoUrl ? `- Logo URL: ${sg.logoUrl}` : ''}
${sg.bgDark ? `- BG Dark: ${sg.bgDark}` : ''}
${sg.bgLight ? `- BG Light: ${sg.bgLight}` : ''}

---

PAGES TO BUILD
${order.selectedPages?.length ? order.selectedPages.map(p => `- ${p}`).join('\n') : '- Home, About, Services, Contact'}

---

STRATEGY PILLAR
${pillarObj ? `${pillarObj.label} — ${pillarObj.desc}` : (order.pillar || '[pillar]')}
${order.description ? `\nClient Notes: ${order.description}` : ''}

---
${ec ? `
ECOMMERCE REQUIREMENTS
- Product Categories: ${ec.categories?.join(', ') || '[categories]'} — client manages these in admin panel
- Payment Processor: ${ec.paymentProcessor || '[processor]'}
- Size Variants: ${ec.sizeVariants ? 'Yes' : 'No'}
- Estimated Products: ${ec.estimatedProducts || '[count]'}
- Admin panel needed: product management, pricing, order management, category management
- Cart, checkout, order confirmation flow required
${ec.notes ? `- Notes: ${ec.notes}` : ''}

---
` : ''}
${order.referenceLinks ? `REFERENCE SITES
${order.referenceLinks}

---
` : ''}
TECHNICAL REQUIREMENTS
- Framework: Next.js 14+ (App Router)
- Styling: CSS Modules (no Tailwind)
- Output: Static export (next.config.mjs → output: 'export')
- Font Loading: next/font/google
- Icons: react-icons
- Structured Data: LocalBusiness JSON-LD on every page
- Sitemap: app/sitemap.js
- Meta Tags: unique title + description per page
- Open Graph: per page

Generate the complete file structure with every file fully implemented. Include component breakdown, layout, and all pages. Make it production-ready.`;
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
      const prompt = generateBuildPrompt(order);
      const now = new Date().toISOString();
      await updateAdminOrder(order._id, {
        generatedBuildPrompt: prompt,
        promptGeneratedAt: now,
        status: 'In Progress',
      });
      setOrder(prev => ({ ...prev, generatedBuildPrompt: prompt, promptGeneratedAt: now, status: 'In Progress' }));
      onStatusChange(order._id, 'In Progress');
      toast.success('Build prompt generated!');
    } catch { toast.error('Failed to save prompt'); }
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
