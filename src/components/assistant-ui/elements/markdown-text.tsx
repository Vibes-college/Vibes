'use client';
import { ui } from '@/lib/assistant/ui-text';

import '@assistant-ui/react-markdown/styles/dot.css';

import {
  type CodeHeaderProps,
  MarkdownTextPrimitive,
  unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
  useIsMarkdownCodeBlock,
} from '@assistant-ui/react-markdown';
import remarkGfm from 'remark-gfm';
import { type FC, memo, useMemo, useRef } from 'react';
import type { TextMessagePartProps } from '@assistant-ui/react';
import { CheckIcon, CopyIcon } from 'lucide-react';

import { TooltipIconButton } from '@/components/assistant-ui/elements/tooltip-icon-button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { cn } from '@/lib/utils';

type MarkdownTextProps = Partial<TextMessagePartProps> & {
  components?: Parameters<typeof memoizeMarkdownComponents>[0];
};

const useShallowStable = <T extends Record<string, unknown> | undefined>(value: T): T => {
  const ref = useRef(value);
  if (value !== ref.current) {
    const prev = ref.current;
    const stable =
      value !== undefined &&
      prev !== undefined &&
      Object.keys(prev).length === Object.keys(value).length &&
      Object.keys(value).every((key) => prev[key] === value[key]);
    if (!stable) ref.current = value;
  }
  return ref.current;
};

const MarkdownTextImpl: FC<MarkdownTextProps> = ({ components }) => {
  const stableComponents = useShallowStable(components);
  const markdownComponents = useMemo(() => {
    if (!stableComponents) return defaultComponents;
    return {
      ...defaultComponents,
      ...memoizeMarkdownComponents(stableComponents),
    };
  }, [stableComponents]);

  return (
    <MarkdownTextPrimitive
      remarkPlugins={[remarkGfm]}
      className="aui-md"
      components={markdownComponents}
      skipHtml
      defer
    />
  );
};

export const MarkdownText = memo(MarkdownTextImpl);

const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const onCopy = () => {
    if (!code || isCopied) return;
    copyToClipboard(code);
  };

  return (
    <div className="aui-code-header-root aui:border-border/50 aui:bg-muted/50 aui:mt-3 aui:flex aui:items-center aui:justify-between aui:rounded-t-xl aui:border aui:border-b-0 aui:px-3.5 aui:py-1.5 aui:text-xs">
      <span className="aui-code-header-language aui:text-muted-foreground aui:font-medium aui:lowercase">
        {language}
      </span>
      <TooltipIconButton tooltip={ui('Copy')} onClick={onCopy}>
        {!isCopied && (
          <CopyIcon className="aui:animate-in aui:zoom-in-75 aui:fade-in aui:duration-150" />
        )}
        {isCopied && (
          <CheckIcon className="aui:animate-in aui:zoom-in-50 aui:fade-in aui:duration-200 aui:ease-out" />
        )}
      </TooltipIconButton>
    </div>
  );
};

const defaultComponents = memoizeMarkdownComponents({
  img: ({ alt }) => <span>{alt}</span>,
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        'aui-md-h1 aui:mt-5 aui:mb-2 aui:scroll-m-20 aui:text-xl aui:font-semibold aui:first:mt-0 aui:last:mb-0',
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        'aui-md-h2 aui:mt-5 aui:mb-2 aui:scroll-m-20 aui:text-lg aui:font-semibold aui:first:mt-0 aui:last:mb-0',
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        'aui-md-h3 aui:mt-4 aui:mb-1.5 aui:scroll-m-20 aui:text-base aui:font-semibold aui:first:mt-0 aui:last:mb-0',
        className,
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn(
        'aui-md-h4 aui:mt-3.5 aui:mb-1 aui:scroll-m-20 aui:text-base aui:font-medium aui:first:mt-0 aui:last:mb-0',
        className,
      )}
      {...props}
    />
  ),
  h5: ({ className, ...props }) => (
    <h5
      className={cn(
        'aui-md-h5 aui:mt-3 aui:mb-1 aui:text-sm aui:font-semibold aui:first:mt-0 aui:last:mb-0',
        className,
      )}
      {...props}
    />
  ),
  h6: ({ className, ...props }) => (
    <h6
      className={cn(
        'aui-md-h6 aui:mt-3 aui:mb-1 aui:text-sm aui:font-medium aui:first:mt-0 aui:last:mb-0',
        className,
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn(
        'aui-md-p aui:my-3 aui:leading-relaxed aui:first:mt-0 aui:last:mb-0',
        className,
      )}
      {...props}
    />
  ),
  a: ({ className, href, ...props }) => (
    <a
      className={cn(
        'aui-md-a aui:text-primary aui:hover:text-primary/80 aui:underline aui:underline-offset-2',
        className,
      )}
      {...props}
      href={href && /^https?:\/\//i.test(href) ? href : undefined}
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="no-referrer"
    />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        'aui-md-blockquote aui:border-muted-foreground/30 aui:text-muted-foreground aui:my-3 aui:border-s-2 aui:ps-4',
        className,
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        'aui-md-ul aui:marker:text-muted-foreground aui:my-3 aui:ms-5 aui:list-disc aui:[&>li]:mt-1',
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        'aui-md-ol aui:marker:text-muted-foreground aui:my-3 aui:ms-5 aui:list-decimal aui:[&>li]:mt-1',
        className,
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn('aui-md-hr aui:border-muted-foreground/20 aui:my-3', className)} {...props} />
  ),
  table: ({ className, ...props }) => (
    <div className="aui-md-table-wrapper aui:my-3 aui:overflow-x-auto">
      <table
        className={cn(
          'aui-md-table aui:w-full aui:border-separate aui:border-spacing-0',
          className,
        )}
        {...props}
      />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        'aui-md-th aui:bg-muted aui:px-3 aui:py-1.5 aui:text-start aui:font-medium aui:first:rounded-ss-lg aui:last:rounded-se-lg aui:[[align=center]]:text-center aui:[[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        'aui-md-td aui:border-muted-foreground/20 aui:border-s aui:border-b aui:px-3 aui:py-1.5 aui:text-start aui:last:border-e aui:[[align=center]]:text-center aui:[[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),
  tr: ({ className, ...props }) => (
    <tr
      className={cn(
        'aui-md-tr aui:m-0 aui:border-b aui:p-0 aui:first:border-t aui:[&:last-child>td:first-child]:rounded-es-lg aui:[&:last-child>td:last-child]:rounded-ee-lg',
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn('aui-md-li aui:leading-relaxed', className)} {...props} />
  ),
  strong: ({ className, ...props }) => (
    <strong className={cn('aui-md-strong aui:font-semibold', className)} {...props} />
  ),
  sup: ({ className, ...props }) => (
    <sup
      className={cn('aui-md-sup aui:[&>a]:text-xs aui:[&>a]:no-underline', className)}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        'aui-md-pre aui:border-border/50 aui:bg-muted/30 aui:overflow-x-auto aui:rounded-t-none aui:rounded-b-xl aui:border aui:border-t-0 aui:p-3.5 aui:text-[13px] aui:leading-relaxed',
        className,
      )}
      {...props}
    />
  ),
  code: function Code({ className, ...props }) {
    const isCodeBlock = useIsMarkdownCodeBlock();
    return (
      <code
        className={cn(
          !isCodeBlock &&
            'aui-md-inline-code aui:bg-muted aui:rounded-md aui:px-1.5 aui:py-0.5 aui:font-mono aui:text-[0.85em]',
          className,
        )}
        {...props}
      />
    );
  },
  CodeHeader,
});
