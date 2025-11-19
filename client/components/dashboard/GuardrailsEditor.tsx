/* eslint-disable */
import { useState } from "react";
import { BrandGuide, Guardrail } from "@/types/brandGuide";
import { Plus, X, Edit2, AlertCircle } from "lucide-react";

interface GuardrailsEditorProps {
  brand: BrandGuide;
  onUpdate: (updates: Partial<BrandGuide>) => void;
}

interface GuardrailFormState {
  isOpen: boolean;
  editingId: string | null;
  formData: Omit<Guardrail, "id">;
}

const CATEGORY_COLORS: Record<string, string> = {
  tone: "bg-purple-100 text-purple-700 border-purple-300",
  messaging: "bg-blue-100 text-blue-700 border-blue-300",
  visual: "bg-pink-100 text-pink-700 border-pink-300",
  behavior: "bg-green-100 text-green-700 border-green-300",
};

const CATEGORY_LABELS: Record<string, string> = {
  tone: "🎤 Tone",
  messaging: "💬 Messaging",
  visual: "🎨 Visual",
  behavior: "🚀 Behavior",
};

const DEFAULT_GUARDRAILS = [
  {
    title: "Avoid Jargon",
    description:
      "Keep language accessible to all audience members. No industry jargon without explanation.",
    category: "messaging" as const,
  },
  {
    title: "Stay Authentic",
    description:
      "Always speak from the heart. Avoid corporate-speak that doesn't reflect our values.",
    category: "tone" as const,
  },
  {
    title: "Inclusive Language",
    description:
      "Use language that welcomes everyone. Be mindful of different cultures, abilities, and perspectives.",
    category: "messaging" as const,
  },
  {
    title: "Logo Minimum Size",
    description:
      "Never display logo smaller than 100px. Maintain clear space around all sides.",
    category: "visual" as const,
  },
  {
    title: "Color Accuracy",
    description:
      "Always use approved brand colors. Never alter or adjust hues for any reason.",
    category: "visual" as const,
  },
  {
    title: "Respect Guidelines",
    description:
      "Follow all brand guidelines consistently across all channels and content.",
    category: "behavior" as const,
  },
];

