import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './button';

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

interface NavigationProps {
  items: NavItem[];
}

export function Navigation({ items }: NavigationProps) {
  const location = useLocation();
  
  return (
    <nav className="flex space-x-2">
      {items.map((item) => (
        <Button
          key={item.href}
          variant={location.pathname === item.href ? "default" : "ghost"}
          size="sm"
          asChild
        >
          <Link to={item.href} className="flex items-center gap-2">
            {item.icon}
            {item.label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
