import { useState, useSyncExternalStore } from 'react';
import type { ToolCallMessagePartProps } from '@assistant-ui/react';
import type { AgentPermissionRequest } from '@getpaseo/protocol/agent-types';
import type { AssistantStore } from '../../lib/assistant/store';
import type { Labels } from '../../lib/assistant/labels';
import { questions } from '../../lib/assistant/questions';
import { ToolFallback } from '../assistant-ui/elements/tool-fallback.aui';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
export function QuestionForm({
  request,
  store,
  t,
  toolName,
  status,
  argsText,
}: ToolCallMessagePartProps & {
  request: AgentPermissionRequest;
  store: AssistantStore;
  t: Labels;
}) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const items = questions(request);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [free, setFree] = useState<Record<string, string>>({});
  const disabled =
    state.busy ||
    state.loading ||
    state.connection !== 'ready' ||
    state.unknown ||
    !!state.error?.endsWith('Unknown');
  const answered =
    items.length > 0 && items.every((q) => answers[q.header]?.length || free[q.header]?.trim());
  return (
    <ToolFallback.Root defaultOpen>
      <ToolFallback.Trigger toolName={toolName} status={status} />
      <ToolFallback.Content>
        <ToolFallback.Args argsText={argsText} />
        {!items.length && <p>{t.unsupported}</p>}
        <form
          className="aui:flex aui:flex-col aui:gap-4 aui:py-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!state.agent) return;
            void store.permission(state.agent.id, request.id, {
              behavior: 'allow',
              updatedInput: {
                ...request.input,
                answers: Object.fromEntries(
                  items.map((q) => [
                    q.header,
                    [...(answers[q.header] ?? []), free[q.header]?.trim()]
                      .filter(Boolean)
                      .join(', '),
                  ]),
                ),
              },
            });
          }}
        >
          {items.map((q) => (
            <fieldset key={q.header} disabled={disabled} className="aui:space-y-3">
              <legend className="aui:mb-2 aui:text-sm aui:font-medium">{q.question}</legend>
              {q.options.map((option, index) => (
                <div key={option.label} className="aui:flex aui:items-start aui:gap-2">
                  <Checkbox
                    id={`${request.id}-${q.header}-${index}`}
                    checked={(answers[q.header] ?? []).includes(option.label)}
                    onCheckedChange={(checked) => {
                      setAnswers({
                        ...answers,
                        [q.header]: q.multiSelect
                          ? checked
                            ? [...(answers[q.header] ?? []), option.label]
                            : (answers[q.header] ?? []).filter((value) => value !== option.label)
                          : checked
                            ? [option.label]
                            : [],
                      });
                      if (!q.multiSelect) setFree({ ...free, [q.header]: '' });
                    }}
                  />
                  <Label
                    htmlFor={`${request.id}-${q.header}-${index}`}
                    className="aui:flex aui:flex-col aui:items-start aui:gap-1"
                  >
                    {option.label}
                    {option.description && (
                      <span className="aui:font-normal aui:text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </Label>
                </div>
              ))}
              {q.free && (
                <Input
                  type={q.secret ? 'password' : 'text'}
                  aria-label={`${q.header}: ${t.freeAnswer}`}
                  value={free[q.header] ?? ''}
                  maxLength={4000}
                  onChange={(event) => {
                    setFree({ ...free, [q.header]: event.target.value });
                    if (!q.multiSelect) setAnswers({ ...answers, [q.header]: [] });
                  }}
                />
              )}
            </fieldset>
          ))}
          <div className="aui:flex aui:gap-2">
            <Button type="submit" size="sm" disabled={disabled || !answered}>
              {t.answer}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => {
                if (state.agent)
                  void store.permission(state.agent.id, request.id, {
                    behavior: 'deny',
                    message: 'User declined',
                  });
              }}
            >
              {t.deny}
            </Button>
          </div>
        </form>
      </ToolFallback.Content>
    </ToolFallback.Root>
  );
}