export function GuardrailsEditor({ brand, onUpdate }: GuardrailsEditorProps) {
  const guardrails = brand.guardrails || [];

  const [formState, setFormState] = useState<GuardrailFormState>({
    isOpen: false,
    editingId: null,
    formData: {
      title: "",
      description: "",
      category: "tone",
      isActive: true,
    },
  });

  const handleOpenForm = (guardrail?: Guardrail) => {
    if (guardrail) {
      setFormState({
        isOpen: true,
        editingId: guardrail.id,
        formData: {
          title: guardrail.title,
          description: guardrail.description,
          category: guardrail.category,
          isActive: guardrail.isActive,
        },
      });
    } else {
      setFormState({
        isOpen: true,
        editingId: null,
        formData: {
          title: "",
          description: "",
          category: "tone",
          isActive: true,
        },
      });
    }
  };

  const handleCloseForm = () => {
    setFormState({
      isOpen: false,
      editingId: null,
      formData: {
        title: "",
        description: "",
        category: "tone",
        isActive: true,
      },
    });
  };

  const handleSaveGuardrail = () => {
    if (!formState.formData.title) return;

    let updatedGuardrails = [...guardrails];

    if (formState.editingId) {
      updatedGuardrails = updatedGuardrails.map((g) =>
        g.id === formState.editingId
          ? { ...g, ...formState.formData }
          : g
      );
    } else {
      const newGuardrail: Guardrail = {
        id: `guardrail-${Date.now()}`,
        ...formState.formData,
      };
      updatedGuardrails.push(newGuardrail);
    }

    onUpdate({ guardrails: updatedGuardrails });
    handleCloseForm();
  };

  const handleDeleteGuardrail = (id: string) => {
    onUpdate({ guardrails: guardrails.filter((g) => g.id !== id) });
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    const updatedGuardrails = guardrails.map((g) =>
      g.id === id ? { ...g, isActive: !isActive } : g
    );
    onUpdate({ guardrails: updatedGuardrails });
  };

  const handleAddDefault = () => {
    const newGuardrails = [
      ...guardrails,
      ...DEFAULT_GUARDRAILS.map((g) => ({
        id: `guardrail-${Date.now()}-${Math.random()}`,
        ...g,
        isActive: true,
      })),
    ];
    onUpdate({ guardrails: newGuardrails });
  };

  const categorizedGuardrails = {
    tone: guardrails.filter((g) => g.category === "tone"),
    messaging: guardrails.filter((g) => g.category === "messaging"),
    visual: guardrails.filter((g) => g.category === "visual"),
    behavior: guardrails.filter((g) => g.category === "behavior"),
  };

  const totalActive = guardrails.filter((g) => g.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Brand Guardrails</h2>
            <p className="text-sm text-slate-600 mt-1">
              {totalActive} of {guardrails.length} guardrails active
            </p>
          </div>
          <div className="flex gap-2">
            {guardrails.length === 0 && (
              <button
              onClick={handleAddDefault}
              className="px-3 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors font-bold text-sm"
            >
              Add Defaults
            </button>
            )}
            <button
              onClick={() => handleOpenForm()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors font-bold text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Guardrail
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-600">
          Define boundaries and rules to keep your brand communication consistent and on-brand.
        </p>
      </div>

      {/* Guardrails by Category */}
      {guardrails.length > 0 ? (
        <div className="space-y-6">
          {(
            [
              { key: "tone", label: "🎤 Tone" },
              { key: "messaging", label: "💬 Messaging" },
              { key: "visual", label: "🎨 Visual" },
              { key: "behavior", label: "🚀 Behavior" },
            ] as const
          ).map(({ key, label }) =>
            categorizedGuardrails[key].length > 0 ? (
              <div key={key}>
                <h3 className="text-sm font-black text-slate-900 mb-3 px-2">{label}</h3>
                <div className="space-y-2">
                  {categorizedGuardrails[key].map((guardrail) => (
                    <div
                      key={guardrail.id}
                      className={`bg-white/50 backdrop-blur-xl rounded-lg border border-white/60 p-4 flex items-start gap-3 transition-opacity ${
                        guardrail.isActive ? "opacity-100" : "opacity-60"
                      }`}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={guardrail.isActive}
                        onChange={() =>
                          handleToggleActive(guardrail.id, guardrail.isActive)
                        }
                        className="w-5 h-5 mt-0.5 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-slate-900 mb-1">
                          {guardrail.title}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {guardrail.description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleOpenForm(guardrail)}
                          className="p-2 hover:bg-indigo-100 rounded-lg transition-colors text-indigo-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGuardrail(guardrail.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-8 text-center">
          <div className="text-4xl mb-3">⚖️</div>
          <h3 className="text-lg font-black text-slate-900 mb-2">No Guardrails Yet</h3>
          <p className="text-sm text-slate-600 mb-4">
            Start with default guardrails or create your own brand-specific rules.
          </p>
          <button
            onClick={handleAddDefault}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-bold text-sm inline-block"
          >
            Add Default Guardrails
          </button>
        </div>
      )}

      {/* Tone Boundaries Preview */}
      {categorizedGuardrails.tone.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6">
          <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-600" />
            Tone Boundaries
          </h3>

          <div className="space-y-3">
            {categorizedGuardrails.tone
              .map((guardrail) => (
                <div key={guardrail.id} className="p-3 bg-white rounded-lg border border-purple-200">
                  <p className="text-sm font-bold text-slate-900">{guardrail.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{guardrail.description}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {formState.isOpen && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-900">
              {formState.editingId ? "Edit Guardrail" : "New Guardrail"}
            </h3>
            <button
              onClick={handleCloseForm}
              className="text-slate-600 hover:text-slate-900 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-black text-slate-900 mb-1">
                Guardrail Title
              </label>
              <input
                type="text"
                value={formState.formData.title}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    formData: { ...formState.formData, title: e.target.value },
                  })
                }
                placeholder="e.g., Avoid Jargon"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 mb-1">
                Description
              </label>
              <textarea
                value={formState.formData.description}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    formData: {
                      ...formState.formData,
                      description: e.target.value,
                    },
                  })
                }
                placeholder="Describe this guardrail..."
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 mb-2">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["tone", "messaging", "visual", "behavior"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() =>
                      setFormState({
                        ...formState,
                        formData: {
                          ...formState.formData,
                          category: cat,
                        },
                      })
                    }
                    className={`px-3 py-2 rounded-lg font-bold text-sm border-2 transition-all ${
                      formState.formData.category === cat
                        ? CATEGORY_COLORS[cat] + " border-current"
                        : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formState.formData.isActive}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    formData: {
                      ...formState.formData,
                      isActive: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isActive" className="text-sm font-bold text-slate-900 cursor-pointer">
                Active guardrail
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSaveGuardrail}
                disabled={!formState.formData.title}
                className="flex-1 px-4 py-2 rounded-lg bg-lime-400 text-slate-900 hover:bg-lime-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
              >
                Save Guardrail
              </button>
              <button
                onClick={handleCloseForm}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-200 text-slate-900 hover:bg-slate-300 transition-colors font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
