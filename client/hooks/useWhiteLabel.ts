import { useState, useEffect, useContext, createContext } from 'react';
import { WhiteLabelConfig } from '@shared/branding';

interface WhiteLabelContextType {
  config: WhiteLabelConfig | null;
  loading: boolean;
  updateConfig: (updates: Partial<WhiteLabelConfig>) => Promise<void>;
  applyTheme: (colors: WhiteLabelConfig['colors']) => void;
  resetToDefault: () => void;
}

const WhiteLabelContext = createContext<WhiteLabelContextType | null>(null);

export function useWhiteLabel() {
  const context = useContext(WhiteLabelContext);
  if (!context) {
    throw new Error('useWhiteLabel must be used within WhiteLabelProvider');
  }
  return context;
}

export function useWhiteLabelConfig() {
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWhiteLabelConfig();
  }, []);

  const loadWhiteLabelConfig = async () => {
    try {
      setLoading(true);
      
      // Check if we're on a custom domain
      const hostname = window.location.hostname;
      // POSTD production domains: postd.app, postd.ai, or custom client domains
const isCustomDomain = !hostname.includes('postd.app') && hostname !== 'localhost';
      
      let response;
      if (isCustomDomain) {
        // Load config by domain
        response = await fetch(`/api/white-label/by-domain?domain=${hostname}`);
      } else {
        // Load config by agency (from auth context)
        response = await fetch('/api/white-label/config');
      }
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        
        // Apply theme immediately
        if (data.config) {
          applyTheme(data.config.colors);
          updateFavicon(data.config.branding.favicon);
          updateTitle(data.config.branding.companyName);
        }
      }
    } catch (error) {
      console.error('Failed to load white-label config:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (updates: Partial<WhiteLabelConfig>) => {
    try {
      const response = await fetch('/api/white-label/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: updates })
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
        
        // Apply updates immediately
        if (updates.colors) {
          applyTheme(updates.colors);
        }
        if (updates.branding?.favicon) {
          updateFavicon(updates.branding.favicon);
        }
        if (updates.branding?.companyName) {
          updateTitle(updates.branding.companyName);
        }
      }
    } catch (error) {
      console.error('Failed to update white-label config:', error);
    }
  };

  const applyTheme = (colors: WhiteLabelConfig['colors']) => {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-text-primary', colors.text.primary);
    root.style.setProperty('--color-text-secondary', colors.text.secondary);
    root.style.setProperty('--color-text-muted', colors.text.muted);
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-error', colors.error);
    
    // Update Tailwind CSS variables
    root.style.setProperty('--tw-color-primary', colors.primary);
    root.style.setProperty('--tw-color-secondary', colors.secondary);
  };

  const updateFavicon = (faviconUrl?: string) => {
    if (!faviconUrl) return;
    
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || 
                 document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = faviconUrl;
    document.getElementsByTagName('head')[0].appendChild(link);
  };

  const updateTitle = (companyName?: string) => {
    if (!companyName) return;
    
    document.title = `${companyName} - Social Media Management`;
  };

  const resetToDefault = () => {
    const root = document.documentElement;
    
    // Remove custom properties to fall back to defaults
    const customProps = [
      '--color-primary', '--color-secondary', '--color-accent',
      '--color-background', '--color-surface', '--color-text-primary',
      '--color-text-secondary', '--color-text-muted', '--color-border',
      '--color-success', '--color-warning', '--color-error'
    ];
    
    customProps.forEach(prop => root.style.removeProperty(prop));
    
    document.title = 'Aligned AI - Social Media Management';
  };

  return {
    config,
    loading,
    updateConfig,
    applyTheme,
    resetToDefault
  };
}

export { WhiteLabelContext };
