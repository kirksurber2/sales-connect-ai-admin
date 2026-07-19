import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { FaGlobe, FaSpinner, FaCopy, FaChevronLeft, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import './SitesSuiteAdmin.css';

const PILLARS = [
  { key: 'seo', label: 'SEO', icon: '🔍', desc: 'Rank and capture organic traffic' },
  { key: 'problem-solution', label: 'Problem → Solution', icon: '💡', desc: 'Agitate pain, present your fix' },
  { key: 'achievement-result', label: 'Achievement & End Result', icon: '🏆', desc: 'Lead with transformation outcomes' },
  { key: 'trust-authority', label: 'Trust & Authority', icon: '⭐', desc: 'Credentials, proof, and social trust' },
  { key: 'frictionless', label: 'Frictionless Experience', icon: '⚡', desc: 'Speed, simplicity, remove barriers' },
  { key: 'buyer-intent', label: 'Buyer Intent', icon: '🎯', desc: 'Built for people ready to buy now' },
];

const STATUS_LABELS = {
  uploading: 'Uploading...',
  transcribing: 'Transcribing video...',
  generating: 'Generating prompt...',
  complete: 'Complete',
  failed: 'Failed',
};

const STATUS_COLORS = {
  uploading: '#0ea5e9',
  transcribing: '#0ea5e9',
  generating: '#7c3aed',
  complete: '#22c55e',
  failed: '#ef4444',
};

const BASE = import.meta.env.VITE_SITES_SUITE_API || import.meta.env.VITE_API_BASE;

const ORDER_STATUSES = ['Pending', 'In Progress', 'Review', 'Revisions', 'Complete'];

const ORDER_STATUS_COLORS = {
  Pending: '#f59e0b',
  'In Progress': '#0ea5e9',
  Review: '#7c3aed',
  Revisions: '#f97316',
  Complete: '#22c55e',
};

async function authHeaders() {
  const session = await fetchAuthSession();
  const token = session.tokens.idToken.toString();
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function getAdminOrders(status) {
  const headers = await authHeaders();
  const params = status ? `?status=${status}` : '';
  const res = await axios.get(`${BASE}/sites-suite/orders/admin${params}`, { headers });
  return res.data;
}

async function updateAdminOrder(orderId, payload) {
  const headers = await authHeaders();
  const res = await axios.patch(`${BASE}/sites-suite/orders/admin/${orderId}`, payload, { headers });
  return res.data;
}

export default function SitesSuiteAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => { loadOrders(); }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders(statusFilter);
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
        <button className="ssa-refresh-btn" onClick={loadOrders}>↻ Refresh</button>
      </div>

      {loading ? (
        <div className="ssa-loading"><FaSpinner className="spin" /> Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="ssa-empty">No orders{statusFilter ? ` with status "${statusFilter}"` : ''} yet.</div>
      ) : (
        <div className="ssa-orders-list">
          {orders.map(order => (
            <div key={order._id} className="ssa-order-row" onClick={() => setSelectedOrder(order)}>
              <div className="ssa-order-row-left">
                <strong>{order.title}</strong>
                <div className="ssa-order-row-meta">
                  <span className="ssa-biz-id">{order.businessId}</span>
                  {order.pageType && <span className="ssa-tag">{order.pageType}</span>}
                  {order.pillar && <span className="ssa-tag">{PILLARS.find(p => p.key === order.pillar)?.icon} {PILLARS.find(p => p.key === order.pillar)?.label}</span>}
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
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ORDER DETAIL ───
function OrderDetail({ order, onBack, onStatusChange }) {
  const [copied, setCopied] = useState(false);
  const gp = order.generatedPage;

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Prompt copied — paste into VS Code / Q / Kiro');
    setTimeout(() => setCopied(false), 3000);
  };

  const pillar = PILLARS.find(p => p.key === (order.pillar || gp?.pillar));

  return (
    <div className="ssa-page">
      <button className="ssa-back-btn" onClick={onBack}><FaChevronLeft /> Back to Orders</button>

      <div className="ssa-detail-header">
        <div className="ssa-detail-title-row">
          <h2>{order.title}</h2>
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
          <span className="ssa-tag">Business: {order.businessId}</span>
          {order.pageType && <span className="ssa-tag">{order.pageType}</span>}
          {pillar && <span className="ssa-tag">{pillar.icon} {pillar.label}</span>}
          {order.priority && order.priority !== 'Normal' && <span className="ssa-tag">{order.priority}</span>}
          <span className="ssa-tag">Submitted: {new Date(order.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {order.description && (
        <div className="ssa-section-block">
          <h3>📝 Client Notes</h3>
          <p>{order.description}</p>
        </div>
      )}

      {order.referenceLinks && (
        <div className="ssa-section-block">
          <h3>🔗 Reference Links</h3>
          <p className="ssa-pre">{order.referenceLinks}</p>
        </div>
      )}

      {/* Content Gaps — internal only */}
      {gp?.gaps?.length > 0 && (
        <div className="ssa-section-block ssa-gaps-block">
          <h3>⚠️ Content Gaps — Collect Before Building</h3>
          <p className="ssa-gaps-note">These were identified by AI as missing from the video. Collect from the client before the page goes live.</p>
          <ul className="ssa-gaps-list">
            {gp.gaps.map((gap, i) => <li key={i}>{gap}</li>)}
          </ul>
        </div>
      )}

      {/* Generated Page Prompt */}
      {gp ? (
        <div className="ssa-section-block">
          <div className="ssa-section-header">
            <h3>🚀 Generated Prompt</h3>
            <span className="ssa-tag" style={{ background: STATUS_COLORS[gp.status], color: '#fff' }}>
              {STATUS_LABELS[gp.status] || gp.status}
            </span>
          </div>

          {gp.status === 'complete' && gp.generatedPrompt && (
            <>
              <button
                className={`ssa-copy-btn ${copied ? 'copied' : ''}`}
                onClick={() => copy(gp.generatedPrompt)}
              >
                {copied ? <><FaCheck /> Copied!</> : <><FaCopy /> Copy Full Prompt — Paste into VS Code / Q / Kiro</>}
              </button>

              {gp.transcriptBullets?.length > 0 && (
                <div className="ssa-bullets-block">
                  <label>Key Points from Video</label>
                  <ul>
                    {gp.transcriptBullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              )}

              <pre className="ssa-prompt-output">{gp.generatedPrompt}</pre>
            </>
          )}

          {['transcribing', 'generating', 'uploading'].includes(gp.status) && (
            <div className="ssa-processing">
              <FaSpinner className="spin" /> {STATUS_LABELS[gp.status]}
            </div>
          )}

          {gp.status === 'failed' && (
            <div className="ssa-error">Prompt generation failed. Business needs to re-upload their video.</div>
          )}
        </div>
      ) : (
        <div className="ssa-section-block ssa-no-prompt">
          <h3>🎬 No Video Uploaded Yet</h3>
          <p>This order doesn't have a Video To Page prompt attached. The business can generate one from the Video To Page tab, or you can build the page manually using the order details above.</p>
        </div>
      )}
    </div>
  );
}
