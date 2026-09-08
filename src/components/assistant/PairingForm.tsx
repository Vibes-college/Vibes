import { useState } from 'react';
import type { AssistantStore } from '../../lib/assistant/store';
import type { Labels } from '../../lib/assistant/labels';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
export function PairingForm({ store, t }: { store: AssistantStore; t: Labels }) {
  const [pairing, setPairing] = useState('');
  const [remember, setRemember] = useState(false);
  return (
    <form
      className="aui:mx-auto aui:flex aui:w-full aui:max-w-md aui:flex-1 aui:flex-col aui:justify-center aui:gap-5 aui:overflow-y-auto aui:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        void store.pair(pairing, remember);
        setPairing('');
      }}
    >
      <div className="aui:space-y-2">
        <h2 className="aui:text-xl aui:font-semibold">{t.connect}</h2>
        <p className="aui:text-sm aui:text-muted-foreground">{t.intro}</p>
      </div>
      <p className="aui:text-sm aui:text-muted-foreground">
        {t.setup}{' '}
        <a
          className="aui:underline aui:underline-offset-4"
          href="https://paseo.sh/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.install}
        </a>
      </p>
      <div className="aui:space-y-2">
        <Label htmlFor="assistant-pairing">{t.pairing}</Label>
        <Textarea
          id="assistant-pairing"
          required
          value={pairing}
          onChange={(event) => setPairing(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          maxLength={10000}
        />
      </div>
      <div className="aui:flex aui:items-center aui:gap-2">
        <Checkbox
          id="assistant-remember"
          checked={remember}
          onCheckedChange={(value) => setRemember(value === true)}
        />
        <Label htmlFor="assistant-remember">{t.remember}</Label>
      </div>
      <p className="aui:text-xs aui:text-muted-foreground">{t.private}</p>
      <Button type="submit">{t.connect}</Button>
    </form>
  );
}
