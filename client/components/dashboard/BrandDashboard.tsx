import { useState } from "react";
import { BrandGuide } from "@/types/brandGuide";
import { ArrowRight, Sparkles, RefreshCw, Check, X } from "lucide-react";

interface BrandDashboardProps {
  brand: BrandGuide;
  onUpdate?: (updates: Partial<BrandGuide>) => void;
}

type EditingField = "purpose" | "mission" | "vision" | "voiceDescription" | "visualNotes" | null;

export function BrandDashboard({ brand, onUpdate }: BrandDashboardProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [editValue, setEditValue] = useState("");

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      setIsRegenerating(false);
    }, 1500);
  };

  const startEditing = (field: EditingField, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = (field: EditingField) => {
    if (!onUpdate || !field) return;
    onUpdate({ [field]: editValue } as Partial<BrandGuide>);
    setEditingField(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const getToneLabel = (level: number) => {
    if (level < 33) return "Low";
    if (level < 67) return "Moderate";
    return "High";
  };

  return (
    <div className="space-y-6">
      {/* Hero: Brand Essence */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 rounded-xl border border-indigo-100 p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">{brand.brandName || "Your Brand"}</h2>
            <p className="text-sm text-slate-600">
              {brand.purpose
                ? `${brand.purpose.substring(0, 80)}...`
                : "Your brand essence will appear here as you fill out the guide."}
            </p>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-sm whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
            {isRegenerating ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-indigo-100">
          <div className="text-center py-2">
            <p className="text-xs text-slate-600 font-bold mb-1">TONE KEYWORDS</p>
            <p className="text-lg font-black text-indigo-600">{(brand.voiceAndTone?.tone || brand.tone || []).length}</p>
          </div>
          <div className="text-center py-2">
            <p className="text-xs text-slate-600 font-bold mb-1">COLORS</p>
            <p className="text-lg font-black text-indigo-600">
              {(brand.visualIdentity?.colors || brand.primaryColors || []).length + (brand.secondaryColors || []).length}
            </p>
          </div>
          <div className="text-center py-2">
            <p className="text-xs text-slate-600 font-bold mb-1">PERSONAS</p>
            <p className="text-lg font-black text-indigo-600">{brand.personas?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Who We Are */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6 group hover:border-indigo-200 transition-colors">
        <h3 className="text-lg font-black text-slate-900 mb-3">Who We Are</h3>
        {editingField === "purpose" ? (
          <div className="space-y-3">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => saveEdit("purpose")}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-lime-400 text-slate-900 hover:bg-lime-500 transition-colors font-bold text-sm"
              >
                <Check className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors font-bold text-sm"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-700 leading-relaxed mb-4">
              {brand.purpose ? (
                brand.purpose
              ) : (
                <span className="text-slate-500 italic">
                  Define your purpose to show what drives your brand forward.
                </span>
              )}
            </p>
            <button
              onClick={() => startEditing("purpose", brand.purpose || "")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
            >
              ✏️ Edit
              <ArrowRight className="w-3 h-3" />
            </button>
          </>
        )}
      </div>

      {/* What We Stand For */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6 group hover:border-indigo-200 transition-colors">
        <h3 className="text-lg font-black text-slate-900 mb-4">What We Stand For</h3>

        {editingField === "mission" ? (
          <div className="space-y-3 mb-4">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => saveEdit("mission")}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-lime-400 text-slate-900 hover:bg-lime-500 transition-colors font-bold text-sm"
              >
                <Check className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors font-bold text-sm"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3 mb-4 group/mission">
            <p className="text-sm text-slate-700 leading-relaxed flex-1">
              {brand.mission ? (
                brand.mission
              ) : (
                <span className="text-slate-500 italic">
                  Define your mission to explain what your brand does and its impact.
                </span>
              )}
            </p>
            <button
              onClick={() => startEditing("mission", brand.mission || "")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors opacity-0 group-hover/mission:opacity-100 flex-shrink-0"
            >
              ✏️
            </button>
          </div>
        )}

        {brand.vision && (
          <>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-4"></div>
            {editingField === "vision" ? (
              <div className="space-y-3">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit("vision")}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-lime-400 text-slate-900 hover:bg-lime-500 transition-colors font-bold text-sm"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors font-bold text-sm"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3 group/vision">
                <p className="text-sm text-slate-700 flex-1">
                  <span className="text-xs font-bold text-slate-900 block mb-1">Vision</span>
                  {brand.vision}
                </p>
                <button
                  onClick={() => startEditing("vision", brand.vision || "")}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors opacity-0 group-hover/vision:opacity-100 flex-shrink-0"
                >
                  ✏️
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* How We Show Up: Tone & Voice */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
        <h3 className="text-lg font-black text-slate-900 mb-4">How We Show Up</h3>

        {/* Tone Keywords */}
        {(brand.voiceAndTone?.tone || brand.tone || []).length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-600 mb-2">VOICE KEYWORDS</p>
            <div className="flex flex-wrap gap-2">
              {(brand.voiceAndTone?.tone || brand.tone || []).map((t) => (
                <span
                  key={t}
                  className="px-3 py-1.5 bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-700 rounded-full text-xs font-bold border border-indigo-200 hover:border-indigo-400 transition-colors"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tone Sliders Visualization */}
        <div className="space-y-4 mb-6">
          {/* Friendliness */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-slate-900">Friendliness</p>
                <p className="text-xs text-slate-500">Formal ↔ Warm & Friendly</p>
              </div>
              <span className="text-sm font-black text-indigo-600">{brand.voiceAndTone?.friendlinessLevel || brand.friendlinessLevel || 50}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${brand.voiceAndTone?.friendlinessLevel || brand.friendlinessLevel || 50}%` }}
              />
            </div>
          </div>

          {/* Formality */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-slate-900">Formality</p>
                <p className="text-xs text-slate-500">Casual ↔ Professional</p>
              </div>
              <span className="text-sm font-black text-indigo-600">{brand.voiceAndTone?.formalityLevel || brand.formalityLevel || 50}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-purple-400 transition-all duration-300"
                style={{ width: `${brand.voiceAndTone?.formalityLevel || brand.formalityLevel || 50}%` }}
              />
            </div>
          </div>

          {/* Confidence */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-slate-900">Confidence</p>
                <p className="text-xs text-slate-500">Tentative ↔ Bold & Authoritative</p>
              </div>
              <span className="text-sm font-black text-indigo-600">{brand.voiceAndTone?.confidenceLevel || brand.confidenceLevel || 50}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-rose-500 transition-all duration-300"
                style={{ width: `${brand.voiceAndTone?.confidenceLevel || brand.confidenceLevel || 50}%` }}
              />
            </div>
          </div>
        </div>

        {/* Voice Description */}
        {brand.voiceAndTone?.voiceDescription || brand.voiceDescription && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4 group/voice hover:border-indigo-200 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-700 mb-1">VOICE PERSONALITY</p>
                {editingField === "voiceDescription" ? (
                  <div className="space-y-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit("voiceDescription")}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-lime-400 text-slate-900 hover:bg-lime-500 transition-colors font-bold text-xs"
                      >
                        <Check className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors font-bold text-xs"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-700">{brand.voiceAndTone?.voiceDescription || brand.voiceDescription}</p>
                )}
              </div>
              {editingField !== "voiceDescription" && (
                <button
                  onClick={() => startEditing("voiceDescription", brand.voiceAndTone?.voiceDescription || brand.voiceDescription || "")}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors opacity-0 group-hover/voice:opacity-100 flex-shrink-0"
                >
                  ✏️
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Visual Identity */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
        <h3 className="text-lg font-black text-slate-900 mb-4">Visual Identity</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Logo */}
          <div>
            <p className="text-xs font-bold text-slate-600 mb-2">LOGO</p>
            {brand.logoUrl ? (
              <div className="w-full h-24 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                <img src={brand.logoUrl} alt="Brand logo" className="w-full h-full object-contain p-2" />
              </div>
            ) : (
              <div className="w-full h-24 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-500 text-xs font-bold">
                Add logo
              </div>
            )}
          </div>

          {/* Typography */}
          <div>
            <p className="text-xs font-bold text-slate-600 mb-2">TYPOGRAPHY</p>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p
                className="text-2xl font-black text-slate-900 mb-2 line-clamp-2"
                style={{ fontFamily: `"${brand.fontFamily}", sans-serif` }}
              >
                {brand.brandName || "Brand Name"}
              </p>
              <p className="text-xs text-slate-600">
                {brand.visualIdentity?.typography?.source || brand.fontSource === "google" ? "Google Font: " : "Custom Font: "}
                <span className="font-bold">{brand.fontFamily}</span>
              </p>
            </div>
          </div>

          {/* Colors */}
          <div className="md:col-span-2">
            <p className="text-xs font-bold text-slate-600 mb-2">COLOR PALETTE</p>
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                {(brand.visualIdentity?.colors || brand.primaryColors || []).map((color) => (
                  <div
                    key={color}
                    className="w-10 h-10 rounded-lg border-2 border-slate-200 hover:border-slate-400 transition-colors cursor-help"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              {brand.secondaryColors.length > 0 && (
                <div className="flex gap-2 flex-wrap opacity-60">
                  {brand.secondaryColors.map((color) => (
                    <div
                      key={color}
                      className="w-10 h-10 rounded-lg border-2 border-slate-200 hover:border-slate-400 transition-colors cursor-help"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {brand.visualIdentity?.visualNotes || brand.visualNotes && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4 group/visual hover:border-indigo-200 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-700 mb-1">VISUAL GUIDELINES</p>
                {editingField === "visualNotes" ? (
                  <div className="space-y-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full px-3 py-2 rounded border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit("visualNotes")}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-lime-400 text-slate-900 hover:bg-lime-500 transition-colors font-bold text-xs"
                      >
                        <Check className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors font-bold text-xs"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-700">{brand.visualIdentity?.visualNotes || brand.visualNotes}</p>
                )}
              </div>
              {editingField !== "visualNotes" && (
                <button
                  onClick={() => startEditing("visualNotes", brand.visualIdentity?.visualNotes || brand.visualNotes || "")}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors opacity-0 group-hover/visual:opacity-100 flex-shrink-0"
                >
                  ✏️
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Deep Dive CTAs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <button className="px-4 py-3 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors font-bold text-xs flex flex-col items-center gap-1">
          👥
          <span>Personas</span>
        </button>
        <button className="px-4 py-3 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors font-bold text-xs flex flex-col items-center gap-1">
          🎯
          <span>Goals</span>
        </button>
        <button className="px-4 py-3 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors font-bold text-xs flex flex-col items-center gap-1">
          ⚖️
          <span>Guardrails</span>
        </button>
      </div>
    </div>
  );
}
