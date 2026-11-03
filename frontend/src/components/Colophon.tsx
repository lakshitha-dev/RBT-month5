import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api, type Health } from '../api/client';
import { formatUptime } from '../format';

// A printed journal's colophon says how the issue was made. This one is read live from the API's
// own health check, so it describes the exact build that served the page.
export function Colophon() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .health()
        .then((h) => alive && setHealth(h))
        .catch(() => alive && setHealth(null));
    load();
    const timer = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const db = health?.checks?.database;

  return (
    <section className="letter" aria-labelledby="colophon-title">
      <h2 id="colophon-title" className="section__title" data-reveal>
        How this page reached you
      </h2>
      <p data-reveal>
        BlogFlow is a small publication I built to learn how software travels from a laptop to the public
        internet. Every article above is a note from that work.
      </p>
      <p data-reveal>
        {health ? (
          <>
            The copy you are reading was served by build <mark title={health.version}>{health.version.slice(0, 11)}</mark>, which GitHub Actions
            tested, packed into a container image and shipped to production.
          </>
        ) : (
          <>Each build is tested by GitHub Actions, packed into a container image and shipped to production.</>
        )}
      </p>
      <p data-reveal>
        {db?.status === 'up' && health ? (
          <>
            Its PostgreSQL database answered the last health check in {db.latency_ms} ms, and the API has
            been running for {formatUptime(health.uptime)}.
          </>
        ) : (
          <>The live numbers for this build are on the status page.</>
        )}{' '}
        <Link to="/status">See the full status</Link>.
      </p>
      <p data-reveal>
        The drawings beside each article are 19th-century patents for the machines that did the same jobs
        before software did: a telegraph for WebSockets, a switchboard for routing, a lock and key for
        logging in.
      </p>
      <p className="letter__sign" data-reveal>
        Lakshitha Wijerathne
        <span>Editor, BlogFlow</span>
      </p>
    </section>
  );
}
