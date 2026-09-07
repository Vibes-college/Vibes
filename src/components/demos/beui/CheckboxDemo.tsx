// beUI preview: Copyright (c) 2026 Saurabh Chauhan, MIT. See /licenses/beui.txt.
import '../../beui/beui.css';

import { useState } from 'react';
import { Checkbox } from '../../beui/checkbox';

function CheckboxPreview() {
  const [terms, setTerms] = useState(true);
  const [updates, setUpdates] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Checkbox checked={terms} onCheckedChange={setTerms} label="Accept terms and conditions" />
      <Checkbox checked={updates} onCheckedChange={setUpdates} label="Email me product updates" />
      <Checkbox checked indeterminate onCheckedChange={() => {}} label="Select all (partial)" />
      <Checkbox checked disabled onCheckedChange={() => {}} label="Disabled" />
    </div>
  );
}

export default function CheckboxDemo() {
  return (
    <div className="beui-demo not-prose dark" data-article-interactive data-beui="CheckboxDemo">
      <CheckboxPreview />
    </div>
  );
}
