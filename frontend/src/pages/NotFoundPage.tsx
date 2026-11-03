import { Link } from 'react-router';
import { useStage } from '../stage-context';

export function NotFoundPage() {
  useStage('railway');
  return (
    <section className="page">
      <h1 className="page__title">Wrong turning</h1>
      <p className="page__lead">There is no page at this address.</p>
      <p>
        <Link to="/">Back to the contents</Link>
      </p>
    </section>
  );
}
