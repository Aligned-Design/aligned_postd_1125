import { BrandGuide } from "@/types/brandGuide";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface CreativeStudioBrandKitProps {
  brand: BrandGuide | null;
  onSelectColor: (color: string) => void;
  onSelectFont: (fontFamily: string) => void;
  onSelectLogo: () => void;
}

export function CreativeStudioBrandKit({
  brand,
  onSelectColor,
  onSelectFont,
  onSelectLogo,
}: CreativeStudioBrandKitProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    colors: true,
    fonts: true,
    logos: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!brand) {
    return (
      <div className="w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto">
        <div className="text-center text-slate-500">
          <p className="font-semibold mb-1">No Brand Guide</p>
          <p className="text-sm">Create a Brand Guide to use brand assets here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-slate-200 p-4 overflow-y-auto">
      <h2 className="text-lg font-black text-slate-900 mb-4">Brand Kit</h2>

      {/* Colors Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("colors")}
          className="flex items-center gap-2 w-full font-bold text-slate-900 hover:text-indigo-700 transition-colors mb-3"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${expandedSections.colors ? "" : "-rotate-90"}`}
          />
          Colors
        </button>

        {expandedSections.colors && (
          <div className="space-y-2 ml-6">
            {/* Brand Colors from visualIdentity */}
            {brand.visualIdentity?.colors && brand.visualIdentity.colors.length > 0 ? (
              brand.visualIdentity.colors.map((color, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <button
                    onClick={() => onSelectColor(color)}
                    className="w-10 h-10 rounded-lg border-2 border-slate-200 hover:border-slate-400 cursor-pointer transition-all hover:shadow-md"
                    style={{ backgroundColor: color }}
                    title={idx === 0 ? `Primary Color: ${color}` : idx === 1 ? `Secondary Color: ${color}` : color}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {idx === 0 ? "Primary" : idx === 1 ? "Secondary" : color}
                  </span>
                </div>
              ))
            ) : (
              // Fallback to legacy fields for backward compatibility
              <>
                {brand.primaryColor && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onSelectColor(brand.primaryColor!)}
                      className="w-10 h-10 rounded-lg border-2 border-slate-200 hover:border-slate-400 cursor-pointer transition-all hover:shadow-md"
                      style={{ backgroundColor: brand.primaryColor }}
                      title={`Primary Color: ${brand.primaryColor}`}
                    />
                    <span className="text-sm font-medium text-slate-700">Primary</span>
                  </div>
                )}

                {brand.secondaryColor && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onSelectColor(brand.secondaryColor!)}
                      className="w-10 h-10 rounded-lg border-2 border-slate-200 hover:border-slate-400 cursor-pointer transition-all hover:shadow-md"
                      style={{ backgroundColor: brand.secondaryColor }}
                      title={`Secondary Color: ${brand.secondaryColor}`}
                    />
                    <span className="text-sm font-medium text-slate-700">Secondary</span>
                  </div>
                )}

                {brand.colorPalette && brand.colorPalette.length > 0 && (
                  <>
                    {brand.colorPalette.map((color, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <button
                          onClick={() => onSelectColor(color)}
                          className="w-10 h-10 rounded-lg border-2 border-slate-200 hover:border-slate-400 cursor-pointer transition-all hover:shadow-md"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                        <span className="text-xs font-medium text-slate-600">{color}</span>
                      </div>
                    ))}
                  </>
                )}

                {!brand.primaryColor && !brand.secondaryColor && (!brand.colorPalette || brand.colorPalette.length === 0) && (
                  <p className="text-sm text-slate-500 ml-6">No colors added yet</p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Fonts Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("fonts")}
          className="flex items-center gap-2 w-full font-bold text-slate-900 hover:text-indigo-700 transition-colors mb-3"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${expandedSections.fonts ? "" : "-rotate-90"}`}
          />
          Fonts
        </button>

        {expandedSections.fonts && (
          <div className="space-y-2 ml-6">
            {/* Brand Fonts from visualIdentity */}
            {(brand.visualIdentity?.typography?.heading || brand.visualIdentity?.typography?.body || brand.fontFamily) ? (
              <>
                {brand.visualIdentity?.typography?.heading && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Heading Font</p>
                    <button
                      onClick={() => onSelectFont(brand.visualIdentity!.typography!.heading!)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all text-sm font-medium text-slate-900 text-left"
                      style={{ fontFamily: brand.visualIdentity!.typography!.heading }}
                    >
                      {brand.visualIdentity!.typography!.heading}
                    </button>
                  </div>
                )}
                {brand.visualIdentity?.typography?.body && brand.visualIdentity.typography.body !== brand.visualIdentity.typography.heading && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Body Font</p>
                    <button
                      onClick={() => onSelectFont(brand.visualIdentity!.typography!.body!)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all text-sm font-medium text-slate-900 text-left"
                      style={{ fontFamily: brand.visualIdentity!.typography!.body }}
                    >
                      {brand.visualIdentity!.typography!.body}
                    </button>
                  </div>
                )}
                {/* Fallback to legacy fontFamily */}
                {!brand.visualIdentity?.typography?.heading && brand.fontFamily && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Primary Font</p>
                    <button
                      onClick={() => onSelectFont(brand.fontFamily!)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all text-sm font-medium text-slate-900 text-left"
                      style={{ fontFamily: brand.fontFamily }}
                    >
                      {brand.fontFamily}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500 ml-6">No fonts added yet</p>
            )}
          </div>
        )}
      </div>

      {/* Logo Section */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection("logos")}
          className="flex items-center gap-2 w-full font-bold text-slate-900 hover:text-indigo-700 transition-colors mb-3"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${expandedSections.logos ? "" : "-rotate-90"}`}
          />
          Logos
        </button>

        {expandedSections.logos && (
          <div className="ml-6">
            {(brand.visualIdentity?.logoUrl || brand.logoUrl) ? (
              <button
                onClick={onSelectLogo}
                className="w-full p-3 rounded-lg border-2 border-slate-200 hover:border-slate-400 transition-all hover:shadow-md bg-slate-50 hover:bg-slate-100"
              >
                <img src={brand.visualIdentity?.logoUrl || brand.logoUrl} alt="Brand Logo" className="h-12 w-auto mx-auto" />
              </button>
            ) : (
              <p className="text-sm text-slate-500">No logo added yet</p>
            )}
          </div>
        )}
      </div>

      {/* Brand Info */}
      <div className="mt-8 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-600">
          <span className="font-bold text-slate-900">{brand.brandName}</span>
          <br />
          {brand.purpose && (
            <>
              <span className="text-slate-500">{brand.purpose.substring(0, 50)}...</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
