import { useMemo, useState, type ReactNode } from 'react';
import { ANCESTORS, type AncestorKey } from '../ancestors';
import { StageContext, useStageControls } from '../stage-context';

export function StageProvider({ children }: { children: ReactNode }) {
  const [base, setBase] = useState<AncestorKey>('press');
  const [preview, setPreview] = useState<AncestorKey | null>(null);
  const value = useMemo(() => ({ base, preview, setBase, setPreview }), [base, preview]);
  return <StageContext.Provider value={value}>{children}</StageContext.Provider>;
}

// All drawings stay mounted and cross-fade, so pointing along the contents never waits on a download.
export function Stage() {
  const { base, preview } = useStageControls();
  const shown = ANCESTORS[preview ?? base];

  return (
    <aside className="stage" aria-label="Drawing for this page">
      <div className="stage__field">
        {Object.values(ANCESTORS).map((a) => (
          <img
            key={a.key}
            className={`stage__img stage__img--${a.key}${a.key === shown.key ? ' is-shown' : ''}`}
            src={a.src}
            alt={a.key === shown.key ? `${a.name}, US patent drawing, ${a.year}` : ''}
            aria-hidden={a.key !== shown.key}
            width={1000}
            height={1450}
            decoding="async"
          />
        ))}
      </div>
      <p className="stage__caption" aria-live="polite">
        {shown.name}, {shown.year}. The ancestor of {shown.role}.
      </p>
    </aside>
  );
}
