'use client';
import { ui } from '@/lib/assistant/ui-text';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  createContext,
  useContext,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';

export type ModelSelectorEffortOption = {
  id: string;
  name: string;
};

export const DEFAULT_EFFORT_OPTIONS: readonly ModelSelectorEffortOption[] = [
  { id: 'low', name: 'Low' },
  { id: 'medium', name: 'Med' },
  { id: 'high', name: 'High' },
];

export type ModelOption = {
  id: string;
  name: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
  /** Extra terms matched by ModelSelector.Search, in addition to id and name. */
  keywords?: readonly string[];
  /**
   * Reasoning effort levels the model supports. Pass `true` for the default
   * low/medium/high levels, or a custom list. Omit for models without
   * configurable reasoning.
   */
  efforts?: boolean | readonly ModelSelectorEffortOption[];
};

function getModelEfforts(
  model: ModelOption | undefined,
): readonly ModelSelectorEffortOption[] | undefined {
  if (!model?.efforts) return undefined;
  return model.efforts === true ? DEFAULT_EFFORT_OPTIONS : model.efforts;
}

function resolveEffort(
  efforts: readonly ModelSelectorEffortOption[] | undefined,
  effort: string | undefined,
): string | undefined {
  if (effort === undefined) return undefined;
  return efforts?.some((e) => e.id === effort) ? effort : undefined;
}

/**
 * Returns the effort id if the given model supports it, otherwise undefined.
 * Effort selection is kept sticky across model switches; this resolves what
 * actually applies to the current model.
 */
export function resolveModelEffort(
  models: readonly ModelOption[],
  modelId: string | undefined,
  effort: string | undefined,
): string | undefined {
  return resolveEffort(getModelEfforts(models.find((m) => m.id === modelId)), effort);
}

function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: {
  prop: T | undefined;
  defaultProp: T | undefined;
  onChange: ((next: T) => void) | undefined;
}) {
  const [internal, setInternal] = useState(defaultProp);
  const isControlled = prop !== undefined;
  const value = isControlled ? prop : internal;
  // Read onChange through a ref so inline callbacks don't recreate the setter
  // (and with it the memoized context value) every render.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next);
      onChangeRef.current?.(next);
    },
    [isControlled],
  );
  return [value, setValue] as const;
}

type ModelSelectorContextValue = {
  models: readonly ModelOption[];
  value: string | undefined;
  setValue: (value: string) => void;
  /** The model matching `value`, derived once for all sub-components. */
  selectedModel: ModelOption | undefined;
  /** The selected model's effort levels, undefined when not configurable. */
  efforts: readonly ModelSelectorEffortOption[] | undefined;
  /** Effort resolved against the selected model's supported levels. */
  effort: string | undefined;
  setEffort: (effort: string) => void;
  setOpen: (open: boolean) => void;
};

const ModelSelectorContext = createContext<ModelSelectorContextValue | null>(null);

export function useModelSelectorContext() {
  const ctx = useContext(ModelSelectorContext);
  if (!ctx) {
    throw new Error('ModelSelector sub-components must be used within ModelSelector.Root');
  }
  return ctx;
}

/**
 * The selected model's effort levels and the active selection. Use it to build
 * a custom effort UI inside ModelSelector.Content (e.g. a slider or a shadcn
 * DropdownMenu) when the built-in ModelSelector.Effort layout doesn't fit.
 * `efforts` is undefined for models without configurable reasoning.
 */
export function useModelSelectorEfforts(): {
  efforts: readonly ModelSelectorEffortOption[] | undefined;
  effort: string | undefined;
  setEffort: (effort: string) => void;
} {
  const { efforts, effort, setEffort } = useModelSelectorContext();
  return { efforts, effort, setEffort };
}

