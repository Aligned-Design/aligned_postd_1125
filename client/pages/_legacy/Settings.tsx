// LEGACY PAGE (archived)
// This file is not routed or imported anywhere.
// Canonical implementation lives under client/app/(postd)/...
// Safe to delete after one or two stable releases.

import { AppShell } from "@postd/layout/AppShell";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useState } from "react";
import { Mail, Plus, Trash2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { currentWorkspace, updateWorkspace, addMember, updateMember, removeMember } = useWorkspace();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"workspace" | "members" | "integrations" | "billing">("workspace");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Manager" | "Contributor" | "Viewer">("Contributor");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!currentWorkspace) {
    return null;
  }

  const handleWorkspaceUpdate = (field: string, value: any) => {
    updateWorkspace(currentWorkspace.id, { [field]: value });
    toast({
      title: "Updated",
      description: `${field} has been updated`,
    });
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
      });
      return;
    }

    const newMember = {
      id: `u-${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      avatar: "👤",
    };

    addMember(currentWorkspace.id, newMember);
    toast({
      title: "Invitation sent",
      description: `${inviteEmail} has been invited as ${inviteRole}`,
    });

    setInviteEmail("");
    setInviteRole("Contributor");
    setShowInviteForm(false);
  };

  const handleRemoveMember = (memberId: string) => {
    removeMember(currentWorkspace.id, memberId);
    toast({
      title: "Member removed",
      description: "The user has been removed from this workspace",
    });
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(currentWorkspace.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50/30 via-white to-blue-50/20">
        {/* Header */}
        <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-white/60">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{currentWorkspace.logo || "🏢"}</span>
              <div>
                <h1 className="text-3xl font-black text-slate-900">{currentWorkspace.name} Settings</h1>
                <p className="text-sm text-slate-600 mt-1">Manage your workspace configuration and team</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap border-b border-slate-200">
              {(["workspace", "members", "integrations", "billing"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${
                    activeTab === tab
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab === "workspace"
                    ? "Workspace"
                    : tab === "members"
                    ? "Members & Permissions"
                    : tab === "integrations"
                    ? "Integrations"
                    : "Billing"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8">
          {/* WORKSPACE TAB */}
          {activeTab === "workspace" && (
            <div className="max-w-2xl space-y-6">
              {/* Workspace ID */}
              <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
                <h2 className="text-lg font-black text-slate-900 mb-4">Workspace ID</h2>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <code className="text-xs font-mono text-slate-600 flex-1">{currentWorkspace.id}</code>
                  <button
                    onClick={handleCopyId}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Workspace Name */}
              <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
                <h2 className="text-lg font-black text-slate-900 mb-4">Workspace Name</h2>
                <input
                  type="text"
                  value={currentWorkspace.name}
                  onChange={(e) => handleWorkspaceUpdate("name", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Industry */}
              <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
                <h2 className="text-lg font-black text-slate-900 mb-4">Industry</h2>
                <input
                  type="text"
                  value={currentWorkspace.industry || ""}
                  onChange={(e) => handleWorkspaceUpdate("industry", e.target.value)}
                  placeholder="e.g., Events & Entertainment"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Timezone */}
              <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
                <h2 className="text-lg font-black text-slate-900 mb-4">Timezone</h2>
                <input
                  type="text"
                  value={currentWorkspace.timezone || "America/New_York"}
                  onChange={(e) => handleWorkspaceUpdate("timezone", e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50/50 backdrop-blur-xl rounded-xl border border-red-200 p-6">
                <h2 className="text-lg font-black text-red-900 mb-4">⚠️ Danger Zone</h2>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Workspace
                </button>
                {showDeleteConfirm && (
                  <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
                    <p className="text-red-900 font-bold mb-3">
                      Are you sure? This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          toast({
                            title: "Workspace deleted",
                            description: "The workspace has been deleted",
                          });
                        }}
                        className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MEMBERS TAB */}
          {activeTab === "members" && (
            <div className="max-w-3xl space-y-6">
              {/* Members List */}
              <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black text-slate-900">Team Members ({currentWorkspace.members.length})</h2>
                  {!showInviteForm && (
                    <button
                      onClick={() => setShowInviteForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-lime-400 text-indigo-950 font-bold rounded-lg hover:bg-lime-500 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Invite
                    </button>
                  )}
                </div>

                {showInviteForm && (
                  <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                    />
                    <label className="block text-sm font-bold text-slate-700 mb-2">Role *</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                    >
                      <option value="Viewer">Viewer (Read-only)</option>
                      <option value="Contributor">Contributor (Upload & draft)</option>
                      <option value="Manager">Manager (Edit & approve)</option>
                      <option value="Admin">Admin (Full access)</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowInviteForm(false)}
                        className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleInvite}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
                      >
                        Send Invite
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {currentWorkspace.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{member.avatar || "👤"}</span>
                        <div>
                          <p className="font-bold text-slate-900">{member.name}</p>
                          <p className="text-xs text-slate-600">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) =>
                            updateMember(currentWorkspace.id, member.id, {
                              role: e.target.value as any,
                            })
                          }
                          className="px-3 py-1 text-sm border border-slate-300 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Viewer">Viewer</option>
                          <option value="Contributor">Contributor</option>
                          <option value="Manager">Manager</option>
                          <option value="Admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* INTEGRATIONS TAB */}
          {activeTab === "integrations" && (
            <div className="max-w-3xl space-y-6">
              <div className="text-sm text-slate-600 mb-6">
                <p>Connect your favorite tools and platforms to your workspace.</p>
              </div>

              {["Google Business", "Meta Platforms", "LinkedIn", "Slack", "Zapier", "Notion"].map((integration) => (
                <div key={integration} className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-slate-900">{integration}</h3>
                    <p className="text-sm text-slate-600 mt-1">Not connected</p>
                  </div>
                  <button className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                    Connect
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* BILLING TAB */}
          {activeTab === "billing" && (
            <div className="max-w-3xl">
              <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-6 text-center">
                <div className="text-4xl mb-4">💳</div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Billing</h2>
                <p className="text-slate-600 mb-6">Billing management will be available in a future release.</p>
                <p className="text-sm text-slate-500">
                  Currently, billing is managed at the agency level. Contact your administrator for payment details.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
