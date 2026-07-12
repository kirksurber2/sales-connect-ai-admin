import styles from './team.module.css';

export default function Team() {
  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Team</h1>
      <div className={styles.section}>
        <p className={styles.muted}>Team management will pull from Cognito User Pool. Role assignment coming soon.</p>
      </div>
    </div>
  );
}
