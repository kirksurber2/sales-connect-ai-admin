import { useEffect, useState } from 'react';
import { FiSearch, FiEdit2 } from 'react-icons/fi';
import { api } from '../../utils/api';
import { SOP_CATEGORIES } from '../../utils/constants';
import styles from './sops.module.css';

export default function Sops() {
  const [sops, setSops] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    api.get('/sops').then(setSops).catch(() => setSops([]));
  }, []);

  const filtered = sops.filter(s => {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (catFilter && s.category !== catFilter) return false;
    return true;
  });

  async function handleSave() {
    await api.put(`/sops/${selected._id}`, { ...selected, content: editContent, updatedAt: new Date().toISOString() });
    setSelected({ ...selected, content: editContent });
    setSops(sops.map(s => s._id === selected._id ? { ...s, content: editContent } : s));
    setEditing(false);
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>SOPs</h1>
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Search SOPs..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={styles.select} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {SOP_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className={styles.grid}>
        <div className={styles.list}>
          {filtered.map(s => (
            <button key={s._id} className={`${styles.listItem} ${selected?._id === s._id ? styles.active : ''}`} onClick={() => { setSelected(s); setEditing(false); }}>
              <span>{s.title}</span>
              <span className={styles.category}>{s.category}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className={styles.muted}>No SOPs found</p>}
        </div>
        <div className={styles.viewer}>
          {selected ? (
            <>
              <div className={styles.viewerHeader}>
                <h2>{selected.title}</h2>
                <button className={styles.iconBtn} onClick={() => { setEditing(!editing); setEditContent(selected.content); }}><FiEdit2 /></button>
              </div>
              {editing ? (
                <>
                  <textarea className={styles.editor} value={editContent} onChange={e => setEditContent(e.target.value)} />
                  <button className={styles.saveBtn} onClick={handleSave}>Save</button>
                </>
              ) : (
                <pre className={styles.content}>{selected.content}</pre>
              )}
            </>
          ) : (
            <p className={styles.muted}>Select an SOP</p>
          )}
        </div>
      </div>
    </div>
  );
}
