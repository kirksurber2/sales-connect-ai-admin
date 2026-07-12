import { FiExternalLink } from 'react-icons/fi';
import styles from './billing.module.css';

export default function Billing() {
  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Billing</h1>

      <div className={styles.statsRow}>
        <div className={styles.stat}><div className={styles.statValue}>$0</div><div className={styles.statLabel}>Total MRR</div></div>
        <div className={styles.stat}><div className={styles.statValue}>0</div><div className={styles.statLabel}>Active Subscriptions</div></div>
        <div className={styles.stat}><div className={styles.statValue}>$0</div><div className={styles.statLabel}>Revenue This Month</div></div>
      </div>

      <div className={styles.section}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Detailed billing management is handled through Stripe. Click below to access the full dashboard.
        </p>
        <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className={styles.stripeLink}>
          <FiExternalLink /> Open Stripe Dashboard
        </a>
      </div>
    </div>
  );
}
