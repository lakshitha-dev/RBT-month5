import { useEffect, useState } from 'react';
import { api, type Health } from '../api/client';
import { useStage } from '../stage-context';
import { formatUptime } from '../format';

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function StatusPage() {
  useStage('gauge');
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
    <section className="page">
      <h1 className="page__title" data-reveal>
        System status
      </h1>
      <p className="page__lead" data-reveal>
        Live health of the BlogFlow API and its database, read from the API’s own health check.
      </p>
      <p className={`status ${ok ? 'status--ok' : 'status--down'}`} data-testid="status-badge" role="status" data-reveal>
        {ok ? 'All systems operational' : error || 'Degraded'}
      </p>
      {health && (
        <dl className="readings">
          <div data-reveal style={{ '--i': 1 } as React.CSSProperties}>
            <dt>Database</dt>
            <dd>
              {health.checks.database.status}
              {health.checks.database.latency_ms !== undefined && <small> · {health.checks.database.latency_ms} ms</small>}
            </dd>
          </div>
          <div data-reveal style={{ '--i': 2 } as React.CSSProperties}>
            <dt>Uptime</dt>
            <dd>{formatUptime(health.uptime)}</dd>
          </div>
          <div data-reveal style={{ '--i': 3 } as React.CSSProperties}>
            <dt>Memory (RSS)</dt>
            <dd>{mb(health.checks.memory.rss)}</dd>
          </div>
          <div data-reveal style={{ '--i': 4 } as React.CSSProperties}>
            <dt>API version</dt>
            <dd className="readings__version" title={health.version}>
              {health.version.slice(0, 11)}
            </dd>
          </div>
          <div data-reveal style={{ '--i': 5 } as React.CSSProperties}>
            <dt>Checked at</dt>
            <dd>{new Date(health.timestamp).toLocaleTimeString()}</dd>
          </div>
        </dl>
      )}
      <p className="note">The readings refresh every 10 seconds.</p>
    </section>
  );
}
