// beUI preview: Copyright (c) 2026 Saurabh Chauhan, MIT. See /licenses/beui.txt.
import '../../beui/beui.css';

import { ArrowUpRight, Sparkles } from 'lucide-react';
import { MetallicButton } from '../../beui/metallic-button';

function ButtonMetallicPreview() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 px-6 py-10">
      <MetallicButton>
        Continue
        <ArrowUpRight className="size-4" />
      </MetallicButton>
      <MetallicButton size="sm">
        <Sparkles className="size-3.5" />
        Generate
      </MetallicButton>
      <MetallicButton size="icon" aria-label="Magic tools">
        <Sparkles className="size-4" />
      </MetallicButton>
    </div>
  );
}

export default function ButtonDemo() {
  return (
    <div
      className="beui-demo not-prose dark beui-demo--compact"
      data-article-interactive
      data-beui="ButtonDemo"
    >
      <ButtonMetallicPreview />
    </div>
  );
}
