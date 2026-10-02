import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../../api/client";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Invalid or missing reset link.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Use the field name your API expects:
      // new_password OR password — match your DTO
      await api.post("/auth/reset-password", {
        token,
        new_password: password,
      });
      setSuccess("Password updated. You can log in now.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Reset failed. Link may be expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-border-default bg-bg-default p-6 space-y-4"
      >
        <h1 className="text-xl font-semibold text-text-primary">Reset password</h1>
        <p className="text-sm text-text-secondary">Enter a new password for your account.</p>

        {!token ? (
          <p className="text-sm text-status-error">This reset link is invalid.</p>
        ) : null}

        <div>
          <label className="mb-1 block text-sm text-text-secondary">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border-default px-3 py-2.5 text-sm"
            disabled={loading}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-text-secondary">Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-border-default px-3 py-2.5 text-sm"
            disabled={loading}
          />
        </div>

        {error ? <p className="text-sm text-status-error">{error}</p> : null}
        {success ? <p className="text-sm text-status-success">{success}</p> : null}

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full rounded-full bg-brand-primary py-3 text-white font-semibold disabled:opacity-60"
        >
          {loading ? "Saving..." : "Update password"}
        </button>
      </form>
    </div>
  );
}