export type ModelSelectorRootProps = {
  models: readonly ModelOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  effort?: string;
  defaultEffort?: string;
  onEffortChange?: (effort: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

function ModelSelectorRoot({
  models,
  value: valueProp,
  defaultValue,
  onValueChange,
  effort: effortProp,
  defaultEffort,
  onEffortChange,
  open: openProp,
  defaultOpen,
  onOpenChange,
  children,
}: ModelSelectorRootProps) {
  const [value, setValue] = useControllableState({
    prop: valueProp,
    defaultProp: defaultValue ?? models[0]?.id,
    onChange: onValueChange,
  });
  const [effort, setEffort] = useControllableState({
    prop: effortProp,
    defaultProp: defaultEffort,
    onChange: onEffortChange,
  });
  const [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? false,
    onChange: onOpenChange,
  });

  const selectedModel = models.find((m) => m.id === value);
  const efforts = getModelEfforts(selectedModel);
  const activeEffort = resolveEffort(efforts, effort);
  const contextValue = useMemo(
    () => ({
      models,
      value,
      setValue,
      selectedModel,
      efforts,
      effort: activeEffort,
      setEffort,
      setOpen,
    }),
    [models, value, setValue, selectedModel, efforts, activeEffort, setEffort, setOpen],
  );

  return (
    <ModelSelectorContext.Provider value={contextValue}>
      <Popover open={open ?? false} onOpenChange={setOpen}>
        {children}
      </Popover>
    </ModelSelectorContext.Provider>
  );
}

export const modelSelectorTriggerVariants = cva(
  'aui:focus-visible:ring-ring/50 aui:flex aui:w-fit aui:items-center aui:justify-between aui:gap-2 aui:overflow-hidden aui:rounded-md aui:text-sm aui:whitespace-nowrap aui:transition-colors aui:outline-none aui:focus-visible:ring-1 aui:disabled:cursor-not-allowed aui:disabled:opacity-50 aui:[&_svg]:pointer-events-none aui:[&_svg]:shrink-0 aui:[&_svg:not([class*=size-])]:size-3.5',
  {
    variants: {
      variant: {
        outline:
          'aui:border-input aui:hover:bg-accent aui:hover:text-accent-foreground aui:border aui:bg-transparent',
        ghost: 'aui:hover:bg-accent aui:hover:text-accent-foreground',
        muted: 'aui:bg-secondary aui:text-secondary-foreground aui:hover:bg-secondary/80',
      },
      size: {
        default: 'aui:h-9 aui:px-3 aui:py-2',
        sm: 'aui:h-8 aui:px-2.5 aui:py-1.5 aui:text-xs',
        lg: 'aui:h-10 aui:px-4 aui:py-2.5',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'default',
    },
  },
);

export type ModelSelectorTriggerProps = ComponentPropsWithoutRef<typeof PopoverTrigger> &
  VariantProps<typeof modelSelectorTriggerVariants>;

function ModelSelectorTrigger({
  className,
  variant,
  size,
  children,
  onKeyDown,
  ...props
}: ModelSelectorTriggerProps) {
  const { setOpen } = useModelSelectorContext();

  return (
    <PopoverTrigger
      data-slot="model-selector-trigger"
      data-variant={variant ?? 'outline'}
      data-size={size ?? 'default'}
      role="combobox"
      aria-haspopup="listbox"
      className={cn(modelSelectorTriggerVariants({ variant, size }), className)}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        // ARIA combobox: arrows open the listbox from a focused trigger.
        // Popover leaves this to the consumer.
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          setOpen(true);
        }
      }}
      {...props}
    >
      {children ?? <ModelSelectorValue />}
      <ChevronDownIcon className="aui:size-4 aui:opacity-50" />
    </PopoverTrigger>
  );
}

export type ModelSelectorValueProps = {
  placeholder?: ReactNode;
  /** Show the active effort level next to the model name. */
  showEffort?: boolean;
  className?: string;
};

function ModelIcon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'aui:flex aui:size-3.5 aui:shrink-0 aui:items-center aui:justify-center aui:[&_svg]:size-3.5',
        className,
      )}
    >
      {children}
    </span>
  );
}

function ModelSelectorValue({
  placeholder = ui('Select model'),
  showEffort = true,
  className,
}: ModelSelectorValueProps) {
  const { selectedModel, efforts, effort } = useModelSelectorContext();

  if (!selectedModel) {
    return (
      <span data-slot="model-selector-value" className={cn('aui:text-muted-foreground', className)}>
        {placeholder}
      </span>
    );
  }

  const effortName =
    showEffort && effort !== undefined ? efforts?.find((e) => e.id === effort)?.name : undefined;

  return (
    <span
      data-slot="model-selector-value"
      className={cn('aui:flex aui:min-w-0 aui:items-center aui:gap-2', className)}
    >
      {selectedModel.icon && <ModelIcon>{selectedModel.icon}</ModelIcon>}
      <span className="aui:truncate aui:font-medium">{selectedModel.name}</span>
      {effortName && (
        <span className="aui:text-muted-foreground aui:min-w-7.5 aui:truncate aui:text-center">
          {effortName}
        </span>
      )}
    </span>
  );
}

export type ModelSelectorContentProps = Omit<
  ComponentPropsWithoutRef<typeof PopoverContent>,
  'side'
> & {
  /**
   * Preferred side for the initial placement. Once the popover is open, the
   * rendered side takes over until it closes, so the popup does not jump
   * between sides while filtering resizes the list.
   */
  side?: ComponentPropsWithoutRef<typeof PopoverContent>['side'];
  searchable?: boolean;
};

