import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Plus, X, Info, Building2, User } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export default function Screen2RoleSetup() {
  const { user, updateUser, setOnboardingStep } = useAuth();
  const [selectedRole, setSelectedRole] = useState<"agency" | "brand" | null>(
    null,
  );
  const [clientCount, setClientCount] = useState<string>("");
  const [teamEmails, setTeamEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedRole) {
      newErrors.role = "Please select your role";
      setErrors(newErrors);
      return false;
    }

    if (selectedRole === "agency") {
      if (!clientCount)
        newErrors.clientCount = "Please specify number of clients";
    } else {
      if (!businessName.trim())
        newErrors.businessName = "Business name is required";
      if (!industry) newErrors.industry = "Please select an industry";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addTeamMember = () => {
    if (
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmail) &&
      !teamEmails.includes(currentEmail)
    ) {
      setTeamEmails([...teamEmails, currentEmail]);
      setCurrentEmail("");
    }
  };

  const removeTeamMember = (email: string) => {
    setTeamEmails(teamEmails.filter((e) => e !== email));
  };

  const handleContinue = () => {
    if (validate()) {
      updateUser({
        role: selectedRole,
        clientCount:
          selectedRole === "agency" ? parseInt(clientCount) : undefined,
        teamMembers: selectedRole === "agency" ? teamEmails : undefined,
        businessName: selectedRole === "brand" ? businessName : undefined,
        website: selectedRole === "brand" ? website : undefined,
        industry: selectedRole === "brand" ? industry : undefined,
        workspaceName:
          selectedRole === "agency" ? `Workspace ${Date.now()}` : businessName,
      });
      setOnboardingStep(3);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Progress Indicator */}
        <OnboardingProgress currentStep={2} totalSteps={5} label="Your role" />

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            How will you use Aligned?
          </h1>
          <p className="text-slate-600 font-medium">
            We'll personalize everything for you
          </p>
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-50 rounded-full">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-800 font-medium">
              Don't worry—you can change this anytime in Settings
            </span>
          </div>
        </div>

        {/* Role Selection Cards */}
        {!selectedRole ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Agency Option */}
            <button
              onClick={() => setSelectedRole("agency")}
              className="group relative bg-white/50 backdrop-blur-xl rounded-2xl border-2 border-slate-200 hover:border-indigo-400 p-8 text-left transition-all hover:shadow-xl"
            >
              <div className="absolute top-4 right-4">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <button className="p-1 rounded-full hover:bg-slate-100 transition-colors">
                      <Info className="w-4 h-4 text-slate-400" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80" align="end">
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm">Agency Features</h4>
                      <ul className="text-xs text-slate-600 space-y-1">
                        <li>• Manage 10+ client brands from one dashboard</li>
                        <li>• White-label client portals with your branding</li>
                        <li>• Team collaboration and role-based permissions</li>
                        <li>• Client billing and subscription management</li>
                        <li>• Advanced reporting and analytics</li>
                      </ul>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>

              <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                <Building2 className="w-7 h-7 text-indigo-600" />
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-2">
                I run an agency
              </h3>

              <p className="text-sm text-slate-600 mb-4">
                Manage multiple client brands, white-label client portals, and
                collaborate with your team. Perfect for agencies managing 3+ clients.
              </p>

              <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold">
                <span>Best for agencies managing 3+ clients</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>

            {/* Brand/Creator Option */}
            <button
              onClick={() => setSelectedRole("brand")}
              className="group relative bg-white/50 backdrop-blur-xl rounded-2xl border-2 border-slate-200 hover:border-indigo-400 p-8 text-left transition-all hover:shadow-xl"
            >
              <div className="absolute top-4 right-4">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <button className="p-1 rounded-full hover:bg-slate-100 transition-colors">
                      <Info className="w-4 h-4 text-slate-400" />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80" align="end">
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm">Brand Features</h4>
                      <ul className="text-xs text-slate-600 space-y-1">
                        <li>• Focus on managing a single brand or business</li>
                        <li>• Invite team members and collaborators</li>
                        <li>• Streamlined content creation workflow</li>
                        <li>• Brand consistency tools and analytics</li>
                        <li>• Direct social platform integrations</li>
                      </ul>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>

              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <User className="w-7 h-7 text-blue-600" />
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-2">
                I manage a single brand/business
              </h3>

              <p className="text-sm text-slate-600 mb-4">
                Focus on one business, invite team members, and streamline your
                content workflow
              </p>

              <div className="flex items-center gap-2 text-xs text-blue-600 font-bold">
                <span>Best for businesses and solo creators</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          </div>
        ) : (
          <>
            {/* Selected Role Display */}
            <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedRole === "agency" ? "bg-indigo-100" : "bg-blue-100"
                  }`}
                >
                  {selectedRole === "agency" ? (
                    <Building2 className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <User className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">
                    Selected role
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedRole === "agency"
                      ? "Agency"
                      : "Single Brand/Business"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRole(null)}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium underline"
              >
                Change
              </button>
            </div>

            {/* Role-Specific Form */}
            <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-8 space-y-6 mb-6">
              {selectedRole === "agency" ? (
                <>
                  {/* Agency: Client Count */}
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      How many clients will you manage?
                    </label>
                    <select
                      value={clientCount}
                      onChange={(e) => setClientCount(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none ${
                        errors.clientCount
                          ? "border-red-300 bg-red-50/50"
                          : "border-slate-200 bg-white/50 focus:border-indigo-500"
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="1">1 Client</option>
                      <option value="5">2-5 Clients</option>
                      <option value="10">6-10 Clients</option>
                      <option value="20">11-20 Clients</option>
                      <option value="50">20+ Clients</option>
                    </select>
                    {errors.clientCount && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.clientCount}
                      </p>
                    )}
                  </div>

                  {/* Agency: Team Members */}
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Invite Your Team{" "}
                      <span className="text-slate-500 font-normal">
                        (Optional — you can do this later)
                      </span>
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="email"
                        value={currentEmail}
                        onChange={(e) => setCurrentEmail(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addTeamMember()}
                        placeholder="team@example.com"
                        className="flex-1 px-4 py-2 rounded-lg border-2 border-slate-200 bg-white/50 focus:border-indigo-500 focus:outline-none text-sm"
                      />
                      <button
                        onClick={addTeamMember}
                        className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-bold text-sm flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                    {teamEmails.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {teamEmails.map((email) => (
                          <div
                            key={email}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium"
                          >
                            {email}
                            <button
                              onClick={() => removeTeamMember(email)}
                              className="hover:text-indigo-900 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Single Business: Business Name */}
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Your Business Name"
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none ${
                        errors.businessName
                          ? "border-red-300 bg-red-50/50"
                          : "border-slate-200 bg-white/50 focus:border-indigo-500"
                      }`}
                    />
                    {errors.businessName && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.businessName}
                      </p>
                    )}
                  </div>

                  {/* Single Business: Website */}
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Website or Social URL{" "}
                      <span className="text-slate-500 font-normal">
                        (Optional)
                      </span>
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 bg-white/50 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Single Business: Industry */}
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Industry <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none ${
                        errors.industry
                          ? "border-red-300 bg-red-50/50"
                          : "border-slate-200 bg-white/50 focus:border-indigo-500"
                      }`}
                    >
                      <option value="">Select an industry...</option>
                      <option value="health_wellness">Health & Wellness</option>
                      <option value="ecommerce">E-Commerce</option>
                      <option value="saas">SaaS / Technology</option>
                      <option value="agency">Marketing Agency</option>
                      <option value="nonprofit">Non-Profit</option>
                      <option value="education">Education</option>
                      <option value="real_estate">Real Estate</option>
                      <option value="hospitality">Hospitality & Travel</option>
                      <option value="professional_services">
                        Professional Services
                      </option>
                      <option value="retail">Retail</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.industry && (
                      <p className="text-xs text-red-600 mt-1">
                        {errors.industry}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* CTA Button */}
        {selectedRole && (
          <button
            onClick={handleContinue}
            className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
          >
            Continue to {selectedRole === "agency" ? "Agency" : "Brand"} Setup
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
}
