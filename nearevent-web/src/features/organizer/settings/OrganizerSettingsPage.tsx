import { FormEvent, useEffect, useState } from "react";
import { getMe } from "../../../api/auth.api";
import { api } from "../../../api/client";
import { uploadImage } from "../../../api/uploads.api";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { useAuthStore } from "../../../store/authStore";

async function updateProfile(payload: {
  full_name: string;
  email: string;
  avatar_url?: string;
}) {
  const res = await api.put("/users/me", payload);
  return res.data.data;
}

export default function OrganizerSettingsPage() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const user = await getMe();
        setFullName(user.full_name || "");
        setEmail(user.email || "");
        setAvatarUrl(user.avatar_url || null);
      } catch (err: any) {
        setFormError(err?.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file)); // local preview
  };

  const validate = () => {
    let valid = true;
    setFullNameError("");
    setEmailError("");

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
    return valid;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSuccess("");
    setFormError("");

    try {
      let uploadedAvatar = avatarUrl || undefined;

      if (avatarFile) {
        uploadedAvatar = await uploadImage(avatarFile);
      }

      const updated = await updateProfile({
        full_name: fullName.trim(),
        email: email.trim(),
        avatar_url: uploadedAvatar,
      });

      if (token) setAuth(token, updated);
      setAvatarUrl(updated.avatar_url || uploadedAvatar || null);
      setSuccess("Profile updated successfully");
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar = avatarUrl
    ? avatarUrl.startsWith("http") || avatarUrl.startsWith("blob:")
      ? avatarUrl
      : `http://localhost:8080${avatarUrl}`
    : null;

  if (loading) {
    return <div className="text-text-secondary">Loading settings...</div>;
  }

  return (
    <div className="space-y-1">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your account settings
        </p>
      </div>

      {success ? (
        <div className="rounded-xl bg-status-success-light px-4 py-3 text-sm text-status-success">
          {success}
        </div>
      ) : null}

      {formError ? (
        <div className="rounded-xl bg-status-error-light px-4 py-3 text-sm text-status-error">
          {formError}
        </div>
      ) : null}

      <div className="flex justify-center">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md rounded-2xl border border-border-default bg-bg-default p-8 space-y-5"
        >
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-brand-primary-light overflow-hidden flex items-center justify-center text-brand-primary text-xl font-semibold">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                (fullName || "U")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              )}
            </div>

            <label className="mt-3 cursor-pointer text-sm text-brand-primary hover:underline">
              Change photo
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={onAvatarChange}
                className="hidden"
                disabled={saving}
              />
            </label>
          </div>

          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={fullNameError}
            disabled={saving}
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            disabled={saving}
          />

          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}