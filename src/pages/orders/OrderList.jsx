import { useEffect, useState } from 'react';
import { FiCopy, FiCheck, FiChevronDown, FiChevronUp, FiPlus, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ORDER_STATUSES } from '../../utils/constants';
import styles from './orders.module.css';

const PILLARS = {
  'seo': 'SEO',
  'problem-solution': 'Problem → Solution',
  'achievement-result': 'Achievement & Result',
  'trust-authority': 'Trust & Authority',
  'frictionless': 'Frictionless',
  'buyer-intent': 'Buyer Intent',
};

const GP_STATUS_COLORS = {
  uploading: '#0ea5e9',
  transcribing: '#0ea5e9',
  generating: '#7c3aed',
  complete: '#22c55e',
  failed: '#ef4444',
};

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/site-orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }

  async function updateStatus(orderId, status) {
    try {
      await api.put(`/site-orders/${orderId}`, { status, ...(status === 'Complete' ? { completedAt: new Date().toISOString() } : {}) });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      toast.success(`Status → ${status}`);
    } catch { toast.error('Failed to update status'); }
  }

  function copyPrompt(orderId, text) {
    navigator.clipboard.writeText(text);
    setCopied(orderId);
    toast.success('Prompt copied — paste into VS Code / Q / Kiro');
    setTimeout(() => setCopied(null), 3000);
  }

  function toggle(id) { setExpanded(prev => prev === id ? null : id); }

  if (loading) return <LoadingSpinner />;

  const filtered = orders.filter(o => !statusFilter || o.status === statusFilter);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Orders</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={styles.refreshBtn} onClick={load}><FiRefreshCw size={14} /></button>
          <Link to="/orders/new" className={styles.addBtn}><FiPlus size={14} /> New Order</Link>
        </div>
      </div>

      <div className={styles.filters}>
        {['', ...ORDER_STATUSES].map(s => (
          <button
            key={s || 'all'}
            className={`${styles.filterTab} ${statusFilter === s ? styles.filterTabActive : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className={styles.accordionList}>
        {filtered.length === 0 && <div className={styles.empty}>No orders found</div>}
        {filtered.map(order => {
          const gp = order.generatedPage;
          const isOpen = expanded === order._id;

          return (
            <div key={order._id} className={`${styles.accordionItem} ${isOpen ? styles.accordionOpen : ''}`}>

              {/* ── Row header ── */}
              <div className={styles.accordionHeader} onClick={() => toggle(order._id)}>
                <div className={styles.accordionLeft}>
                  <span className={styles.businessName}>{order.businessName || order.businessId}</span>
                  <span className={styles.pageName}>{order.title}</span>
                  {gp?.pageTitle && gp.pageTitle !== order.title && (
                    <span className={styles.pageTag}>{gp.pageTitle}</span>
                  )}
                  {order.pillar && <span className={styles.pillarTag}>{PILLARS[order.pillar] || order.pillar}</span>}
                  {order.domain && <span className={styles.domainTag}>{order.domain}</span>}
                </div>
                <div className={styles.accordionRight}>
                  {gp && (
                    <span className={styles.gpStatus} style={{ background: GP_STATUS_COLORS[gp.status] }}>
                      {gp.status}
                    </span>
                  )}
                  <StatusBadge status={order.status} />
                  <span className={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</span>
                  {isOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                </div>
              </div>

              {/* ── Expanded body ── */}
              {isOpen && (
                <div className={styles.accordionBody}>

                  {/* Status + meta */}
                  <div className={styles.metaRow}>
                    <div className={styles.metaItem}><label>Page Type</label><span>{order.pageType || '—'}</span></div>
                    <div className={styles.metaItem}><label>Priority</label><span><StatusBadge status={order.priority} /></span></div>
                    <div className={styles.metaItem}><label>Submitted</label><span>{new Date(order.createdAt).toLocaleDateString()}</span></div>
                    <div className={styles.metaItem}>
                      <label>Status</label>
                      <select
                        className={styles.statusSelect}
                        value={order.status}
                        onChange={e => updateStatus(order._id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                      >
                        {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {order.description && (
                    <div className={styles.bodySection}>
                      <label>Client Notes</label>
                      <p>{order.description}</p>
                    </div>
                  )}

                  {/* Content gaps */}
                  {gp?.gaps?.length > 0 && (
                    <div className={`${styles.bodySection} ${styles.gapsBlock}`}>
                      <label>⚠️ Content Gaps — Collect Before Building</label>
                      <ul className={styles.gapsList}>
                        {gp.gaps.map((g, i) => <li key={i}>{g}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Transcript bullets */}
                  {gp?.transcriptBullets?.length > 0 && (
                    <div className={styles.bodySection}>
                      <label>Key Points from Video</label>
                      <ul className={styles.bulletList}>
                        {gp.transcriptBullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Generated prompt */}
                  {gp?.status === 'complete' && gp?.generatedPrompt && (
                    <div className={styles.bodySection}>
                      <div className={styles.promptHeader}>
                        <label>🚀 Generated Prompt</label>
                        <button
                          className={`${styles.copyBtn} ${copied === order._id ? styles.copyBtnCopied : ''}`}
                          onClick={() => copyPrompt(order._id, gp.generatedPrompt)}
                        >
                          {copied === order._id ? <><FiCheck size={13} /> Copied!</> : <><FiCopy size={13} /> Copy Prompt</>}
                        </button>
                      </div>
                      <pre className={styles.promptOutput}>{gp.generatedPrompt}</pre>
                    </div>
                  )}

                  {gp?.status === 'failed' && (
                    <div className={`${styles.bodySection} ${styles.errorBlock}`}>
                      Prompt generation failed — business needs to re-upload their video.
                    </div>
                  )}

                  {['transcribing', 'generating', 'uploading'].includes(gp?.status) && (
                    <div className={styles.bodySection}>
                      <span className={styles.processingTag}>⏳ {gp.status}…</span>
                    </div>
                  )}

                  {!gp && (
                    <div className={styles.bodySection}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No video prompt attached — manual order.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
