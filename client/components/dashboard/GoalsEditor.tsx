/* eslint-disable */
import { useState } from "react";
import { BrandGuide, BrandGoal } from "@/types/brandGuide";
import { Plus, X, Edit2, CheckCircle } from "lucide-react";

interface GoalsEditorProps {
  brand: BrandGuide;
  onUpdate: (updates: Partial<BrandGuide>) => void;
}

interface GoalFormState {
  isOpen: boolean;
  editingId: string | null;
  formData: Omit<BrandGoal, "id">;
}

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-slate-100 text-slate-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

export function GoalsEditor({ brand, onUpdate }: GoalsEditorProps) {
  const [formState, setFormState] = useState<GoalFormState>({
    isOpen: false,
    editingId: null,
    formData: {
      title: "",
      description: "",
      targetAudience: "",
      measurable: "",
      timeline: "",
      progress: 0,
      status: "not_started",
    },
  });

  const handleOpenForm = (goal?: BrandGoal) => {
    if (goal) {
      setFormState({
        isOpen: true,
        editingId: goal.id,
        formData: {
          title: goal.title,
          description: goal.description,
          targetAudience: goal.targetAudience,
          measurable: goal.measurable,
          timeline: goal.timeline,
          progress: goal.progress,
          status: goal.status,
        },
      });
    } else {
      setFormState({
        isOpen: true,
        editingId: null,
        formData: {
          title: "",
          description: "",
          targetAudience: "",
          measurable: "",
          timeline: "",
          progress: 0,
          status: "not_started",
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
        targetAudience: "",
        measurable: "",
        timeline: "",
        progress: 0,
        status: "not_started",
      },
    });
  };

  const handleSaveGoal = () => {
    if (!formState.formData.title) return;

    let updatedGoals = [...goals];

    if (formState.editingId) {
      updatedGoals = updatedGoals.map((g) =>
        g.id === formState.editingId
          ? { ...g, ...formState.formData }
          : g
      );
    } else {
      const newGoal: BrandGoal = {
        id: `goal-${Date.now()}`,
        ...formState.formData,
      };
      updatedGoals.push(newGoal);
    }

    onUpdate({ goals: updatedGoals });
    handleCloseForm();
  };

  const handleDeleteGoal = (id: string) => {
    onUpdate({ goals: goals.filter((g) => g.id !== id) });
  };

  const handleUpdateProgress = (id: string, progress: number) => {
    const updatedGoals = goals.map((g) =>
      g.id === id
        ? {
            ...g,
            progress,
            status:
              progress === 100
                ? "completed"
                : progress > 0
                ? "in_progress"
                : "not_started",
          }
        : g
    );
    onUpdate({ goals: updatedGoals });
  };

  const goals = brand.goals || [];
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const totalGoals = goals.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Brand Goals</h2>
            <p className="text-sm text-slate-600 mt-1">
              {totalGoals > 0
                ? `${completedGoals} of ${totalGoals} completed`
                : "No goals yet"}
            </p>
          </div>
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        </div>

        {totalGoals > 0 && (
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-lime-400 to-lime-500 transition-all duration-300"
              style={{ width: `${totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0}%` }}
            />
          </div>
        )}
      </div>

      {/* Goals Table */}
      {goals.length > 0 ? (
        <div className="space-y-3">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-4 hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <button
                  onClick={() =>
                    handleUpdateProgress(
                      goal.id,
                      goal.status === "completed" ? 0 : 100
                    )
                  }
                  className={`mt-1 flex-shrink-0 transition-colors ${
                    goal.status === "completed"
                      ? "text-green-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <CheckCircle className="w-6 h-6" />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className={`font-black text-slate-900 ${goal.status === "completed" ? "line-through text-slate-500" : ""}`}>
                        {goal.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-0.5">{goal.description}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${STATUS_COLORS[goal.status]}`}>
                      {STATUS_LABELS[goal.status]}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <p className="text-xs font-bold text-slate-600">Target Audience</p>
                      <p className="text-slate-700">{goal.targetAudience || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-600">Timeline</p>
                      <p className="text-slate-700">{goal.timeline || "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-slate-600">Success Metric</p>
                      <p className="text-slate-700">{goal.measurable || "—"}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Progress</span>
                      <span className="text-xs font-bold text-indigo-600">{goal.progress}%</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            goal.progress === 100
                              ? "bg-green-500"
                              : goal.progress > 0
                              ? "bg-yellow-500"
                              : "bg-slate-300"
                          }`}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={goal.progress}
                        onChange={(e) =>
                          handleUpdateProgress(goal.id, Number(e.target.value))
                        }
                        className="w-20 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleOpenForm(goal)}
                    className="p-2 hover:bg-indigo-100 rounded-lg transition-colors text-indigo-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-8 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-lg font-black text-slate-900 mb-2">No Goals Yet</h3>
          <p className="text-sm text-slate-600 mb-4">
            Set brand goals to track progress and measure success.
          </p>
          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-bold text-sm inline-block"
          >
            Create First Goal
          </button>
        </div>
      )}

      {/* Form Modal */}
      {formState.isOpen && (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-900">
              {formState.editingId ? "Edit Goal" : "New Goal"}
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
                Goal Title
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
                placeholder="e.g., Increase brand awareness"
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
                placeholder="Describe the goal..."
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-black text-slate-900 mb-1">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={formState.formData.targetAudience}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      formData: {
                        ...formState.formData,
                        targetAudience: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g., Millennials, B2B"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-900 mb-1">
                  Timeline
                </label>
                <input
                  type="text"
                  value={formState.formData.timeline}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      formData: {
                        ...formState.formData,
                        timeline: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g., Q1 2024"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 mb-1">
                Success Metric
              </label>
              <textarea
                value={formState.formData.measurable}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    formData: {
                      ...formState.formData,
                      measurable: e.target.value,
                    },
                  })
                }
                placeholder="How will you measure success? e.g., 50% increase in followers"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 mb-2">
                Initial Status
              </label>
              <select
                value={formState.formData.status}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    formData: {
                      ...formState.formData,
                      status: e.target.value as any,
                    },
                  })
                }
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSaveGoal}
                disabled={!formState.formData.title}
                className="flex-1 px-4 py-2 rounded-lg bg-lime-400 text-slate-900 hover:bg-lime-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
              >
                Save Goal
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
