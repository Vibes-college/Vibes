'use client';

import { memo, useState, type ComponentProps } from 'react';
import { FileTextIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { SourceMessagePartComponent } from '@assistant-ui/react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const sourceVariants = cva(
  'aui:inline-flex aui:items-center aui:justify-center aui:gap-1 aui:rounded-md aui:text-xs aui:font-medium aui:transition-colors aui:[&_svg]:size-3 aui:[&_svg]:shrink-0',
  {
    variants: {
      variant: {
        outline:
          'aui:border-input aui:text-muted-foreground aui:[a&]:hover:bg-accent aui:[a&]:hover:text-accent-foreground aui:border aui:bg-transparent',
        secondary: 'aui:bg-secondary aui:text-secondary-foreground aui:[a&]:hover:bg-secondary/80',
        muted:
          'aui:bg-muted aui:text-muted-foreground aui:[a&]:hover:bg-muted/80 aui:[a&]:hover:text-foreground',
        ghost:
          'aui:text-muted-foreground aui:[a&]:hover:bg-accent aui:[a&]:hover:text-accent-foreground aui:bg-transparent',
        info: 'aui:bg-blue-100 aui:text-blue-700 aui:dark:bg-blue-900/50 aui:dark:text-blue-300 aui:[a&]:hover:bg-blue-100/80',
        warning:
          'aui:bg-amber-100 aui:text-amber-700 aui:dark:bg-amber-900/50 aui:dark:text-amber-300 aui:[a&]:hover:bg-amber-100/80',
        success:
          'aui:bg-emerald-100 aui:text-emerald-700 aui:dark:bg-emerald-900/50 aui:dark:text-emerald-300 aui:[a&]:hover:bg-emerald-100/80',
        destructive:
          'aui:bg-red-100 aui:text-red-700 aui:dark:bg-red-900/50 aui:dark:text-red-300 aui:[a&]:hover:bg-red-100/80',
      },
      size: {
        sm: 'aui:px-1.5 aui:py-0.5',
        default: 'aui:px-2 aui:py-1',
        lg: 'aui:px-2.5 aui:py-1.5 aui:text-sm',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'default',
    },
  },
);

const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const defaultFaviconUrl = (domain: string) => `https://icons.duckduckgo.com/ip3/${domain}.ico`;

function SourceIcon({
  url,
  className,
  faviconUrl = defaultFaviconUrl,
  ...props
}: ComponentProps<'span'> & {
  url: string;
  faviconUrl?: (domain: string) => string;
}) {
  const domain = extractDomain(url);
  const src = faviconUrl(domain);
  const [errorSrc, setErrorSrc] = useState<string | undefined>(undefined);
  const hasError = errorSrc === src;

  if (hasError) {
    return (
      <span
        data-slot="source-icon-fallback"
        className={cn(
          'aui:bg-muted aui:flex aui:size-3 aui:shrink-0 aui:items-center aui:justify-center aui:rounded-sm aui:text-[10px] aui:font-medium',
          className,
        )}
        {...props}
      >
        {domain.charAt(0).toUpperCase() || '?'}
      </span>
    );
  }

  return (
    <img
      data-slot="source-icon"
      src={src}
      alt=""
      className={cn('aui:size-3 aui:shrink-0 aui:rounded-sm', className)}
      onError={() => setErrorSrc(src)}
      {...(props as ComponentProps<'img'>)}
      // A server-rendered image that fails before hydration never fires onError.
      ref={(el) => {
        if (el?.complete && el.naturalWidth === 0) setErrorSrc(src);
      }}
    />
  );
}

function SourceTitle({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="source-title"
      className={cn('aui:max-w-37.5 aui:truncate', className)}
      {...props}
    />
  );
}

function DocumentSourceIcon({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="source-document-icon"
      className={cn(
        'aui:text-muted-foreground aui:flex aui:size-3 aui:shrink-0 aui:items-center aui:justify-center',
        className,
      )}
      {...props}
    >
      <FileTextIcon className="aui:size-3" />
    </span>
  );
}

export type SourceProps = ComponentProps<'a'> & VariantProps<typeof sourceVariants>;

function Source({
  className,
  variant,
  size,
  target = '_blank',
  rel = 'noopener noreferrer',
  ...props
}: SourceProps) {
  return (
    <a
      data-slot="source"
      className={cn(
        sourceVariants({ variant, size }),
        'aui:focus-visible:border-ring aui:focus-visible:ring-ring/50 aui:cursor-pointer aui:outline-none aui:focus-visible:ring-1',
        className,
      )}
      target={target}
      rel={rel}
      {...props}
    />
  );
}

const SourcesImpl: SourceMessagePartComponent = (part) => {
  if (part.sourceType === 'url' && part.url) {
    const domain = extractDomain(part.url);
    const displayTitle = part.title || domain;

    return (
      <Source href={part.url}>
        <SourceIcon url={part.url} />
        <SourceTitle>{displayTitle}</SourceTitle>
      </Source>
    );
  }

  if (part.sourceType === 'document') {
    return (
      <Badge
        variant="secondary"
        className="aui:focus-visible:border-ring aui:focus-visible:ring-ring/50 aui:outline-none aui:focus-visible:ring-1"
      >
        <span data-slot="source" className="aui:inline-flex aui:items-center aui:gap-1.5">
          <DocumentSourceIcon />
          <SourceTitle>{part.title}</SourceTitle>
        </span>
      </Badge>
    );
  }

  return null;
};

const Sources = memo(SourcesImpl) as unknown as SourceMessagePartComponent & {
  Root: typeof Source;
  Icon: typeof SourceIcon;
  Title: typeof SourceTitle;
};

Sources.displayName = 'Sources';
Sources.Root = Source;
Sources.Icon = SourceIcon;
Sources.Title = SourceTitle;

export { Sources, Source, SourceIcon, SourceTitle, sourceVariants };
