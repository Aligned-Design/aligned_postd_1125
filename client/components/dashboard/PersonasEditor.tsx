import { useState } from "react";
import { BrandGuide, Persona } from "@/types/brandGuide";
import { Plus, X, Sparkles, Edit2 } from "lucide-react";

interface PersonasEditorProps {
  brand: BrandGuide;
  onUpdate: (updates: Partial<BrandGuide>) => void;
}

interface PersonaFormState {
  isOpen: boolean;
  editingId: string | null;
  formData: Omit<Persona, "id">;
}

// Mock AI persona generation
function generateAIPersona(): Persona {
  const names = ["Sarah Chen", "James Rodriguez", "Emma Thompson", "Michael Park"];
  const roles = ["Marketing Manager", "Content Creator", "Brand Strategist", "Social Media Manager"];
  const painPoints = [
    ["Time management", "Content consistency", "Budget constraints"],
    ["Audience growth", "Engagement rates", "Analytics overwhelm"],
    ["Brand alignment", "Message clarity", "Resource allocation"],
  ];
  const goals = [
    ["Increase brand visibility", "Engage target audience", "Build community"],
    ["Grow followers", "Boost engagement", "Create viral content"],
    ["Maintain consistency", "Develop strategy", "Measure impact"],
  ];

  const idx = Math.floor(Math.random() * names.length);

  return {
    id: `persona-${Date.now()}`,
    name: names[idx],
    role: roles[idx],
    description: `${names[idx]} is a ${roles[idx]} who works in the marketing industry. They are looking to streamline their workflow and improve their brand's consistency across channels.`,
    painPoints: painPoints[idx % painPoints.length],
    goals: goals[idx % goals.length],
    isAIGenerated: true,
  };
}

