// beUI preview: Copyright (c) 2026 Saurabh Chauhan, MIT. See /licenses/beui.txt.
import '../../beui/beui.css';

import { useState } from 'react';
import { Switch } from '../../beui/switch';

function SwitchPreview() {
  const [on, setOn] = useState(true);
  return (
    <div className="flex flex-col gap-3">
      <Switch checked={on} onCheckedChange={setOn} label="Enable notifications" />
      <Switch checked={false} onCheckedChange={() => {}} label="Off" />
      <Switch checked disabled onCheckedChange={() => {}} label="Disabled" />
    </div>
  );
}

export default function SwitchDemo() {
  return (
    <div className="beui-demo not-prose dark" data-article-interactive data-beui="SwitchDemo">
      <SwitchPreview />
    </div>
  );
}
