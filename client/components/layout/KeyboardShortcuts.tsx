import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Keyboard } from 'lucide-react';

const shortcuts = [
  { keys: ['⌘', 'K'], description: 'Open command palette' },
  { keys: ['⌘', 'B'], description: 'Toggle sidebar' },
  { keys: ['G', 'D'], description: 'Go to Dashboard' },
  { keys: ['G', 'B'], description: 'Go to Brands' },
  { keys: ['G', 'C'], description: 'Go to Calendar' },
  { keys: ['G', 'A'], description: 'Go to Assets' },
  { keys: ['N'], description: 'Create new (context-aware)' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setOpen(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg md:hidden"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Keyboard Shortcuts</SheetTitle>
          <SheetDescription>
            Speed up your workflow with these keyboard shortcuts
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, i) => (
                  <kbd
                    key={i}
                    className="pointer-events-none inline-flex h-7 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-lg border bg-muted/50 p-4">
          <p className="text-xs text-muted-foreground">
            <strong>Pro tip:</strong> Press <kbd className="rounded bg-background px-1 py-0.5">⌘K</kbd> from anywhere
            to quickly navigate, switch brands, or perform actions.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
