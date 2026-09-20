import * as motion from 'motion/react-m';
import { useId, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';

// Adapted from Great UI/Accordion.tsx, eda1b85e: preserve height/opacity reveal,
// add labelled regions, deterministic initial state and intentional multi-open mode.
export function Accordion({
  items,
  multiple = false,
  reduced = false,
}: {
  items: { title: string; description: ReactNode }[];
  multiple?: boolean;
  reduced?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState<number[]>([]);
  function toggle(index: number) {
    setOpen((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : multiple
          ? [...current, index]
          : [index],
    );
  }
  return (
    <div className="journey-accordion" data-mode={multiple ? 'multiple' : 'single'}>
      {items.map((item, index) => (
        <section key={item.title}>
          <h3>
            <button
              id={`${id}-trigger-${index}`}
              aria-expanded={open.includes(index)}
              aria-controls={`${id}-answer-${index}`}
              onClick={() => toggle(index)}
            >
              {item.title}
              <span aria-hidden="true">{open.includes(index) ? '−' : '+'}</span>
            </button>
          </h3>
          <AnimatePresence initial={false}>
            {open.includes(index) && (
              <motion.div
                id={`${id}-answer-${index}`}
                role="region"
                aria-labelledby={`${id}-trigger-${index}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.2 }}
                className="journey-answer"
              >
                <div>{item.description}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      ))}
    </div>
  );
}
