import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './audits.module.css';

const API_BASE = import.meta.env.VITE_ADMIN_API;

export default function AuditViewer() {
  const { slug } = useParams();
  const [audit, setAudit] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Public endpoint - no auth needed
    fetch(`${API_BASE}/audits/public/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setAudit)
      .catch(() => setError(true));
  }, [slug]);

  if (error) return <div className={styles.viewer}><p>Audit not found.</p></div>;
  if (!audit) return <div className={styles.viewer}><p>Loading...</p></div>;

  return (
    <div className={styles.viewer}>
      <div className={styles.viewerHeader}>
        <h1>{audit.title || 'Your Custom Site Evaluation'}</h1>
        <p>{audit.businessName ? `Prepared for ${audit.businessName}` : ''}</p>
      </div>

      <div className={styles.videoWrap}>
        <video controls autoPlay playsInline src={audit.videoUrl} />
      </div>

      {audit.ctaText && (
        <a href={audit.ctaLink || '#'} className={styles.ctaBtn} target="_blank" rel="noopener noreferrer">
          {audit.ctaText}
        </a>
      )}

      {!audit.ctaText && (
        <a href={audit.calendarLink || '#'} className={styles.ctaBtn} target="_blank" rel="noopener noreferrer">
          Book Your Live System Demonstration
        </a>
      )}
    </div>
  );
}
