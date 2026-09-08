import { useEffect, useRef, useState } from 'react';
import type { PaseoAgentProvider } from '@getpaseo/client';
import type { AssistantStore, AssistantState } from '../../lib/assistant/store';
import type { Labels } from '../../lib/assistant/labels';
import { ModelSelector } from '../assistant-ui/elements/model-selector.aui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
export function SessionForm({
  store,
  state,
  t,
  open,
  onOpenChange,
}: {
  store: AssistantStore;
  state: AssistantState;
  t: Labels;
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const [cwd, setCwd] = useState(state.agent?.cwd ?? '');
  const [provider, setProvider] = useState<PaseoAgentProvider | ''>('');
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    generation.current++;
    setModels([]);
    setModel('');
    setLoading(false);
    if (open) setCwd(state.agent?.cwd ?? '');
  }, [open]);
  const invalidate = () => {
    generation.current++;
    setModels([]);
    setModel('');
    setLoading(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.newSession}</DialogTitle>
          <DialogDescription>{t.directoryHelp}</DialogDescription>
        </DialogHeader>
        <form
          className="aui:flex aui:flex-col aui:gap-5"
          onSubmit={async (event) => {
            event.preventDefault();
            const before = store.getSnapshot().selectedId;
            await store.create(`${provider}/${model}`, cwd);
            if (store.getSnapshot().selectedId !== before) onOpenChange(false);
          }}
        >
          {!state.providers.length && <p>{t.noProviders}</p>}
          <div className="aui:space-y-2">
            <Label>{t.provider}</Label>
            <Select
              value={provider}
              onValueChange={(value) => {
                invalidate();
                setProvider(value as PaseoAgentProvider);
              }}
            >
              <SelectTrigger aria-label={t.provider} className="aui:w-full">
                <SelectValue placeholder={t.provider} />
              </SelectTrigger>
              <SelectContent>
                {state.providers.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="aui:space-y-2">
            <Label htmlFor="assistant-cwd">{t.directory}</Label>
            <Input
              id="assistant-cwd"
              required
              value={cwd}
              placeholder="/Users/name/project"
              maxLength={2000}
              onChange={(event) => {
                invalidate();
                setCwd(event.target.value);
              }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!provider || !cwd.trim() || loading || state.busy}
            onClick={async () => {
              if (!provider) return;
              const token = ++generation.current;
              setLoading(true);
              try {
                const result = await store.models(provider, cwd);
                if (token !== generation.current) return;
                if (result.error) throw new Error('models');
                setModels(
                  (result.models ?? []).map((value) => ({ id: value.id, name: value.label })),
                );
                setModel(result.models?.[0]?.id ?? '');
              } catch {
                if (token === generation.current) store.report('models');
              } finally {
                if (token === generation.current) setLoading(false);
              }
            }}
          >
            {t.models}
          </Button>
          {!!models.length && (
            <div className="aui:space-y-2">
              <Label>{t.model}</Label>
              <ModelSelector
                models={models}
                value={model}
                onValueChange={setModel}
                searchable
                variant="outline"
                className="aui:w-full"
              />
            </div>
          )}
          <Button
            type="submit"
            disabled={!model || state.busy || loading || state.connection !== 'ready'}
          >
            {t.create}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
