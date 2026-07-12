import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { TICKET_STATUSES } from '../../utils/constants';
import styles from './tickets.module.css';

export default function TicketDetail() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');

  useEffect(() => {
    api.get(`/tickets/${ticketId}`).then(setTicket).catch(() => {});
  }, [ticketId]);

  async function updateStatus(status) {
    const updated = { ...ticket, status, ...(status === 'Resolved' ? { resolvedAt: new Date().toISOString() } : {}) };
    await api.put(`/tickets/${ticketId}`, updated);
    setTicket(updated);
  }

  async function sendReply() {
    if (!reply.trim()) return;
    const messages = [...(ticket.messages || []), { from: 'team', text: reply, timestamp: new Date().toISOString() }];
    const updated = { ...ticket, messages };
    await api.put(`/tickets/${ticketId}`, updated);
    setTicket(updated);
    setReply('');
  }

  if (!ticket) return <LoadingSpinner />;

  return (
    <div className={styles.detail}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.3rem' }}>{ticket.subject}</h1>
        <StatusBadge status={ticket.status} />
      </div>

      <div className={styles.section}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Client: {ticket.businessId}</span>
          <StatusBadge status={ticket.priority} />
        </div>
        <select className={styles.input} style={{ width: 'auto' }} value={ticket.status} onChange={e => updateStatus(e.target.value)}>
          {TICKET_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className={styles.section}>
        <div className={styles.messages}>
          {(ticket.messages || []).map((m, i) => (
            <div key={i} className={m.from === 'team' ? styles.messageTeam : styles.messageClient}>
              <div>{m.text}</div>
              <div className={styles.messageMeta}>{m.from} · {new Date(m.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <input className={styles.input} placeholder="Type a reply..." value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendReply()} />
          <button className={styles.btn} onClick={sendReply}>Send Reply</button>
        </div>
      </div>
    </div>
  );
}
