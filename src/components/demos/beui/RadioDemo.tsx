// beUI preview: Copyright (c) 2026 Saurabh Chauhan, MIT. See /licenses/beui.txt.
import '../../beui/beui.css';

import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '../../beui/radio';

function RadioPreview() {
  const [plan, setPlan] = useState('pro');

  return (
    <RadioGroup value={plan} onValueChange={setPlan} className="min-w-48">
      <RadioGroupItem value="starter" label="Starter — free" />
      <RadioGroupItem value="pro" label="Pro — $12/mo" />
      <RadioGroupItem value="team" label="Team — $29/mo" />
      <RadioGroupItem value="legacy" label="Legacy plan" disabled />
    </RadioGroup>
  );
}

export default function RadioDemo() {
  return (
    <div className="beui-demo not-prose dark" data-article-interactive data-beui="RadioDemo">
      <RadioPreview />
    </div>
  );
}
