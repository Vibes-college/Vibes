// beUI preview: Copyright (c) 2026 Saurabh Chauhan, MIT. See /licenses/beui.txt.
import '../../beui/beui.css';

import { useState } from 'react';

import { RangeSlider } from '../../beui/range-slider';

function RangeSliderPreview() {
  const [value, setValue] = useState(40);

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Drag the handle</span>
        <span className="tabular-nums text-foreground">{value}</span>
      </div>
      <RangeSlider value={value} onValueChange={setValue} step={5} aria-label="Value" />
    </div>
  );
}

export default function RangeDemo() {
  return (
    <div
      className="beui-demo not-prose dark beui-demo--compact"
      data-article-interactive
      data-beui="RangeDemo"
    >
      <RangeSliderPreview />
    </div>
  );
}