export function PersonasEditor({ brand, onUpdate }: PersonasEditorProps) {
  const personas = brand.personas || [];

  const [formState, setFormState] = useState<PersonaFormState>({
    isOpen: false,
    editingId: null,
    formData: {
      name: "",
      role: "",
      description: "",
      painPoints: [],
      goals: [],
      isAIGenerated: false,
    },
  });

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleOpenForm = (persona?: Persona) => {
    if (persona) {
      setFormState({
        isOpen: true,
        editingId: persona.id,
        formData: {
          name: persona.name,
          role: persona.role,
          description: persona.description,
          painPoints: persona.painPoints,
          goals: persona.goals,
          isAIGenerated: persona.isAIGenerated,
        },
      });
    } else {
      setFormState({
        isOpen: true,
        editingId: null,
        formData: {
          name: "",
          role: "",
          description: "",
          painPoints: [],
          goals: [],
          isAIGenerated: false,
        },
      });
    }
  };

  const handleCloseForm = () => {
    setFormState({
      isOpen: false,
      editingId: null,
      formData: {
        name: "",
        role: "",
        description: "",
        painPoints: [],
        goals: [],
        isAIGenerated: false,
      },
    });
  };

  const handleSavePersona = () => {
    if (!formState.formData.name || !formState.formData.role) return;

    let updatedPersonas = [...personas];

    if (formState.editingId) {
      updatedPersonas = updatedPersonas.map((p) =>
        p.id === formState.editingId
          ? { ...p, ...formState.formData }
          : p
      );
    } else {
      const newPersona: Persona = {
        id: `persona-${Date.now()}`,
        ...formState.formData,
      };
      updatedPersonas.push(newPersona);
    }

    onUpdate({ personas: updatedPersonas });
    handleCloseForm();
  };

  const handleDeletePersona = (id: string) => {
    onUpdate({ personas: personas.filter((p) => p.id !== id) });
  };

  const handleGenerateAI = () => {
    setIsGeneratingAI(true);
    setTimeout(() => {
      const newPersona = generateAIPersona();
      onUpdate({ personas: [...personas, newPersona] });
      setIsGeneratingAI(false);
    }, 1500);
  };

  const handleAddPainPoint = () => {
    setFormState({
      ...formState,
      formData: {
        ...formState.formData,
        painPoints: [...formState.formData.painPoints, ""],
      },
    });
  };

  const handleAddGoal = () => {
    setFormState({
      ...formState,
      formData: {
        ...formState.formData,
        goals: [...formState.formData.goals, ""],
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-slate-900">Target Personas</h2>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateAI}
              disabled={isGeneratingAI}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-sm"
            >
              <Sparkles className="w-4 h-4" />
              {isGeneratingAI ? "Generating..." : "AI Generate"}
            </button>
            <button
              onClick={() => handleOpenForm()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors font-bold text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Persona
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-600">
          Create detailed personas of your ideal customers to guide brand messaging and strategy.
        </p>
      </div>

      {/* Personas Grid */}
      {personas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personas.map((persona) => (
            <div
              key={persona.id}
              className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-5 hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{persona.name}</h3>
                  <p className="text-sm text-slate-600 font-bold">{persona.role}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenForm(persona)}
                    className="p-2 hover:bg-indigo-100 rounded-lg transition-colors text-indigo-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePersona(persona.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {persona.isAIGenerated && (
                <div className="mb-2 inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                  AI Generated
                </div>
              )}

              <p className="text-sm text-slate-700 mb-3">{persona.description}</p>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-slate-600 mb-1">Pain Points</p>
                  <div className="flex flex-wrap gap-1">
                    {persona.painPoints.map((point, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold"
                      >
                        {point}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-600 mb-1">Goals</p>
                  <div className="flex flex-wrap gap-1">
                    {persona.goals.map((goal, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold"
                      >
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-8 text-center">
          <div className="text-4xl mb-3">👥</div>
          <h3 className="text-lg font-black text-slate-900 mb-2">No Personas Yet</h3>
          <p className="text-sm text-slate-600 mb-4">
            Start by creating personas manually or use AI to auto-generate them.
          </p>
          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-bold text-sm inline-block"
          >
            Create First Persona
          </button>
        </div>
      )}

      {/* Form Modal */}
      {formState.isOpen && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-900">
              {formState.editingId ? "Edit Persona" : "New Persona"}
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
              <label className="block text-sm font-black text-slate-900 mb-1">Name</label>
              <input
                type="text"
                value={formState.formData.name}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    formData: { ...formState.formData, name: e.target.value },
                  })
                }
                placeholder="e.g., Sarah Chen"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 mb-1">Role/Title</label>
              <input
                type="text"
                value={formState.formData.role}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    formData: { ...formState.formData, role: e.target.value },
                  })
                }
                placeholder="e.g., Marketing Manager"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 mb-1">Description</label>
              <textarea
                value={formState.formData.description}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    formData: { ...formState.formData, description: e.target.value },
                  })
                }
                placeholder="Describe this persona..."
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                rows={3}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-black text-slate-900">Pain Points</label>
                <button
                  onClick={handleAddPainPoint}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-2">
                {formState.formData.painPoints.map((point, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => {
                        const newPainPoints = [...formState.formData.painPoints];
                        newPainPoints[idx] = e.target.value;
                        setFormState({
                          ...formState,
                          formData: {
                            ...formState.formData,
                            painPoints: newPainPoints,
                          },
                        });
                      }}
                      placeholder="e.g., Time management"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <button
                      onClick={() => {
                        setFormState({
                          ...formState,
                          formData: {
                            ...formState.formData,
                            painPoints: formState.formData.painPoints.filter((_, i) => i !== idx),
                          },
                        });
                      }}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-black text-slate-900">Goals</label>
                <button
                  onClick={handleAddGoal}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-2">
                {formState.formData.goals.map((goal, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => {
                        const newGoals = [...formState.formData.goals];
                        newGoals[idx] = e.target.value;
                        setFormState({
                          ...formState,
                          formData: {
                            ...formState.formData,
                            goals: newGoals,
                          },
                        });
                      }}
                      placeholder="e.g., Increase brand visibility"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <button
                      onClick={() => {
                        setFormState({
                          ...formState,
                          formData: {
                            ...formState.formData,
                            goals: formState.formData.goals.filter((_, i) => i !== idx),
                          },
                        });
                      }}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSavePersona}
                disabled={!formState.formData.name || !formState.formData.role}
                className="flex-1 px-4 py-2 rounded-lg bg-lime-400 text-slate-900 hover:bg-lime-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
              >
                Save Persona
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
