import * as motion from 'motion/react-m';
import { useRef } from 'react';
import { useScroll, useTransform, type MotionValue } from 'motion/react';

// Adapted from Great UI/TextReveal.tsx, eda1b85e: same scroll/range relationship,
// readable base text, grapheme-safe Chinese/emoji, and a static reduced-motion path.
function Glyph({
  text,
  progress,
  start,
  end,
}: {
  text: string;
  progress: MotionValue<number>;
  start: number;
  end: number;
}) {
  const opacity = useTransform(progress, [start, end], [0.65, 1]);
  const color = useTransform(
    progress,
    [start, (start + end) / 2, end],
    ['#75816a', '#7b925d', '#293522'],
  );
  return <motion.span style={{ opacity, color }}>{text}</motion.span>;
}

export function TextReveal({ text, reduced }: { text: string; reduced: boolean }) {
  const target = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target, offset: ['start 0.85', 'end 0.5'] });
  const glyphs = Array.from(
    new Intl.Segmenter('zh', { granularity: 'grapheme' }).segment(text),
    (part) => part.segment,
  );
  return (
    <p ref={target} className="journey-intro" data-effect={reduced ? 'static' : 'scroll-reveal'}>
      {reduced ? (
        text
      ) : (
        <>
          <span className="sr-only">{text}</span>
          <span aria-hidden="true">
            {glyphs.map((glyph, index) => (
              <Glyph
                key={index}
                text={glyph}
                progress={scrollYProgress}
                start={index / glyphs.length}
                end={(index + 1) / glyphs.length}
              />
            ))}
          </span>
        </>
      )}
    </p>
  );
}
