import { FormEvent, useState } from "react";
import { forgotPassword } from "../../../api/auth.api";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Logo from "../../../components/ui/Logo";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ForgotPasswordModal({ open, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const validate = () => {
    setEmailError("");
    setFormError("");

    if (!email.trim()) {
      setEmailError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Enter a valid email");
      return false;
    }
    return true;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const start = Date.now();

    try {
      await forgotPassword(email.trim());

      const elapsed = Date.now() - start;
      if (elapsed < 800) {
        await new Promise((r) => setTimeout(r, 800 - elapsed));
      }

      setSuccess(true);
    } catch (err: any) {
      const elapsed = Date.now() - start;
      if (elapsed < 800) {
        await new Promise((r) => setTimeout(r, 800 - elapsed));
      }
      setFormError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setEmailError("");
    setFormError("");
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-bg-default p-8 shadow-lg border border-border-default">
        <div className="text-center">
          <Logo className="text-2xl" />

          {success ? (
            <>
              <h2 className="mt-4 text-xl font-semibold text-text-primary">
                Check Your email
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                We’ve sent password reset instructions to your email address.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-4 text-xl font-semibold text-text-primary">
                Forgot Password?
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Enter your email to reset your password
              </p>
            </>
          )}
        </div>

        {success ? (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={handleClose}
              className="text-sm text-brand-primary hover:underline"
            >
              ← Back to Log In
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
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

            {formError ? (
              <p className="text-sm text-status-error">{formError}</p>
            ) : null}

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Sending...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleClose}
                className="text-sm text-brand-primary hover:underline"
              >
                ← Back to Log In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}