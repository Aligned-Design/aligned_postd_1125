import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";

export default function Screen1SignUp() {
  const { signUp, setOnboardingStep } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email";
    if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (validate()) {
      try {
        // Extract name from email for now (can be updated later)
        const name = email.split("@")[0];
        await signUp({ name, email, password, role: "single_business" });
        setOnboardingStep(2);
      } catch (error) {
        setErrors({ 
          email: error instanceof Error ? error.message : "Signup failed. Please try again." 
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress Indicator */}
        <OnboardingProgress currentStep={1} totalSteps={10} label="Account setup" />

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 mb-4">
            <span className="text-white font-black text-lg">A</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3">
            Welcome to Postd
          </h1>
          <p className="text-slate-600 font-medium mb-1">
            Marketing that stays true to your brand.
          </p>
          <p className="text-slate-500 text-sm">
            Get started in under 2 minutes. Let's go! 🚀
          </p>
        </div>

        {/* Sign-Up Form */}
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-8 space-y-5 mb-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none ${
                errors.email
                  ? "border-red-300 bg-red-50/50"
                  : "border-slate-200 bg-white/50 focus:border-indigo-500 focus:bg-white"
              }`}
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none ${
                errors.password
                  ? "border-red-300 bg-red-50/50"
                  : "border-slate-200 bg-white/50 focus:border-indigo-500 focus:bg-white"
              }`}
            />
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password}</p>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleContinue}
          className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
        >
          Continue
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Footer Text */}
        <p className="text-xs text-slate-500 text-center mt-6">
          Already have an account?{" "}
          <a
            href="#"
            className="text-indigo-600 font-bold hover:text-indigo-700"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
