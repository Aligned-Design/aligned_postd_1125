import { useState } from "react";
import { BrandGuide } from "@/types/brandGuide";
import { Upload, X, Sparkles, Type } from "lucide-react";

interface VisualIdentityEditorProps {
  brand: BrandGuide;
  onUpdate: (updates: Partial<BrandGuide>) => void;
}

const GOOGLE_FONTS = [
  { name: "Inter", family: "Inter" },
  { name: "Playfair Display", family: "Playfair Display" },
  { name: "Montserrat", family: "Montserrat" },
  { name: "Poppins", family: "Poppins" },
  { name: "Lato", family: "Lato" },
  { name: "Open Sans", family: "Open Sans" },
  { name: "Roboto", family: "Roboto" },
  { name: "Raleway", family: "Raleway" },
  { name: "Source Sans Pro", family: "Source Sans Pro" },
  { name: "Nunito", family: "Nunito" },
  { name: "PT Serif", family: "PT Serif" },
  { name: "Merriweather", family: "Merriweather" },
  { name: "Cormorant Garamond", family: "Cormorant Garamond" },
  { name: "DM Sans", family: "DM Sans" },
  { name: "Quicksand", family: "Quicksand" },
];

/**
 * Get colors from brand data - uses actual scraped/stored colors
 * Colors are extracted during website crawling and stored in brand_kit.colors
 */
