import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl shadow-soft">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
        <Link
          to="/"
          className="flex items-center gap-2.5"
          aria-label="Aligned AI"
        >
          <div className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#071025] text-white shadow-soft">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Aligned AI
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          <Link
            to="/features"
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Features
          </Link>
          <Link
            to="/integrations"
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Integrations
          </Link>
          <Link
            to="/pricing"
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Pricing
          </Link>
          <Link
            to="/help"
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Help
          </Link>
          <Link
            to="/contact"
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="hidden md:inline-flex">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild variant="default">
            <Link to="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
