import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/design-system';
import type { TooltipContent } from '@shared/tooltip-library';

interface SmartTooltipProps {
  content: string | TooltipContent;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'auto';
  showOnFirstVisit?: boolean;
  children: React.ReactNode;
  className?: string;
  onLearnMore?: (articleId: string) => void;
}

export function SmartTooltip({
  content,
  position = 'top',
  trigger = 'hover',
  showOnFirstVisit = false,
  children,
  className,
  onLearnMore
}: SmartTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  // Normalize content to TooltipContent type
  const normalizedContent: TooltipContent = typeof content === 'string'
    ? { title: 'Help', content }
    : content;

  useEffect(() => {
    if (showOnFirstVisit && !hasBeenShown) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasBeenShown(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showOnFirstVisit, hasBeenShown]);

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div 
      className={cn("relative inline-block", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
      
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg max-w-xs',
            positionClasses[position]
          )}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1">
              {normalizedContent.title && (
                <div className="font-semibold text-xs text-gray-200 mb-1">
                  {normalizedContent.title}
                </div>
              )}
              <div className="text-xs leading-relaxed">
                {normalizedContent.content}
              </div>
              {normalizedContent.learnMore && onLearnMore && (
                <button
                  onClick={() => {
                    onLearnMore(normalizedContent.learnMore!);
                    setIsVisible(false);
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-blue-300 hover:text-blue-200 text-xs font-medium"
                >
                  Learn More <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>
            {trigger === 'click' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVisible(false);
                }}
                className="h-auto p-0 text-white hover:text-gray-300"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Arrow */}
          <div
            className={cn(
              'absolute w-2 h-2 bg-gray-900 transform rotate-45',
              position === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1',
              position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
              position === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1',
              position === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1'
            )}
          />
        </div>
      )}
    </div>
  );
}
