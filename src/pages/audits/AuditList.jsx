import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { FiUpload, FiCopy, FiTrash2, FiVideo, FiUserPlus } from 'react-icons/fi';
import { api } from '../../utils/api';
import { INDUSTRIES } from '../../utils/constants';
import styles from './audits.module.css';

const VIEWER_BASE = 'https://app.salesconnectai.com';

const emptyLead = { businessName: '', firstName: '', lastName: '', phone: '', email: '', industry: '' };

export default function AuditList() {
  const [audits, setAudits] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [leads, setLeads] = useState([]);
  const [sourceType, setSourceType] = useState('lead');
  const [selectedId, setSelectedId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [showNewLead, setShowNewLead] = useState(false);
  const [newLead, setNewLead] = useState(emptyLead);
  const [savingLead, setSavingLead] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    api.get('/audits').then(setAudits).catch(() => {});
    api.get('/business').then(setBusinesses).catch(() => {});
    api.get('/leads').then(res => setLeads(res.leads || [])).catch(() => {});
  }, []);

  function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  async function handleUpload() {
    if (!file || !selectedId) {
      toast.error('Select a business/lead and video file');
      return;
    }

    const source = sourceType === 'business'
      ? businesses.find(b => b.businessId === selectedId)
      : leads.find(l => l._id === selectedId || l.leadId === selectedId);
    const name = source?.businessName || source?.name || 'audit';
    const fileName = `${slugify(name)}-${Date.now()}.mp4`;

    setUploading(true);
    setProgress(0);

    try {
      // Get presigned upload URL from backend
      const { uploadUrl, key } = await api.post('/audits/upload-url', {
        fileName,
        contentType: file.type,
        sourceType,
        sourceId: selectedId,
      });

      // Upload directly to S3
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => xhr.status === 200 ? resolve() : reject(new Error('Upload failed'));
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      // Save audit record
      const audit = await api.post('/audits', {
        sourceType,
        sourceId: selectedId,
        businessName: name,
        title: title || `Site Audit - ${name}`,
        videoKey: key,
        fileName,
      });

      setAudits(prev => [audit, ...prev]);
      setFile(null);
      setTitle('');
      setSelectedId('');
      setProgress(0);
      toast.success('Audit video uploaded!');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateLead(e) {
    e.preventDefault();
    if (!newLead.firstName || !newLead.lastName || !newLead.phone) {
      toast.error('First name, last name, and phone are required');
      return;
    }
    setSavingLead(true);
    try {
      const result = await api.post('/leads', {
        firstName: newLead.firstName,
        lastName: newLead.lastName,
        businessName: newLead.businessName,
        phone: newLead.phone,
        email: newLead.email,
        industry: newLead.industry,
        source: 'manual-entry',
      });
      const lead = result.lead;
      setLeads(prev => [lead, ...prev]);
      setSourceType('lead');
      setSelectedId(lead._id);
      setNewLead(emptyLead);
      setShowNewLead(false);
      toast.success('Lead created!');
    } catch {
      // handled by api.js
    } finally {
      setSavingLead(false);
    }
  }

  function getViewerUrl(audit) {
    return `${VIEWER_BASE}/audit/${audit.slug || audit._id}`;
  }

  function copyLink(audit) {
    navigator.clipboard.writeText(getViewerUrl(audit));
    toast.success('Link copied!');
  }

  async function deleteAudit(id) {
    if (!confirm('Delete this audit?')) return;
    await api.delete(`/audits/${id}`);
    setAudits(prev => prev.filter(a => a._id !== id));
    toast.success('Deleted');
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Video Audits</h1>
      </div>

      {/* Upload Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><FiUpload size={16} /> Upload New Audit</h2>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>Source Type</label>
            <select className={styles.input} value={sourceType} onChange={e => { setSourceType(e.target.value); setSelectedId(''); }}>
              <option value="lead">Business Lead</option>
              <option value="business">Existing Business</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{sourceType === 'business' ? 'Business' : 'Lead'} *</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select className={styles.input} value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{ flex: 1 }}>
                <option value="">Select {sourceType === 'business' ? 'business' : 'lead'}...</option>
                {sourceType === 'business'
                  ? businesses.map(b => <option key={b.businessId} value={b.businessId}>{b.businessName}</option>)
                  : leads.map(l => <option key={l._id || l.leadId} value={l._id || l.leadId}>{l.businessName || l.name}</option>)
                }
              </select>
              {sourceType === 'lead' && (
                <button type="button" className={styles.copyBtn} onClick={() => setShowNewLead(v => !v)} title="Create new lead">
                  <FiUserPlus size={14} />
                </button>
              )}
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Title (optional)</label>
            <input className={styles.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Site Audit - Business Name" />
          </div>
        </div>

        {showNewLead && sourceType === 'lead' && (
          <form className={styles.newLeadForm} onSubmit={handleCreateLead}>
            <h3 className={styles.newLeadTitle}>New Lead</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>First Name *</label>
                <input className={styles.input} required value={newLead.firstName} onChange={e => setNewLead(p => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Last Name *</label>
                <input className={styles.input} required value={newLead.lastName} onChange={e => setNewLead(p => ({ ...p, lastName: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Business Name</label>
                <input className={styles.input} value={newLead.businessName} onChange={e => setNewLead(p => ({ ...p, businessName: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Phone *</label>
                <input className={styles.input} required value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input className={styles.input} type="email" value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Industry</label>
                <select className={styles.input} value={newLead.industry} onChange={e => setNewLead(p => ({ ...p, industry: e.target.value }))}>
                  <option value="">Select...</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.actions}>
              <button type="submit" className={styles.submitBtn} disabled={savingLead}>
                {savingLead ? 'Saving...' : 'Create Lead'}
              </button>
              <button type="button" className={styles.copyBtn} onClick={() => setShowNewLead(false)}>Cancel</button>
            </div>
          </form>
        )}

        <div className={styles.uploadZone} onClick={() => fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept="video/mp4,video/webm" onChange={e => setFile(e.target.files[0])} />
          <FiVideo size={24} />
          <p>{file ? file.name : 'Click to select video file (.mp4 / .webm)'}</p>
        </div>

        {uploading && (
          <div className={styles.progress}>
            <div className={styles.progressBar} style={{ width: `${progress}%` }} />
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.submitBtn} onClick={handleUpload} disabled={uploading}>
            <FiUpload size={14} /> {uploading ? `Uploading ${progress}%` : 'Upload & Create'}
          </button>
        </div>
      </div>

      {/* Audit List */}
      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <span>Title</span>
          <span>Business</span>
          <span>Date</span>
          <span>Views</span>
          <span>Actions</span>
        </div>
        {audits.length === 0 && <div className={styles.empty}>No audits yet</div>}
        {audits.map(a => (
          <div key={a._id} className={styles.tableRow}>
            <span>{a.title}</span>
            <span className={styles.muted}>{a.businessName}</span>
            <span className={styles.muted}>{new Date(a.createdAt).toLocaleDateString()}</span>
            <span className={styles.muted}>{a.views || 0}</span>
            <span className={styles.actions}>
              <button className={styles.copyBtn} onClick={() => copyLink(a)}><FiCopy size={12} /> Link</button>
              <button className={styles.deleteBtn} onClick={() => deleteAudit(a._id)}><FiTrash2 size={12} /></button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
