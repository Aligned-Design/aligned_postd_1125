import { Github, Linkedin, Mail } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer id="contact" className="border-t bg-background">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <h3 className="text-lg font-semibold">Postd</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            Marketing that stays true to your brand.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-medium">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><a href="#features" className="hover:text-foreground">Features</a></li>
            <li><a href="#tools" className="hover:text-foreground">Tools</a></li>
            <li><a href="#analytics" className="hover:text-foreground">Analytics</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-medium">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-2"><Mail className="h-4 w-4"/> hello@postd.app</li>
            <li className="inline-flex items-center gap-2"><Github className="h-4 w-4"/> github.com/postd</li>
            <li className="inline-flex items-center gap-2"><Linkedin className="h-4 w-4"/> linkedin.com/company/postd</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <div>
              © {new Date().getFullYear()} Postd. All rights reserved.
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="/legal/privacy-policy" className="hover:text-foreground">Privacy Policy</a>
              <a href="/legal/terms" className="hover:text-foreground">Terms of Service</a>
              <a href="/legal/cookies" className="hover:text-foreground">Cookie Policy</a>
              <a href="/legal/data-deletion" className="hover:text-foreground">Data Deletion</a>
              <a href="/legal/refunds" className="hover:text-foreground">Refund Policy</a>
              <a href="/legal/acceptable-use" className="hover:text-foreground">Acceptable Use</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
