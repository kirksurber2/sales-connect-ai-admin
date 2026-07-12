const colors = {
  Active: 'var(--success)', Onboarding: 'var(--warning)', Churned: 'var(--error)',
  Pending: 'var(--warning)', 'In Progress': 'var(--accent)', Review: '#a78bfa', Complete: 'var(--success)',
  Open: 'var(--warning)', 'Waiting on Client': '#f97316', Resolved: 'var(--success)',
  Low: 'var(--text-muted)', Normal: 'var(--accent)', High: 'var(--warning)', Urgent: 'var(--error)',
};

export default function StatusBadge({ status }) {
  const color = colors[status] || 'var(--text-muted)';
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: 600,
      background: `${color}20`,
      color,
      border: `1px solid ${color}40`,
    }}>
      {status}
    </span>
  );
}
