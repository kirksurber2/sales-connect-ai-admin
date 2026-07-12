import { ClipLoader } from 'react-spinners';

export default function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <ClipLoader color="var(--accent)" size={36} />
    </div>
  );
}
