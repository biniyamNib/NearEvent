import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../../api/auth.api";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Logo from "../../../components/ui/Logo";
import { useAuthStore } from "../../../store/authStore";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import { useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const location = useLocation();
  const successMessage = (location.state as { message?: string })?.message;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);

  const validate = () => {
    let valid = true;
    setEmailError("");
    setPasswordError("");
    setFormError("");

    if (!email.trim()) {
      setEmailError("Email is required");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Enter a valid email");
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.trim().length < 8) {
      setPasswordError("Password must be at least 8 characters");
      valid = false;
    }

    return valid;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFormError("");

    const start = Date.now();

    try {
      const data = await login({
        email: email.trim(),
        password,
      });

      const elapsed = Date.now() - start;
      const minLoadingTime = 800;
      if (elapsed < minLoadingTime) {
        await new Promise((resolve) => setTimeout(resolve, minLoadingTime - elapsed));
      }

      setAuth(data.token, data.user);

      if (data.user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (data.user.role === "organizer") {
        navigate("/organizer/dashboard");
      } else {
        setFormError("This web app is for organizers and admins only");
      }
    } catch (err: any) {
      const elapsed = Date.now() - start;
      const minLoadingTime = 800;
      if (elapsed < minLoadingTime) {
        await new Promise((resolve) => setTimeout(resolve, minLoadingTime - elapsed));
      }

      setFormError(err?.response?.data?.message || "Incorrect email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-bg-default p-8 shadow-sm border border-border-default">
        <div className="text-center">
          <Logo className="text-2xl" />
          <h2 className="mt-4 text-xl font-semibold text-text-primary">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="mb-1.5 block text-sm text-text-secondary">
            Email <span className="text-status-error">*</span>
          </label>
          <Input
          //   label="Email *"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError("");
            }}
            placeholder="Enter your email"
            error={emailError}
            disabled={loading}
            autoComplete="email"
          />

          <div>
            <label className="mb-1.5 block text-sm text-text-secondary">
              Password <span className="text-status-error">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="current-password"
                className={`w-full rounded-xl border px-3 py-2.5 pr-12 text-sm outline-none transition focus:border-border-focus disabled:bg-bg-subtle disabled:text-text-disabled ${
                  passwordError ? "border-status-error" : "border-border-default"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            {passwordError ? (
              <p className="mt-1 text-xs text-status-error">{passwordError}</p>
            ) : null}

            <div className="mt-2 text-left">
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-sm text-brand-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {formError ? (
            <p className="text-sm text-status-error">{formError}</p>
          ) : null}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don’t have an account?{" "}
          <Link to="/register" className="text-brand-primary hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
      {/* ✅ put modal here */}
    <ForgotPasswordModal
      open={forgotOpen}
      onClose={() => setForgotOpen(false)}
    />
    </div>
  );
}