// The popover re-evaluates collision flipping whenever the popup resizes, so
// filtering the list down flips the popup back to the preferred side
// mid-interaction. Feed the rendered side back as the preferred side, making
// the popup keep its side until it no longer fits.
function useLazyFlipSide(): {
  side: ModelSelectorContentProps['side'];
  popupRef: (node: HTMLDivElement | null) => void;
} {
  const [side, setSide] = useState<ModelSelectorContentProps['side']>();
  const observerRef = useRef<MutationObserver | null>(null);
  const popupRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) {
      setSide(undefined);
      return;
    }
    const sync = () => {
      const rendered = node.getAttribute('data-side');
      if (rendered) setSide(rendered as ModelSelectorContentProps['side']);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(node, {
      attributes: true,
      attributeFilter: ['data-side'],
    });
    observerRef.current = observer;
  }, []);
  return { side, popupRef };
}

/**
 * Hidden input that anchors cmdk's keyboard navigation, keeping the list
 * keyboard-operable without a visible search box. ModelSelectorContent renders
 * one automatically when unfiltered.
 */
function ModelSelectorFocusAnchor() {
  return (
    <div className="aui:sr-only">
      <CommandInput readOnly aria-label={ui('Model')} />
    </div>
  );
}

function ModelSelectorContent({
  className,
  align = 'start',
  side,
  sideOffset = 6,
  searchable,
  children,
  ...props
}: ModelSelectorContentProps) {
  const { value } = useModelSelectorContext();
  const { side: renderedSide, popupRef } = useLazyFlipSide();
  const unfiltered = searchable === false || (!searchable && children === undefined);

  return (
    <PopoverContent
      ref={popupRef}
      data-slot="model-selector-content"
      align={align}
      side={renderedSide ?? side ?? 'bottom'}
      sideOffset={sideOffset}
      className={cn(
        'aui:bg-popover aui:w-72 aui:min-w-(--radix-popover-trigger-width) aui:overflow-hidden aui:rounded-xl aui:p-0',
        className,
      )}
      {...props}
    >
      <Command
        className="aui:bg-transparent"
        shouldFilter={!unfiltered}
        {...(value !== undefined ? { defaultValue: value } : {})}
      >
        {unfiltered && <ModelSelectorFocusAnchor />}
        {children ?? (
          <>
            {searchable && <ModelSelectorSearch />}
            <ModelSelectorList />
            <ModelSelectorEffort />
          </>
        )}
      </Command>
    </PopoverContent>
  );
}

export type ModelSelectorSearchProps = ComponentPropsWithoutRef<typeof CommandInput>;

function ModelSelectorSearch({
  placeholder = ui('Search models...'),
  ...props
}: ModelSelectorSearchProps) {
  return <CommandInput data-slot="model-selector-search" placeholder={placeholder} {...props} />;
}

export type ModelSelectorListProps = ComponentPropsWithoutRef<typeof CommandList>;

function ModelSelectorList({ className, children, ...props }: ModelSelectorListProps) {
  const { models } = useModelSelectorContext();

  return (
    <CommandList
      data-slot="model-selector-list"
      className={cn(
        'aui:[-ms-overflow-style:none] aui:[scrollbar-width:none] aui:[&::-webkit-scrollbar]:hidden',
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <ModelSelectorEmpty />
          <CommandGroup>
            {models.map((model) => (
              <ModelSelectorItem key={model.id} model={model} />
            ))}
          </CommandGroup>
        </>
      )}
    </CommandList>
  );
}

export type ModelSelectorEmptyProps = ComponentPropsWithoutRef<typeof CommandEmpty>;

function ModelSelectorEmpty({ children, ...props }: ModelSelectorEmptyProps) {
  return (
    <CommandEmpty data-slot="model-selector-empty" {...props}>
      {children ?? ui('No models found.')}
    </CommandEmpty>
  );
}

export type ModelSelectorGroupProps = ComponentPropsWithoutRef<typeof CommandGroup>;

function ModelSelectorGroup(props: ModelSelectorGroupProps) {
  return <CommandGroup data-slot="model-selector-group" {...props} />;
}

export type ModelSelectorSeparatorProps = ComponentPropsWithoutRef<typeof CommandSeparator>;

function ModelSelectorSeparator(props: ModelSelectorSeparatorProps) {
  return <CommandSeparator data-slot="model-selector-separator" {...props} />;
}

export type ModelSelectorItemProps = Omit<ComponentPropsWithoutRef<typeof CommandItem>, 'value'> & {
  model: ModelOption;
};

