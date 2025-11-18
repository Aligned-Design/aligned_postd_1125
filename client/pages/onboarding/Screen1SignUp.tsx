import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { PasswordInput } from "@/components/ui/password-input";

export default function Screen1SignUp() {
  const { signUp, setOnboardingStep } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
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
        const errorMessage = error instanceof Error ? error.message : "Signup failed. Please try again.";
        
        // ✅ Check if email already exists - redirect to login
        if (
          errorMessage.toLowerCase().includes("already exists") ||
          errorMessage.toLowerCase().includes("user_already_exists") ||
          errorMessage.toLowerCase().includes("already registered")
        ) {
          // Redirect to login with email pre-filled
          navigate(`/login?email=${encodeURIComponent(email)}&message=already_exists`);
          return;
        }
        
        // Use user-friendly error message
        const friendlyMessage = errorMessage.toLowerCase().includes("password")
          ? "Password must be at least 6 characters"
          : errorMessage.toLowerCase().includes("email")
          ? "Please enter a valid email address"
          : "Something went wrong. Please try again.";
        
        setErrors({ 
          email: friendlyMessage
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 mb-4 animate-pulse">
            <span className="text-white font-black text-xl">A</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3">
            Welcome to Aligned AI
          </h1>
          <p className="text-slate-600 font-medium text-lg mb-2">
            We'll help you create content that sounds like you,<br />
            looks like you, and works like magic.
          </p>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-1 gap-3 mb-8">
          <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 text-lg">✨</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 mb-1">AI that learns your brand voice</h3>
                <p className="text-xs text-slate-600">
                  We analyze your website, content, and style to create authentic content that matches your brand perfectly.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-lg">⚡</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 mb-1">Ready-to-post content in minutes</h3>
                <p className="text-xs text-slate-600">
                  No more staring at blank pages. Get complete, polished content with hashtags, CTAs, and platform optimization.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 text-lg">🚀</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 mb-1">Multi-platform publishing made simple</h3>
                <p className="text-xs text-slate-600">
                  Create once, publish everywhere. Instagram, LinkedIn, Facebook, email, and more—all from one place.
                </p>
              </div>
            </div>
          </div>
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
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              error={errors.password}
              id="signup-password"
              required
            />
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleContinue}
          className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"
        >
          Let's get started
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
        
        {/* Social Proof */}
        <p className="text-xs text-slate-500 text-center mt-4">
          Trusted by 500+ agencies and content teams
        </p>

        {/* Footer Text */}
        <p className="text-xs text-slate-500 text-center mt-6">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-indigo-600 font-bold hover:text-indigo-700 underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
