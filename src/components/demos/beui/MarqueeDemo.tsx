// beUI preview: Copyright (c) 2026 Saurabh Chauhan, MIT. See /licenses/beui.txt.
import '../../beui/beui.css';

import { Marquee } from '../../beui/marquee';

const logos = ['Vercel', 'Linear', 'Stripe', 'Figma', 'GitHub', 'Notion', 'Loom', 'Raycast'];

function MarqueePreview() {
  return (
    <div className="w-full">
      <Marquee speed={25}>
        {logos.map((l) => (
          <div
            key={l}
            className="mx-4 flex h-12 items-center justify-center rounded-lg border border-border bg-card px-6 text-sm font-medium text-foreground"
          >
            {l}
          </div>
        ))}
      </Marquee>
    </div>
  );
}

export default function MarqueeDemo() {
  return (
    <div className="beui-demo not-prose dark" data-article-interactive data-beui="MarqueeDemo">
      <MarqueePreview />
    </div>
  );
}
