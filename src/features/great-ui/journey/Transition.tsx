import { motion } from 'motion/react';

// Application adaptation of Great UI/StaggeredPageTransition.tsx at eda1b85e.
// The host owns data readiness; actual last-panel completion owns both handoffs.
export type TransitionPhase = 'idle' | 'covering' | 'covered' | 'revealing';

export function Transition({
  phase,
  onCovered,
  onRevealed,
}: {
  phase: TransitionPhase;
  onCovered: () => void;
  onRevealed: () => void;
}) {
  if (phase === 'idle') return null;
  return (
    <div className="journey-transition" aria-hidden="true" data-phase={phase}>
      {Array.from({ length: 3 }, (_, index) => (
        <motion.div
          key={index}
          className="journey-panel"
          initial={{ y: '-100%' }}
          animate={{ y: phase === 'revealing' ? '100%' : '0%' }}
          transition={{ duration: 0.4, delay: index * 0.04, ease: [0.85, 0, 0.15, 1] }}
          onAnimationComplete={() => {
            if (index !== 2) return;
            if (phase === 'covering') onCovered();
            if (phase === 'revealing') onRevealed();
          }}
        />
      ))}
    </div>
  );
}
