import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Briefcase,
  CalendarDays,
  FolderOpen,
  BarChart3,
  Plus,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useBrand } from '@/contexts/BrandContext';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { brands, setCurrentBrand } = useBrand();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const commands = [
    {
      group: 'Navigation',
      items: [
        {
          icon: LayoutDashboard,
          label: 'Dashboard',
          onSelect: () => runCommand(() => navigate('/dashboard')),
        },
        {
          icon: Briefcase,
          label: 'Brands',
          onSelect: () => runCommand(() => navigate('/brands')),
        },
        {
          icon: CalendarDays,
          label: 'Calendar',
          onSelect: () => runCommand(() => navigate('/calendar')),
        },
        {
          icon: FolderOpen,
          label: 'Assets',
          onSelect: () => runCommand(() => navigate('/assets')),
        },
        {
          icon: BarChart3,
          label: 'Analytics',
          onSelect: () => runCommand(() => navigate('/analytics')),
        },
      ],
    },
    {
      group: 'Actions',
      items: [
        {
          icon: Plus,
          label: 'Create Brand',
          onSelect: () => runCommand(() => navigate('/brands')),
        },
        {
          icon: Plus,
          label: 'Create Content',
          onSelect: () => runCommand(() => navigate('/calendar')),
        },
      ],
    },
  ];

  if (brands.length > 0) {
    commands.push({
      group: 'Switch Brand',
      items: brands.map((brand) => ({
        icon: Briefcase,
        label: brand.name,
        onSelect: () => runCommand(() => setCurrentBrand(brand)),
      })),
    });
  }

  commands.push({
    group: 'Account',
    items: [
      {
        icon: LogOut,
        label: 'Sign Out',
        onSelect: () => runCommand(() => {
          logout();
          navigate('/login');
        }),
      },
    ],
  });

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search... (⌘K to toggle)" />
      <CommandList>
        <CommandEmpty>
          <div className="py-6 text-center text-sm">
            <p className="text-muted-foreground mb-2">No results found.</p>
            <p className="text-xs text-muted-foreground">Try searching for navigation, actions, or brand names</p>
          </div>
        </CommandEmpty>
        {commands.map((group) => (
          <CommandGroup key={group.group} heading={group.group}>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem key={item.label} onSelect={item.onSelect}>
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
