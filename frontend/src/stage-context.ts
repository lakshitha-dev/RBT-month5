import { createContext, useContext, useEffect } from 'react';
import type { AncestorKey } from './ancestors';

export interface StageState {
  /** the page's own picture */
  base: AncestorKey;
  /** a picture someone is pointing at in the contents, shown over the base */
  preview: AncestorKey | null;
  setBase: (key: AncestorKey) => void;
  setPreview: (key: AncestorKey | null) => void;
}

export const StageContext = createContext<StageState | null>(null);

export function useStageControls() {
  const ctx = useContext(StageContext);
  if (!ctx) throw new Error('useStageControls must be used inside <StageProvider>');
  return ctx;
}

/** Sets the picture the fixed stage shows while this page is open. */
export function useStage(key: AncestorKey) {
  const { setBase, setPreview } = useStageControls();
  useEffect(() => {
    setBase(key);
    setPreview(null);
  }, [key, setBase, setPreview]);
}
