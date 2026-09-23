import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { register } from "../../../api/auth.api";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Logo from "../../../components/ui/Logo";
import { useAuthStore } from "../../../store/authStore";

export default function SignupPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let valid = true;
    setFullNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setFormError("");

    if (!fullName.trim()) {
      setFullNameError("Full name is required");
      valid = false;
    }

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

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Confirm password is required");
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      valid = false;
    }

    return valid;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const start = Date.now();

    try {
      const data = await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role: "organizer",
      });

      const elapsed = Date.now() - start;
      if (elapsed < 800) {
        await new Promise((r) => setTimeout(r, 800 - elapsed));
      }

      useAuthStore.getState().logout();

      console.log("register success, going to login");

    //   setAuth(data.token, data.user);
      navigate("/login", {
        state: { message: "Account created successfully. Please log in." },
      });
    } catch (err: any) {
      const elapsed = Date.now() - start;
      if (elapsed < 600) {
        await new Promise((r) => setTimeout(r, 800 - elapsed));
      }

      const message = err?.response?.data?.message || "Registration failed";
      if (
        typeof message === "string" &&
        message.toLowerCase().includes("already")
      ) {
        setEmailError("Email already exists");
      } else {
        setFormError(message);
      }
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
            Create your account
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Start publishing local events
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Input
            label={
              <>
                Full Name <span className="text-status-error">*</span>
              </>
            }
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fullNameError) setFullNameError("");
            }}
            placeholder="Enter your full name"
            error={fullNameError}
            disabled={loading}
          />

          <Input
            label={
              <>
                Email <span className="text-status-error">*</span>
              </>
            }
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError("");
            }}
            placeholder="Enter your email"
            error={emailError}
            disabled={loading}
          />

          {/* Password */}
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
                placeholder="Create your password"
                disabled={loading}
                className={`w-full rounded-xl border px-3 py-2.5 pr-12 text-sm outline-none transition duration-200 focus:border-border-focus focus:ring-2 focus:ring-brand-primary-light disabled:bg-bg-subtle ${
                  passwordError ? "border-status-error" : "border-border-default"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
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
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1.5 block text-sm text-text-secondary">
              Confirm Password <span className="text-status-error">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) setConfirmPasswordError("");
                }}
                placeholder="Confirm your password"
                disabled={loading}
                className={`w-full rounded-xl border px-3 py-2.5 pr-12 text-sm outline-none transition duration-200 focus:border-border-focus focus:ring-2 focus:ring-brand-primary-light disabled:bg-bg-subtle ${
                  confirmPasswordError
                    ? "border-status-error"
                    : "border-border-default"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            {confirmPasswordError ? (
              <p className="mt-1 text-xs text-status-error">
                {confirmPasswordError}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p className="text-sm text-status-error">{formError}</p>
          ) : null}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white" />
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Don’t have an account?{" "}
          <Link to="/login" className="text-brand-primary hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}