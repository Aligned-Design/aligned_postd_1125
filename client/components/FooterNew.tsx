import React from "react";
import { Linkedin, Instagram, Facebook } from "lucide-react";
import { Link } from "react-router-dom";

export default function FooterNew() {
  return (
    <footer className="bg-[var(--surface-1)] border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-extrabold text-white">Postd</div>
          </div>

          <nav className="flex flex-col gap-4">
            {/* Main Navigation */}
            <div className="flex gap-6 flex-wrap">
              <Link
                to="/"
                className="text-[var(--text-main)] hover:text-[var(--indigo-mid)]"
              >
                Home
              </Link>
              <Link
                to="/features"
                className="text-[var(--text-main)] hover:text-[var(--indigo-mid)]"
              >
                Features
              </Link>
              <Link
                to="/integrations-marketing"
                className="text-[var(--text-main)] hover:text-[var(--indigo-mid)]"
              >
                Integrations
              </Link>
              <Link
                to="/pricing"
                className="text-[var(--text-main)] hover:text-[var(--indigo-mid)]"
              >
                Pricing
              </Link>
              <Link
                to="/blog"
                className="text-[var(--text-main)] hover:text-[var(--indigo-mid)]"
              >
                Blog
              </Link>
            </div>
            
            {/* Legal Links */}
            <div className="flex gap-6 flex-wrap text-sm">
              <Link
                to="/legal/privacy-policy"
                className="text-[var(--text-main)] hover:text-[var(--indigo-mid)]"
              >
                Privacy Policy
              </Link>
              <Link
                to="/legal/terms"
                className="text-[var(--text-main)] hover:text-[var(--indigo-mid)]"
              >
                Terms of Service
              </Link>
              <Link
                to="/legal/refunds"
                className="text-[var(--text-main)] hover:text-[var(--indigo-mid)]"
              >
                Refund Policy
              </Link>
              <Link
                to="/legal/cookies"
                className="text-[var(--text-main)] hover:text-[var(--indigo-mid)]"
              >
                Cookie Policy
              </Link>
              <Link
                to="/legal/data-deletion"
                className="text-[var(--text-main)] hover:text-[var(--indigo-mid)]"
              >
                Data Deletion
              </Link>
              <Link
                to="/legal/acceptable-use"
                className="text-[var(--text-main)] hover:text-[var(--indigo-mid)]"
              >
                Acceptable Use
              </Link>
              <Link
                to="/legal/security"
                className="text-[var(--text-main)] hover:text-[var(--indigo-mid)]"
              >
                Security
              </Link>
              <Link
                to="/legal/ai-disclosure"
                className="text-[var(--text-main)] hover:text-[var(--indigo-mid)]"
              >
                AI Disclosure
              </Link>
            </div>
          </nav>

          <div className="flex items-center gap-4">
            <a
              aria-label="LinkedIn"
              href="#"
              className="text-slate-300 hover:text-white"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              aria-label="Instagram"
              href="#"
              className="text-slate-300 hover:text-white"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              aria-label="Facebook"
              href="#"
              className="text-slate-300 hover:text-white"
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-sm text-[var(--text-muted)]">
          © 2025 Postd. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
