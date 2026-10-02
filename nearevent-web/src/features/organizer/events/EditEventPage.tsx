import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrganizerEvent, updateEvent } from "../../../api/events.api";
import { getActiveCategories, type Category } from "../../../api/categories.api";
import { uploadImage } from "../../../api/uploads.api";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

type FormErrors = Partial<
  Record<
    | "title"
    | "category_id"
    | "description"
    | "event_date"
    | "start_time"
    | "end_time"
    | "venue_name"
    | "address"
    | "capacity",
    string
  >
>;

export default function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [capacity, setCapacity] = useState("");

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [bannerError, setBannerError] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const [event, cats] = await Promise.all([
          getOrganizerEvent(id),
          getActiveCategories(),
        ]);

        setCategories(cats);
        setTitle(event.title || "");
        setCategoryId(event.category_id || "");
        setDescription(event.description || "");
        setEventDate(event.event_date || "");
        setStartTime((event.start_time || "").slice(0, 5));
        setEndTime((event.end_time || "").slice(0, 5));
        setVenueName(event.venue_name || "");
        setAddress(event.address || "");
        setLatitude(event.latitude != null ? String(event.latitude) : "");
        setLongitude(event.longitude != null ? String(event.longitude) : "");
        setCapacity(String(event.capacity ?? ""));
      } catch (err: any) {
        setFormError(err?.response?.data?.message || "Failed to load event");
      } finally {
        setPageLoading(false);
      }
    };

    load();
  }, [id]);

  const MAX_BANNER_SIZE = 10 * 1024 * 1024;

  const handleBannerFile = (file?: File | null) => {
    setBannerError("");

    if (!file) {
      setBannerFile(null);
      setBannerPreview("");
      return;
    }

    const validType = ["image/png", "image/jpeg", "image/jpg"].includes(file.type);
    if (!validType) {
      setBannerError("Only PNG or JPG images are allowed");
      return;
    }

    if (file.size > MAX_BANNER_SIZE) {
      setBannerError("Image must be 10MB or less");
      return;
    }

    setBannerFile(file);
    setBannerPreview(file.name);
  };

  const onBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleBannerFile(e.target.files?.[0] || null);
  };

  const onBannerDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleBannerFile(e.dataTransfer.files?.[0] || null);
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview("");
    setBannerError("");
  };

  const validate = () => {
    const next: FormErrors = {};

    if (!title.trim()) next.title = "Event Title is required";
    if (!categoryId) next.category_id = "Please select a category";
    if (!description.trim()) next.description = "Description is required";
    if (!eventDate) next.event_date = "Date is required";
    if (!startTime) next.start_time = "Start time is required";
    if (!endTime) next.end_time = "End time is required";
    if (startTime && endTime && startTime >= endTime) {
      next.end_time = "End time must be after start time";
    }
    if (!venueName.trim()) next.venue_name = "Venue name is required";
    if (!address.trim()) next.address = "Address is required";
    if (!capacity.trim() || Number(capacity) <= 0) {
      next.capacity = "Enter a valid capacity";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSuccess("");
    setFormError("");
    if (!validate()) return;

    setSaving(true);
    const start = Date.now();

    try {
      let imageUrl: string | undefined;

      if (bannerFile) {
        imageUrl = await uploadImage(bannerFile);
      }

      await updateEvent(id, {
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId || undefined,
        venue_name: venueName.trim(),
        address: address.trim(),
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        capacity: Number(capacity),
        image_url: imageUrl,
        latitude: latitude.trim() === "" ? undefined : Number(latitude),
        longitude: longitude.trim() === "" ? undefined : Number(longitude),
      });

      const elapsed = Date.now() - start;
      if (elapsed < 700) {
        await new Promise((r) => setTimeout(r, 700 - elapsed));
      }

      setSuccess("Changes saved!");
      setTimeout(() => navigate(`/organizer/events/${id}`), 900);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return <div className="text-text-secondary">Loading event...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Edit Event</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Update your event details below
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

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Left */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-border-default bg-bg-default p-5 space-y-4">
              <h2 className="font-semibold text-text-primary">1. Basic Information</h2>

              <Input
                label={
                  <>
                    Event Title <span className="text-status-error">*</span>
                  </>
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={errors.title}
                disabled={saving}
              />

              <div>
                <label className="mb-1.5 block text-sm text-text-secondary">
                  Category <span className="text-status-error">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={saving}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${
                    errors.category_id ? "border-status-error" : "border-border-default"
                  }`}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.category_id ? (
                  <p className="mt-1 text-xs text-status-error">{errors.category_id}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-text-secondary">
                  Description <span className="text-status-error">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={saving}
                  rows={5}
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${
                    errors.description ? "border-status-error" : "border-border-default"
                  }`}
                />
                {errors.description ? (
                  <p className="mt-1 text-xs text-status-error">{errors.description}</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-border-default bg-bg-default p-5 space-y-4">
              <h2 className="font-semibold text-text-primary">2. Date & Time</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Input
                  label={
                    <>
                      Date <span className="text-status-error">*</span>
                    </>
                  }
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  error={errors.event_date}
                  disabled={saving}
                />
                <Input
                  label={
                    <>
                      Start Time <span className="text-status-error">*</span>
                    </>
                  }
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  error={errors.start_time}
                  disabled={saving}
                />
                <Input
                  label={
                    <>
                      End Time <span className="text-status-error">*</span>
                    </>
                  }
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  error={errors.end_time}
                  disabled={saving}
                />
              </div>
            </section>
          </div>

          {/* Right */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-border-default bg-bg-default p-5 space-y-4">
              <h2 className="font-semibold text-text-primary">3. Location</h2>
              <Input
                label={
                  <>
                    Venue Name <span className="text-status-error">*</span>
                  </>
                }
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                error={errors.venue_name}
                disabled={saving}
              />
              <Input
                label={
                  <>
                    Address / Location <span className="text-status-error">*</span>
                  </>
                }
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                error={errors.address}
                disabled={saving}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Latitude (optional)"
                  type="number"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 9.0192"
                  disabled={saving}
                />
                <Input
                  label="Longitude (optional)"
                  type="number"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 38.7525"
                  disabled={saving}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-border-default bg-bg-default p-5 space-y-4">
              <h2 className="font-semibold text-text-primary">4. Capacity</h2>
              <Input
                label={
                  <>
                    Maximum Capacity <span className="text-status-error">*</span>
                  </>
                }
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                error={errors.capacity}
                disabled={saving}
              />

              <div>
                <label className="mb-2 block text-sm text-text-secondary">
                  Event Banner Image (optional)
                </label>

                {!bannerFile ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onBannerDrop}
                    className="rounded-xl border border-dashed border-border-default bg-bg-subtle p-4 text-center"
                  >
                    <input
                      id="edit-banner-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={onBannerChange}
                      className="hidden"
                      disabled={saving}
                    />
                    <label
                      htmlFor="edit-banner-upload"
                      className="cursor-pointer text-sm text-text-secondary"
                    >
                      Drag & drop an image here or{" "}
                      <span className="text-brand-primary">browse files</span>
                      <br />
                      <span className="text-xs text-text-tertiary">
                        PNG, JPG up to 10MB
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border-default bg-bg-default p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {bannerPreview}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {(bannerFile.size / (1024 * 1024)).toFixed(1)} MB · Selected
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="edit-banner-replace"
                        className="cursor-pointer text-sm text-brand-primary hover:underline"
                      >
                        Replace
                      </label>
                      <button
                        type="button"
                        onClick={removeBanner}
                        className="text-sm text-status-error hover:underline"
                      >
                        Remove
                      </button>
                    </div>

                    <input
                      id="edit-banner-replace"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={onBannerChange}
                      className="hidden"
                      disabled={saving}
                    />
                  </div>
                )}

                {bannerError ? (
                  <p className="mt-1 text-xs text-status-error">{bannerError}</p>
                ) : null}
              </div>
            </section>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={() => navigate(`/organizer/events/${id}`)}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}