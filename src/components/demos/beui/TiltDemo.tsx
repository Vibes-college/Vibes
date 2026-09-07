// beUI preview: Copyright (c) 2026 Saurabh Chauhan, MIT. See /licenses/beui.txt.
import '../../beui/beui.css';

import { TiltCard } from '../../beui/tilt-card';

function TiltCardPreview() {
  return (
    <div className="flex items-center justify-center p-6">
      <TiltCard className="w-[280px] border border-border bg-card p-8">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Premium</div>
        <h3 className="mt-2 text-2xl font-semibold text-foreground">Tilt me</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          Move your cursor across the card to see 3D tilt + glare.
        </p>
      </TiltCard>
    </div>
  );
}

export default function TiltDemo() {
  return (
    <div className="beui-demo not-prose dark" data-article-interactive data-beui="TiltDemo">
      <TiltCardPreview />
    </div>
  );
}
