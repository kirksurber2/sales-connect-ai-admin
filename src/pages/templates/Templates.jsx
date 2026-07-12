import { useEffect, useState } from 'react';
import { FiCopy, FiEdit2, FiCheck } from 'react-icons/fi';
import { api } from '../../utils/api';
import styles from './templates.module.css';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/templates').then(setTemplates).catch(() => setTemplates([]));
  }, []);

  function handleCopy() {
    navigator.clipboard.writeText(selected.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave() {
    await api.put(`/templates/${selected._id}`, { ...selected, content: editContent, updatedAt: new Date().toISOString() });
    setSelected({ ...selected, content: editContent });
    setTemplates(templates.map(t => t._id === selected._id ? { ...t, content: editContent } : t));
    setEditing(false);
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Templates</h1>
      <div className={styles.grid}>
        <div className={styles.list}>
          {templates.map(t => (
            <button key={t._id} className={`${styles.listItem} ${selected?._id === t._id ? styles.active : ''}`} onClick={() => { setSelected(t); setEditing(false); }}>
              <span>{t.name}</span>
              <span className={styles.category}>{t.category}</span>
            </button>
          ))}
          {templates.length === 0 && <p className={styles.muted}>No templates yet</p>}
        </div>
        <div className={styles.viewer}>
          {selected ? (
            <>
              <div className={styles.viewerHeader}>
                <h2>{selected.name}</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className={styles.iconBtn} onClick={handleCopy}>{copied ? <FiCheck /> : <FiCopy />}</button>
                  <button className={styles.iconBtn} onClick={() => { setEditing(!editing); setEditContent(selected.content); }}><FiEdit2 /></button>
                </div>
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
            <p className={styles.muted}>Select a template</p>
          )}
        </div>
      </div>
    </div>
  );
}
