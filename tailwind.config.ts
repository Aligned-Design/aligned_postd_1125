import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Shadcn/ui HSL variables (kept for compatibility)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Design tokens from tokens.css (extended)
        "primary-purple": "var(--color-primary)",
        "primary-purple-light": "var(--color-primary-light)",
        "primary-purple-lighter": "var(--color-primary-lighter)",
        "primary-purple-dark": "var(--color-primary-dark)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
        lime: {
          400: "var(--color-lime-400)",
          500: "var(--color-lime-500)",
          600: "var(--color-lime-600)",
        },
        slate: {
          50: "var(--color-slate-50)",
          100: "var(--color-slate-100)",
          200: "var(--color-slate-200)",
          300: "var(--color-slate-300)",
          400: "var(--color-slate-400)",
          500: "var(--color-slate-500)",
          600: "var(--color-slate-600)",
          700: "var(--color-slate-700)",
          800: "var(--color-slate-800)",
          900: "var(--color-slate-900)",
        },
        gray: {
          50: "var(--color-gray-50)",
          100: "var(--color-gray-100)",
          200: "var(--color-gray-200)",
          300: "var(--color-gray-300)",
          400: "var(--color-gray-400)",
          500: "var(--color-gray-500)",
          600: "var(--color-gray-600)",
          700: "var(--color-gray-700)",
          800: "var(--color-gray-800)",
          900: "var(--color-gray-900)",
        },
      },
      borderRadius: {
        // Shadcn/ui radius (kept for compatibility)
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Design tokens from tokens.css
        "radius-sm": "var(--radius-sm)",
        "radius-md": "var(--radius-md)",
        "radius-lg": "var(--radius-lg)",
        "radius-xl": "var(--radius-xl)",
        "radius-2xl": "var(--radius-2xl)",
        "radius-button": "var(--radius-button)",
        "radius-card": "var(--radius-card)",
      },
      spacing: {
        "12": "3rem",
        "16": "4rem",
        "24": "6rem",
        "32": "8rem",
      },
      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
        "5xl": "3rem",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
          },
          to: {
            opacity: "1",
          },
        },
        "slide-up": {
          from: {
            opacity: "0",
            transform: "translateY(10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-up-slow": {
          from: {
            opacity: "0",
            transform: "translateY(20px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-in-right": {
          from: {
            opacity: "0",
            transform: "translateX(20px)",
          },
          to: {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
        "slide-down": {
          from: {
            opacity: "0",
            height: "0",
            transform: "translateY(-10px)",
          },
          to: {
            opacity: "1",
            height: "auto",
            transform: "translateY(0)",
          },
        },
        "glow": {
          "0%, 100%": {
            "box-shadow": "0 0 20px rgba(185, 242, 39, 0.3)",
          },
          "50%": {
            "box-shadow": "0 0 30px rgba(185, 242, 39, 0.5)",
          },
        },
        "float": {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-8px)",
          },
        },
        "bounce-slow": {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(-4px)",
          },
        },
        "shimmer": {
          "0%": {
            backgroundPosition: "-1000px 0",
          },
          "100%": {
            backgroundPosition: "1000px 0",
          },
        },
        "pulse-glow": {
          "0%, 100%": {
            opacity: "0.6",
          },
          "50%": {
            opacity: "1",
          },
        },
        "parallax-flow": {
          "0%": {
            transform: "translateY(0px) scale(1)",
            opacity: "0",
          },
          "50%": {
            opacity: "1",
          },
          "100%": {
            transform: "translateY(8px) scale(1)",
            opacity: "1",
          },
        },
        "glass-glow": {
          "0%, 100%": {
            "box-shadow": "0 8px 32px rgba(185, 242, 39, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.5)",
            borderColor: "rgba(185, 242, 39, 0.3)",
          },
          "50%": {
            "box-shadow": "0 8px 32px rgba(185, 242, 39, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.6)",
            borderColor: "rgba(185, 242, 39, 0.4)",
          },
        },
        "float-soft": {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-12px)",
          },
        },
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "light-reflect": {
          "0%": {
            backgroundPosition: "0% 50%",
            opacity: "0",
          },
          "50%": {
            opacity: "1",
          },
          "100%": {
            backgroundPosition: "100% 50%",
            opacity: "0",
          },
        },
        "subtle-scale": {
          "0%, 100%": {
            transform: "scale(1)",
          },
          "50%": {
            transform: "scale(1.02)",
          },
        },
        "gradient-shift": {
          "0%": {
            "background-position": "0% 50%",
          },
          "50%": {
            "background-position": "100% 50%",
          },
          "100%": {
            "background-position": "0% 50%",
          },
        },
        // Design system keyframes (from design-import)
        "reflect-sweep": {
          "0%": {
            transform: "translateX(-100%)",
          },
          "100%": {
            transform: "translateX(100%)",
          },
        },
        "slide-up-collapse": {
          "from": {
            opacity: "1",
            height: "auto",
            transform: "translateY(0)",
          },
          "to": {
            opacity: "0",
            height: "0",
            transform: "translateY(-10px)",
          },
        },
        "scale-pulse": {
          "0%": {
            transform: "scale(1)",
          },
          "50%": {
            transform: "scale(1.05)",
          },
          "100%": {
            transform: "scale(1)",
          },
        },
        "lift": {
          "from": {
            transform: "translateY(0)",
            "box-shadow": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          },
          "to": {
            transform: "translateY(-2px)",
            "box-shadow": "0 8px 30px rgba(37, 37, 91, 0.06)",
          },
        },
        "bounce": {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "25%": {
            transform: "translateY(-8px)",
          },
          "50%": {
            transform: "translateY(-4px)",
          },
          "75%": {
            transform: "translateY(-6px)",
          },
        },
        "pulse": {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.5",
          },
        },
        "sparkline-draw": {
          "from": {
            "stroke-dashoffset": "1000",
          },
          "to": {
            "stroke-dashoffset": "0",
          },
        },
        "bar-reveal": {
          "from": {
            height: "0",
            opacity: "0",
          },
          "to": {
            height: "100%",
            opacity: "1",
          },
        },
        "rotate": {
          "from": {
            transform: "rotate(0deg)",
          },
          "to": {
            transform: "rotate(360deg)",
          },
        },
        "chevron-rotate": {
          "from": {
            transform: "rotate(0deg)",
          },
          "to": {
            transform: "rotate(180deg)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-in-out",
        "slide-up": "slide-up 0.4s ease-out",
        "slide-up-slow": "slide-up-slow 0.6s ease-out",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        "slide-down": "slide-down 0.2s ease-out",
        "glow": "glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "bounce-slow": "bounce-slow 2s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "parallax-flow": "parallax-flow 0.8s ease-out",
        "glass-glow": "glass-glow 3s ease-in-out infinite",
        "float-soft": "float-soft 4s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.7s ease-out",
        "light-reflect": "light-reflect 3s ease-in-out infinite",
        "subtle-scale": "subtle-scale 2s ease-in-out infinite",
        "gradient-shift": "gradient-shift 8s ease-in-out infinite",
        // Design system animations (from design-import)
        "reflect-sweep": "reflect-sweep 3s linear infinite",
        "slide-up-collapse": "slide-up-collapse 0.2s ease-out",
        "scale-pulse": "scale-pulse 0.2s ease-out",
        "lift": "lift 0.3s ease-out",
        "bounce": "bounce 0.6s ease",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "sparkline-draw": "sparkline-draw 0.4s ease-out forwards",
        "bar-reveal": "bar-reveal 0.5s ease-out forwards",
        "rotate": "rotate 1s linear infinite",
        "chevron-rotate": "chevron-rotate 0.2s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
