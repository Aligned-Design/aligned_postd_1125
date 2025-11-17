import { HelpCircle, ExternalLink } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import type { TooltipContent as TooltipContentType } from '@shared/tooltip-library';

interface HelpTooltipProps {
  content: string | TooltipContentType;
  side?: 'top' | 'bottom' | 'left' | 'right';
  onLearnMore?: (articleId: string) => void;
}

export function HelpTooltip({ content, side = 'top', onLearnMore }: HelpTooltipProps) {
  // Normalize content to structured type
  const normalizedContent: TooltipContentType = typeof content === 'string'
    ? { title: '', content }
    : content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Help"
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        <div className="space-y-2">
          {normalizedContent.title && (
            <p className="font-semibold text-sm">{normalizedContent.title}</p>
          )}
          <p className="text-sm">{normalizedContent.content}</p>
          {normalizedContent.learnMore && onLearnMore && (
            <Button
              variant="link"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onLearnMore(normalizedContent.learnMore!);
              }}
              className="p-0 h-auto text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
            >
              Learn More <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
