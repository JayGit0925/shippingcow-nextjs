export default function DashboardLoading() {
  return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#6B7280' }}>
        <div
          style={{
            width: 32,
            height: 32,
            border: '3px solid #E5E7EB',
            borderTopColor: '#0052C9',
            borderRadius: '50%',
            margin: '0 auto 0.75rem',
            animation: 'sc-spin 0.8s linear infinite',
          }}
        />
        <p style={{ fontSize: '0.85rem', margin: 0 }}>Mooooving things into place…</p>
        <style>{`@keyframes sc-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