function ModelSelectorItem({
  model,
  className,
  children,
  onSelect,
  ...props
}: ModelSelectorItemProps) {
  const { value, setValue, setOpen } = useModelSelectorContext();
  const isSelected = value === model.id;

  return (
    <CommandItem
      data-slot="model-selector-item"
      value={model.id}
      keywords={[model.name, ...(model.keywords ?? [])]}
      {...(model.disabled ? { disabled: true } : undefined)}
      onSelect={(selectedValue) => {
        setValue(model.id);
        setOpen(false);
        onSelect?.(selectedValue);
      }}
      className={cn(
        'aui:relative aui:items-start aui:gap-2 aui:rounded-lg aui:py-2 aui:ps-3 aui:pe-9 aui:[&_svg:not([class*=size-])]:size-3.5',
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          {model.icon && <ModelIcon className="aui:mt-[3px]">{model.icon}</ModelIcon>}
          <span className="aui:flex aui:min-w-0 aui:flex-col">
            <span className="aui:truncate aui:font-medium">{model.name}</span>
            {model.description && (
              <span className="aui:text-muted-foreground aui:truncate aui:text-xs">
                {model.description}
              </span>
            )}
          </span>
        </>
      )}
      {isSelected && (
        <span className="aui:absolute aui:end-3 aui:top-2.5 aui:flex aui:size-4 aui:items-center aui:justify-center">
          <CheckIcon className="aui:size-4" />
        </span>
      )}
    </CommandItem>
  );
}

export type ModelSelectorEffortProps = ComponentPropsWithoutRef<'div'> & {
  label?: ReactNode;
};

function ModelSelectorEffort({
  label = ui('Thinking'),
  className,
  onKeyDown,
  ...props
}: ModelSelectorEffortProps) {
  const { efforts, effort, setEffort } = useModelSelectorEfforts();

  if (!efforts?.length) return null;

  return (
    <div
      data-slot="model-selector-effort"
      className={cn(
        'aui:flex aui:cursor-default aui:items-center aui:justify-between aui:gap-3 aui:border-t aui:px-3 aui:py-2',
        className,
      )}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        // cmdk's Command root claims Home/End to jump the model list; stop
        // them here so only the radiogroup reacts.
        if (e.key === 'Home' || e.key === 'End') e.stopPropagation();
        // Vertical arrows refocus cmdk's input before the event bubbles to
        // the Command root: the same keypress then moves the list highlight,
        // and Enter selects again (cmdk's Enter is inert while a radio has
        // focus, so the highlight would otherwise move with no way to act).
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.currentTarget
            .closest('[cmdk-root]')
            ?.querySelector<HTMLInputElement>('[cmdk-input]')
            ?.focus();
        }
      }}
      {...props}
    >
      <span className="aui:text-muted-foreground aui:text-xs">{label}</span>
      <RadioGroupPrimitive.Root
        value={effort ?? ''}
        onValueChange={setEffort}
        orientation="horizontal"
        aria-label={typeof label === 'string' ? label : 'Reasoning effort'}
        className="aui:flex aui:items-center aui:gap-0.5"
      >
        {efforts.map((option) => (
          <RadioGroupPrimitive.Item
            key={option.id}
            value={option.id}
            className={cn(
              'aui:focus-visible:ring-ring/50 aui:text-muted-foreground aui:hover:bg-muted aui:hover:text-foreground aui:cursor-pointer aui:rounded-md aui:px-2 aui:py-1 aui:text-xs aui:transition-colors aui:outline-none aui:focus-visible:ring-1',
              'aui:data-[state=checked]:bg-accent aui:data-[state=checked]:text-accent-foreground aui:data-[state=checked]:font-medium',
            )}
          >
            {option.name}
          </RadioGroupPrimitive.Item>
        ))}
      </RadioGroupPrimitive.Root>
    </div>
  );
}

export type ModelSelectorProps = Omit<ModelSelectorRootProps, 'children'> &
  VariantProps<typeof modelSelectorTriggerVariants> & {
    /** Render a search input above the model list. */
    searchable?: boolean;
    /** Alignment of the dropdown relative to the trigger. Use `"end"` when the
     * trigger sits at the right edge of its container. */
    align?: ModelSelectorContentProps['align'];
    className?: string;
    contentClassName?: string;
  };

export {
  ModelSelectorRoot,
  ModelSelectorTrigger,
  ModelSelectorValue,
  ModelSelectorContent,
  ModelSelectorSearch,
  ModelSelectorFocusAnchor,
  ModelSelectorList,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorSeparator,
  ModelSelectorItem,
  ModelSelectorEffort,
};
