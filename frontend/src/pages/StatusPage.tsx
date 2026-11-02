import { useEffect, useState } from 'react';
import { api, type Health } from '../api/client';

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m ${Math.floor(seconds % 60)}s`;
}

export function StatusPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = () =>
      api
        .health()
        .then((h) => {
          setHealth(h);
          setError('');
        })
        .catch(() => setError('API unreachable'));
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  const ok = health?.status === 'healthy' && !error;

  return (
    <section>
      <h1>System status</h1>
      <p className={`badge ${ok ? 'ok' : 'down'}`} data-testid="status-badge">
        {ok ? 'All systems operational' : error || 'Degraded'}
      </p>
      {health && (
        <dl className="status-grid">
          <dt>API version</dt>
          <dd>{health.version}</dd>
          <dt>Database</dt>
          <dd>
            {health.checks.database.status}
            {health.checks.database.latency_ms !== undefined && ` (${health.checks.database.latency_ms} ms)`}
          </dd>
          <dt>Uptime</dt>
          <dd>{formatUptime(health.uptime)}</dd>
          <dt>Memory (RSS)</dt>
          <dd>{mb(health.checks.memory.rss)}</dd>
          <dt>Checked at</dt>
          <dd>{new Date(health.timestamp).toLocaleTimeString()}</dd>
        </dl>
      )}
      <p className="muted">Refreshes every 10 seconds.</p>
    </section>
  );
}