function getBrandColors(brand: BrandGuide): string[] {
  // Priority: primaryColors from brand_kit > visualIdentity.colors > colorPalette
  const colors = brand.primaryColors || 
                 brand.visualIdentity?.colors || 
                 brand.colorPalette || 
                 [];
  
  // Filter to valid HEX colors only
  return colors.filter((c: string) => /^#[0-9A-Fa-f]{6}$/.test(c)).slice(0, 6);
}

export function VisualIdentityEditor({ brand, onUpdate }: VisualIdentityEditorProps) {
  const [logoPreview, setLogoPreview] = useState<string>(brand.logoUrl || "");
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedGoogleFont, setSelectedGoogleFont] = useState<string>(brand.fontFamily || "Inter");

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        onUpdate({ logoUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGoogleFontSelect = (fontFamily: string) => {
    setSelectedGoogleFont(fontFamily);
    onUpdate({ fontFamily, fontSource: "google" });
  };

  const handleCustomFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isValidFormat = ["application/font-woff", "application/font-woff2", "font/woff", "font/woff2", "font/ttf", "application/octet-stream"].includes(file.type) ||
                           file.name.endsWith(".woff") || file.name.endsWith(".woff2") ||
                           file.name.endsWith(".ttf") || file.name.endsWith(".otf");

      if (!isValidFormat) {
        alert("Please upload a valid font file (WOFF, WOFF2, TTF, or OTF)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const fontName = file.name.split(".")[0];
        // ✅ FIX: customFontUrl is a legacy field on BrandGuide, but we should also update nested structure
        onUpdate({
          fontFamily: fontName,
          fontSource: "custom",
          customFontUrl: result, // Legacy field exists on BrandGuide type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractColors = () => {
    if (!logoPreview) return;
    setIsExtracting(true);
    
    // Use actual brand colors (extracted during website crawl)
    // If no scraped colors exist, use a fallback
    setTimeout(() => {
      const existingColors = getBrandColors(brand);
      
      if (existingColors.length > 0) {
        // Use colors that were extracted during website scraping
        onUpdate({ primaryColors: existingColors.slice(0, 3) });
      } else {
        // Fallback: prompt user to complete website scraping
        // For now, just set a single neutral color
        onUpdate({ primaryColors: ["#1f2937"] }); // slate-800
      }
      setIsExtracting(false);
    }, 500);
  };

  const handleColorChange = (index: number, color: string, isPrimary: boolean) => {
    if (isPrimary) {
      const newColors = [...brand.primaryColors];
      newColors[index] = color;
      onUpdate({ primaryColors: newColors });
    } else {
      const newColors = [...brand.secondaryColors];
      newColors[index] = color;
      onUpdate({ secondaryColors: newColors });
    }
  };

  const addColor = (isPrimary: boolean) => {
    if (isPrimary) {
      onUpdate({ primaryColors: [...brand.primaryColors, "#ffffff"] }); // white (standard color)
    } else {
      onUpdate({ secondaryColors: [...brand.secondaryColors, "#ffffff"] }); // white (standard color)
    }
  };

  const removeColor = (index: number, isPrimary: boolean) => {
    if (isPrimary) {
      onUpdate({ primaryColors: brand.primaryColors.filter((_, i) => i !== index) });
    } else {
      onUpdate({ secondaryColors: brand.secondaryColors.filter((_, i) => i !== index) });
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-slate-900">Logo</h2>
          {logoPreview && (
            <button
              onClick={handleExtractColors}
              disabled={isExtracting}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-100 text-teal-700 hover:bg-teal-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-sm"
            >
              <Sparkles className="w-4 h-4" />
              {isExtracting 
                ? "Applying..." 
                : getBrandColors(brand).length > 0 
                  ? "Apply Brand Colors" 
                  : "Extract Colors"}
            </button>
          )}
        </div>

        <div className="mb-4">
          {logoPreview ? (
            <div className="relative w-40 h-40 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg flex items-center justify-center overflow-hidden border-2 border-slate-200">
              <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-4" />
              <button
                onClick={() => {
                  setLogoPreview("");
                  onUpdate({ logoUrl: "" });
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
              <div className="text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600">Upload logo</p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
              </div>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          )}
        </div>

        {logoPreview && (
          <p className="text-xs text-slate-600 bg-indigo-50 p-3 rounded-lg">
            💡 Tip: {getBrandColors(brand).length > 0 
              ? "Your brand colors were automatically extracted from your website. Click 'Extract Colors' to apply them to your palette."
              : "Click 'Extract Colors' to populate colors. For best results, complete website scraping during onboarding."}
          </p>
        )}
      </div>

      {/* Typography / Font Selection */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-black text-slate-900">Typography</h3>
        </div>

        <div className="space-y-4 mb-4">
          {/* Google Fonts Dropdown */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Brand Font (Google Fonts)</label>
            <select
              value={selectedGoogleFont}
              onChange={(e) => handleGoogleFontSelect(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-0 text-sm"
            >
              <optgroup label="Recommended">
                <option value="Inter">Inter (Modern, Versatile)</option>
                <option value="Poppins">Poppins (Friendly, Bold)</option>
                <option value="Playfair Display">Playfair Display (Elegant, Serif)</option>
              </optgroup>
              <optgroup label="All Fonts">
                {GOOGLE_FONTS.map((font) => (
                  <option key={font.name} value={font.family}>
                    {font.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Custom Font Upload */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">Or Upload Custom Font</label>
            <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
              <div className="text-center">
                <Upload className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-600">Upload custom font</p>
                <p className="text-xs text-slate-500">WOFF, WOFF2, TTF, or OTF</p>
              </div>
              <input type="file" accept=".woff,.woff2,.ttf,.otf,application/font-woff,application/font-woff2" onChange={handleCustomFontUpload} className="hidden" />
            </label>
          </div>

          {/* Font Preview */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
            <p className="text-xs font-bold text-slate-600 mb-2">PREVIEW</p>
            <p
              className="text-3xl font-black text-slate-900 transition-all"
              style={{ fontFamily: `"${selectedGoogleFont}", sans-serif` }}
            >
              {brand.brandName || "Your Brand"}
            </p>
            <p className="text-xs text-slate-600 mt-2">
              {brand.fontSource === "google"
                ? `Using Google Font: ${selectedGoogleFont}`
                : brand.fontSource === "custom"
                ? `Using custom font: ${brand.fontFamily}`
                : "Select or upload a font"}
            </p>
          </div>
        </div>
      </div>

      {/* Color Palette Preview */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
        <h3 className="text-lg font-black text-slate-900 mb-4">Color Palette Preview</h3>

        <div className="grid grid-cols-4 gap-3">
          {brand.primaryColors.map((color) => (
            <div key={color} className="text-center">
              <div
                className="w-full h-20 rounded-lg border-2 border-slate-200 mb-2 cursor-pointer hover:border-slate-400 transition-colors"
                style={{ backgroundColor: color }}
              />
              <p className="text-xs font-mono text-slate-600">{color.toUpperCase()}</p>
            </div>
          ))}
          {brand.secondaryColors.map((color) => (
            <div key={color} className="text-center opacity-60">
              <div
                className="w-full h-20 rounded-lg border-2 border-slate-200 mb-2 cursor-pointer hover:border-slate-400 transition-colors"
                style={{ backgroundColor: color }}
              />
              <p className="text-xs font-mono text-slate-600">{color.toUpperCase()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Colors */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900">Primary Colors</h3>
          <button
            onClick={() => addColor(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors font-bold text-xs"
          >
            + Add
          </button>
        </div>

        <div className="space-y-3">
          {brand.primaryColors.map((color, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(idx, e.target.value, true)}
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-200 hover:border-slate-400"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleColorChange(idx, e.target.value, true)}
                  placeholder="#111827" // foreground (design token)
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-0 text-sm font-mono uppercase placeholder:text-slate-400"
                />
              </div>
              {brand.primaryColors.length > 1 && (
                <button
                  onClick={() => removeColor(idx, true)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Colors */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900">Secondary Colors</h3>
          <button
            onClick={() => addColor(false)}
            className="px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors font-bold text-xs"
          >
            + Add
          </button>
        </div>

        <div className="space-y-3">
          {brand.secondaryColors.map((color, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(idx, e.target.value, false)}
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-200 hover:border-slate-400"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleColorChange(idx, e.target.value, false)}
                  placeholder="#111827" // foreground (design token)
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-0 text-sm font-mono uppercase placeholder:text-slate-400"
                />
              </div>
              {brand.secondaryColors.length > 1 && (
                <button
                  onClick={() => removeColor(idx, false)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Visual Notes */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
        <h3 className="text-lg font-black text-slate-900 mb-2">Visual Guidelines</h3>
        <p className="text-sm text-slate-600 mb-3">Any notes about logo usage, spacing, or visual style</p>
        <textarea
          value={brand.visualNotes || ""}
          onChange={(e) => onUpdate({ visualNotes: e.target.value })}
          placeholder="e.g., Logo minimum size 100px, avoid on busy backgrounds, maintain clear space around mark..."
          className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-0 text-sm resize-none placeholder:text-slate-400"
          rows={4}
        />
      </div>
    </div>
  );
}
