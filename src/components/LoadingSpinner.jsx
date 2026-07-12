import ReactLoading from 'react-loading';

export default function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <ReactLoading type="spin" color="var(--accent)" height={36} width={36} />
    </div>
  );
}
