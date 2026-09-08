'use client';

import { type PropsWithChildren, useState, type FC, isValidElement } from 'react';
import { XIcon, PlusIcon, FileText, Loader2Icon, AlertCircleIcon } from 'lucide-react';
import {
  AttachmentPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  useAuiState,
  useAui,
} from '@assistant-ui/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogTitle, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TooltipIconButton } from '@/components/assistant-ui/elements/tooltip-icon-button';
import { useAttachmentSrc } from '@/hooks/use-attachment-src';
import { cn } from '@/lib/utils';

type AttachmentPreviewProps = {
  src: string;
};

const AttachmentPreview: FC<AttachmentPreviewProps> = ({ src }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <img
      src={src}
      alt="Attachment preview"
      className={cn(
        'aui:block aui:h-auto aui:max-h-[80vh] aui:w-auto aui:max-w-full aui:rounded-sm aui:object-contain aui:transition-opacity aui:duration-300 aui:motion-reduce:transition-none',
        isLoaded
          ? 'aui-attachment-preview-image-loaded aui:opacity-100'
          : 'aui-attachment-preview-image-loading aui:opacity-0',
      )}
      onLoad={() => setIsLoaded(true)}
    />
  );
};

const AttachmentPreviewDialog: FC<PropsWithChildren> = ({ children }) => {
  const src = useAttachmentSrc();

  if (!src) return children;

  return (
    <Dialog>
      <DialogTrigger className="aui-attachment-preview-trigger aui:cursor-zoom-in" asChild>
        {isValidElement(children) ? children : <button type="button">{children}</button>}
      </DialogTrigger>
      <DialogContent className="aui-attachment-preview-dialog-content aui:[&>button]:bg-foreground/60 aui:[&>button]:hover:bg-foreground/80 aui:[&_svg]:text-background aui:p-2 aui:sm:max-w-3xl aui:[&>button]:rounded-full aui:[&>button]:p-1 aui:[&>button]:opacity-100 aui:[&>button]:ring-0!">
        <DialogTitle className="aui-sr-only aui:sr-only">Image Attachment Preview</DialogTitle>
        <div className="aui-attachment-preview aui:bg-background aui:relative aui:mx-auto aui:flex aui:max-h-[80dvh] aui:w-full aui:items-center aui:justify-center aui:overflow-hidden aui:rounded-sm">
          <AttachmentPreview src={src} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AttachmentThumb: FC = () => {
  const src = useAttachmentSrc();

  return (
    <Avatar className="aui-attachment-tile-avatar aui:h-full aui:w-full aui:rounded-none">
      <AvatarImage
        src={src}
        alt="Attachment preview"
        className="aui-attachment-tile-image aui:rounded-none aui:object-cover"
      />
      <AvatarFallback>
        <FileText className="aui-attachment-tile-fallback-icon aui:text-muted-foreground/80 aui:size-6 aui:stroke-[1.5]" />
      </AvatarFallback>
    </Avatar>
  );
};

const AttachmentUI: FC = () => {
  const aui = useAui();
  const isComposer = aui.attachment.source !== 'message';

  const isImage = useAuiState((s) => s.attachment.type === 'image');
  const typeLabel = useAuiState((s) => {
    const type = s.attachment.type;
    switch (type) {
      case 'image':
        return 'Image';
      case 'document':
        return 'Document';
      case 'file':
        return 'File';
      default:
        return type;
    }
  });

  const uploadState = useAuiState((s) =>
    s.attachment.status.type === 'running'
      ? 'uploading'
      : s.attachment.status.type === 'incomplete' && s.attachment.status.reason === 'error'
        ? 'error'
        : undefined,
  );
  const isUploading = uploadState === 'uploading';
  const isError = uploadState === 'error';

  const errorMessage = useAuiState((s) =>
    s.attachment.status.type === 'incomplete' && s.attachment.status.reason === 'error'
      ? (s.attachment.status.message ?? 'Upload failed')
      : undefined,
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <AttachmentPrimitive.Root
          className={cn(
            'aui-attachment-root aui:relative',
            isComposer &&
              'aui:animate-in aui:fade-in-0 aui:zoom-in-95 aui:duration-200 aui:motion-reduce:animate-none',
            isImage && !isComposer && 'aui-attachment-root-message aui:only:*:first:size-24',
          )}
        >
          <AttachmentPreviewDialog>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'aui-attachment-tile aui:bg-muted aui:hover:after:bg-foreground/10 aui:focus-visible:ring-ring/50 aui:relative aui:size-14 aui:cursor-pointer aui:overflow-hidden aui:rounded-[calc(var(--composer-radius,1.5rem)-var(--composer-padding,8px))] aui:transition-transform aui:outline-none aui:after:pointer-events-none aui:after:absolute aui:after:inset-0 aui:after:rounded-[inherit] aui:after:ring-1 aui:after:ring-black/10 aui:after:transition-colors aui:after:ring-inset aui:focus-visible:ring-1 aui:active:scale-[0.96] aui:motion-reduce:transition-none aui:dark:after:ring-white/10',
                  isError && 'aui:after:ring-destructive/60 aui:dark:after:ring-destructive/60',
                )}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.click();
                  } else if (e.key === ' ') {
                    e.preventDefault();
                  }
                }}
                onKeyUp={(e) => {
                  if (e.key === ' ') e.currentTarget.click();
                }}
                aria-label={`${typeLabel} attachment${
                  isError ? ', upload failed' : isUploading ? ', uploading' : ''
                }`}
              >
                <AttachmentThumb />
                {isUploading && (
                  <div
                    aria-hidden="true"
                    className="aui-attachment-tile-uploading aui:bg-background/60 aui:animate-in aui:fade-in-0 aui:absolute aui:inset-0 aui:flex aui:items-center aui:justify-center aui:backdrop-blur-[2px] aui:motion-reduce:animate-none"
                  >
                    <Loader2Icon className="aui:text-muted-foreground aui:size-4 aui:animate-spin" />
                  </div>
                )}
                {isError && (
                  <div
                    aria-hidden="true"
                    className="aui-attachment-tile-error aui:bg-background/70 aui:animate-in aui:fade-in-0 aui:absolute aui:inset-0 aui:flex aui:items-center aui:justify-center aui:backdrop-blur-[2px] aui:motion-reduce:animate-none"
                  >
                    <AlertCircleIcon className="aui:text-destructive aui:size-4" />
                  </div>
                )}
              </div>
            </TooltipTrigger>
          </AttachmentPreviewDialog>
          {isComposer && <AttachmentRemove />}
        </AttachmentPrimitive.Root>
        <TooltipContent side="top">
          <AttachmentPrimitive.Name />
          {errorMessage && <p className="aui-attachment-error-message">{errorMessage}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const AttachmentRemove: FC = () => {
  return (
    <AttachmentPrimitive.Remove asChild>
      <TooltipIconButton
        tooltip="Remove file"
        className="aui-attachment-tile-remove aui:absolute aui:end-1 aui:top-1 aui:size-5 aui:rounded-full aui:bg-black/50! aui:text-white aui:after:absolute aui:after:-inset-1.5 aui:hover:bg-black/70! aui:hover:text-white! aui:active:scale-[0.96] aui:motion-reduce:transition-none"
        side="top"
      >
        <XIcon className="aui-attachment-remove-icon aui:size-3 aui:stroke-[2.5]" />
      </TooltipIconButton>
    </AttachmentPrimitive.Remove>
  );
};

export const UserMessageAttachments: FC = () => {
  return (
    <div className="aui-user-message-attachments-end aui:col-span-full aui:col-start-1 aui:row-start-1 aui:flex aui:w-full aui:flex-row aui:justify-end aui:gap-2">
      <MessagePrimitive.Attachments>{() => <AttachmentUI />}</MessagePrimitive.Attachments>
    </div>
  );
};

export const ComposerAttachments: FC = () => {
  return (
    <div className="aui-composer-attachments aui:flex aui:w-full aui:flex-row aui:items-center aui:gap-2 aui:overflow-x-auto aui:empty:hidden">
      <ComposerPrimitive.Attachments>{() => <AttachmentUI />}</ComposerPrimitive.Attachments>
    </div>
  );
};

export const ComposerAddAttachment: FC = () => {
  return (
    <ComposerPrimitive.AddAttachment asChild>
      <TooltipIconButton
        tooltip="Add Attachment"
        side="bottom"
        variant="ghost"
        size="icon"
        className="aui-composer-add-attachment aui:text-muted-foreground aui:hover:text-foreground aui:hover:bg-muted-foreground/15 aui:dark:border-muted-foreground/15 aui:dark:hover:bg-muted-foreground/30 aui:size-7 aui:rounded-full aui:active:scale-[0.96] aui:motion-reduce:transition-none"
        aria-label="Add Attachment"
      >
        <PlusIcon className="aui-attachment-add-icon aui:size-4" />
      </TooltipIconButton>
    </ComposerPrimitive.AddAttachment>
  );
};
