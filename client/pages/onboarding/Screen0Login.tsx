import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { PasswordInput } from "@/components/ui/password-input";

export default function Screen0Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  // Check if redirected from signup with "email already exists"
  const isAlreadyExists = searchParams.get("message") === "already_exists";

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email";
    if (!password.trim()) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (validate()) {
      setLoading(true);
      setErrors({});
      try {
        const success = await login?.(email, password);
        if (success) {
          // Login successful - AuthContext will handle navigation
          navigate("/dashboard");
        } else {
          setErrors({
            password: "Invalid email or password. Please try again.",
          });
        }
      } catch (error) {
        setErrors({
          password: error instanceof Error ? error.message : "Login failed. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordEmail)) {
      setErrors({ email: "Please enter a valid email address" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || errorData?.message || "Failed to send reset email");
      }

      setForgotPasswordSent(true);
    } catch (error) {
      setErrors({
        email: error instanceof Error ? error.message : "Failed to send reset email. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress Indicator - hidden for login */}
        <div className="mb-8" />

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 mb-4">
            <span className="text-white font-black text-lg">A</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3">
            Welcome back
          </h1>
          <p className="text-slate-600 font-medium mb-1">
            Sign in to continue to Postd
          </p>
        </div>

        {/* Email Already Exists Notice */}
        {isAlreadyExists && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 font-medium">
              This email is already registered. Please log in below.
            </p>
          </div>
        )}

        {/* Forgot Password Success Message */}
        {forgotPasswordSent && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-900 font-medium">
              We've sent you a password reset email. Please check your inbox.
            </p>
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setForgotPasswordSent(false);
                setForgotPasswordEmail("");
              }}
              className="text-sm text-green-700 underline mt-2"
            >
              Return to login
            </button>
          </div>
        )}

        {/* Login Form */}
        {!showForgotPassword ? (
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
                placeholder="Enter your password"
                error={errors.password}
                id="login-password"
                required
              />
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                onClick={() => {
                  setShowForgotPassword(true);
                  setForgotPasswordEmail(email);
                  setErrors({});
                }}
                className="text-xs text-indigo-600 font-medium hover:text-indigo-700 underline"
              >
                Forgot your password?
              </button>
            </div>
          </div>
        ) : (
          /* Forgot Password Form */
          <div className="bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 p-8 space-y-5 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Reset your password
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
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
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={showForgotPassword ? handleForgotPassword : handleLogin}
          disabled={loading}
          className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? showForgotPassword
              ? "Sending..."
              : "Signing in..."
            : showForgotPassword
            ? "Send reset email"
            : "Sign in"}
          {!loading && !showForgotPassword && (
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          )}
        </button>

        {/* Footer Text */}
        {!showForgotPassword && (
          <p className="text-xs text-slate-500 text-center mt-6">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/onboarding")}
              className="text-indigo-600 font-bold hover:text-indigo-700 underline"
            >
              Sign up
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

