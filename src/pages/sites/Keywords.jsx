import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiSave, FiTrendingUp, FiTarget } from 'react-icons/fi';
import { api } from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import styles from './keywords.module.css';

const STATUSES = ['Targeted', 'Ranking', 'Needs Content', 'Opportunity', 'Won'];
const PAGE_TYPES = ['Pro Page', 'Blog Post', 'Landing Page', 'Service Page', 'Location Page', 'Full Site'];

export default function Keywords() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [sitePrompt, setSitePrompt] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState('');
  const [localModifiers, setLocalModifiers] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    api.get('/business').then(setClients).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function loadClient(id) {
    setSelectedClient(id);
    if (!id) { setSitePrompt(null); setKeywords([]); return; }
    try {
      const prompts = await api.get('/site-prompts?businessId=' + id);
      const sp = Array.isArray(prompts) ? prompts[0] : prompts;
      if (sp) {
        setSitePrompt(sp);
        setKeywords(sp.seo?.keywords || []);
        setPrimaryKeyword(sp.seo?.primaryKeyword || '');
        setSecondaryKeywords((sp.seo?.secondaryKeywords || []).join(', '));
        setLocalModifiers((sp.seo?.localModifiers || []).join(', '));
      } else {
        setSitePrompt(null);
        setKeywords([]);
        setPrimaryKeyword('');
        setSecondaryKeywords('');
        setLocalModifiers('');
      }
    } catch { setSitePrompt(null); }
  }

  function addKeyword() {
    setKeywords([...keywords, { term: '', status: 'Targeted', pageType: '', notes: '' }]);
  }

  function bulkAdd() {
    if (!bulkInput.trim()) return;
    const terms = bulkInput.split('\n').map(t => t.trim()).filter(Boolean);
    const newKws = terms.map(term => ({ term, status: 'Targeted', pageType: '', notes: '' }));
    setKeywords([...keywords, ...newKws]);
    setBulkInput('');
    toast.success(`Added ${newKws.length} keywords`);
  }

  function updateKeyword(i, key, val) {
    const kws = [...keywords];
    kws[i] = { ...kws[i], [key]: val };
    setKeywords(kws);
  }

  function removeKeyword(i) {
    setKeywords(keywords.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!sitePrompt) {
      toast.error('No site prompt found for this client');
      return;
    }
    setSaving(true);
    try {
      const seo = {
        primaryKeyword,
        secondaryKeywords: secondaryKeywords.split(',').map(s => s.trim()).filter(Boolean),
        localModifiers: localModifiers.split(',').map(s => s.trim()).filter(Boolean),
        keywords,
      };
      await api.put(`/site-prompts/${sitePrompt._id}`, { ...sitePrompt, seo });
      setSitePrompt({ ...sitePrompt, seo });
      toast.success('Keywords saved');
    } catch {} finally { setSaving(false); }
  }

  const filtered = filterStatus ? keywords.filter(k => k.status === filterStatus) : keywords;

  const stats = {
    total: keywords.length,
    targeted: keywords.filter(k => k.status === 'Targeted').length,
    ranking: keywords.filter(k => k.status === 'Ranking').length,
    needsContent: keywords.filter(k => k.status === 'Needs Content').length,
    won: keywords.filter(k => k.status === 'Won').length,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1><FiTarget size={20} /> SEO Keywords</h1>
        {sitePrompt && <button className={styles.saveBtn} onClick={handleSave} disabled={saving}><FiSave size={14} /> {saving ? 'Saving...' : 'Save All'}</button>}
      </div>

      {/* Client Select */}
      <div className={styles.section}>
        <select className={styles.select} value={selectedClient} onChange={e => loadClient(e.target.value)}>
          <option value="">Select client...</option>
          {clients.map(c => <option key={c.businessId} value={c.businessId}>{c.businessName}</option>)}
        </select>
      </div>

      {selectedClient && !sitePrompt && (
        <div className={styles.section}><p className={styles.muted}>No Site Prompt found for this client. Create one first in Site Builder.</p></div>
      )}

      {sitePrompt && (
        <>
          {/* Stats */}
          <div className={styles.stats}>
            <div className={styles.stat}><span className={styles.statNum}>{stats.total}</span><span className={styles.statLabel}>Total</span></div>
            <div className={styles.stat}><span className={`${styles.statNum} ${styles.blue}`}>{stats.targeted}</span><span className={styles.statLabel}>Targeted</span></div>
            <div className={styles.stat}><span className={`${styles.statNum} ${styles.green}`}>{stats.ranking}</span><span className={styles.statLabel}>Ranking</span></div>
            <div className={styles.stat}><span className={`${styles.statNum} ${styles.yellow}`}>{stats.needsContent}</span><span className={styles.statLabel}>Needs Content</span></div>
            <div className={styles.stat}><span className={`${styles.statNum} ${styles.teal}`}>{stats.won}</span><span className={styles.statLabel}>Won</span></div>
          </div>

          {/* Primary / Secondary / Modifiers */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Keyword Strategy</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Primary Keyword</label>
                <input className={styles.input} value={primaryKeyword} onChange={e => setPrimaryKeyword(e.target.value)} placeholder="roofing houston" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Local Modifiers (comma-separated)</label>
                <input className={styles.input} value={localModifiers} onChange={e => setLocalModifiers(e.target.value)} placeholder="houston, katy, sugar land" />
              </div>
              <div className={`${styles.field} ${styles.full}`}>
                <label className={styles.label}>Secondary Keywords (comma-separated)</label>
                <input className={styles.input} value={secondaryKeywords} onChange={e => setSecondaryKeywords(e.target.value)} placeholder="roof repair, storm damage, gutter installation" />
              </div>
            </div>
          </div>

          {/* Bulk Add */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Bulk Add Keywords</h3>
            <textarea className={styles.textarea} value={bulkInput} onChange={e => setBulkInput(e.target.value)} placeholder="One keyword per line..." rows={3} />
            <button className={styles.addBtn} onClick={bulkAdd}><FiPlus size={14} /> Add All</button>
          </div>

          {/* Keyword List */}
          <div className={styles.section}>
            <div className={styles.listHeader}>
              <h3 className={styles.sectionTitle}><FiTrendingUp size={16} /> Keyword Tracker ({filtered.length})</h3>
              <div className={styles.listActions}>
                <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                <button className={styles.addBtn} onClick={addKeyword}><FiPlus size={14} /> Add</button>
              </div>
            </div>

            {filtered.length === 0 && <p className={styles.muted}>No keywords yet. Add some above.</p>}

            <div className={styles.kwList}>
              {filtered.map((kw, i) => {
                const realIdx = keywords.indexOf(kw);
                return (
                  <div key={i} className={styles.kwRow}>
                    <input className={styles.kwInput} value={kw.term} onChange={e => updateKeyword(realIdx, 'term', e.target.value)} placeholder="Keyword term" />
                    <select className={styles.kwSelect} value={kw.status} onChange={e => updateKeyword(realIdx, 'status', e.target.value)}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <select className={styles.kwSelect} value={kw.pageType} onChange={e => updateKeyword(realIdx, 'pageType', e.target.value)}>
                      <option value="">Page Type</option>
                      {PAGE_TYPES.map(p => <option key={p}>{p}</option>)}
                    </select>
                    <input className={styles.kwInput} value={kw.notes} onChange={e => updateKeyword(realIdx, 'notes', e.target.value)} placeholder="Notes" style={{ flex: 2 }} />
                    <button className={styles.removeBtn} onClick={() => removeKeyword(realIdx)}><FiTrash2 size={14} /></button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
