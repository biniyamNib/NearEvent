import { FormEvent, useEffect, useState } from "react";
import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
  type Category,
} from "../../../api/categories.api";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Toast from "../../../components/ui/Toast";

function StatusPill({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-status-success-light text-status-success"
          : "bg-bg-subtle text-text-secondary"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );

  const [toast, setToast] = useState<{
    message: string;
    type?: "success" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const load = async () => {
    try {
      const data = await getAdminCategories();
      setCategories(data || []);
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "Failed to load categories",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setNameError("");
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setNameError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setName("");
    setNameError("");
  };

  const openDeleteConfirm = (cat: Category) => {
    setCategoryToDelete(cat);
    setConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    if (deleteLoading) return;
    setConfirmOpen(false);
    setCategoryToDelete(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Category name is required");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, name.trim());
        showToast("Category updated successfully!");
      } else {
        await createCategory(name.trim());
        showToast("Category added successfully!");
      }
      setModalOpen(false);
      setEditing(null);
      setName("");
      await load();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteCategory(categoryToDelete.id);
      showToast("Category deleted successfully!");
      setConfirmOpen(false);
      setCategoryToDelete(null);
      await load();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Delete failed", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return <div className="text-text-secondary">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Categories
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage event categories used across the platform
          </p>
        </div>
        <Button onClick={openCreate}>+ Add Category</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-default bg-bg-default shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-bg-subtle text-text-secondary">
              <tr>
                <th className="px-5 py-3 text-left font-medium">
                  Category Name
                </th>
                <th className="px-5 py-3 text-left font-medium">
                  Events Count
                </th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Updated On</th>
                <th className="px-5 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-text-secondary"
                  >
                    No categories yet
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="border-t border-border-default">
                    <td className="px-5 py-4 font-medium text-text-primary">
                      {cat.name}
                    </td>
                    <td className="px-5 py-4 text-text-secondary">
                      {cat.events_count ?? 0}
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={cat.status} />
                    </td>
                    <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                      {cat.updated_at
                        ? new Date(cat.updated_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-brand-primary hover:underline"
                          onClick={() => openEdit(cat)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-status-error hover:underline"
                          onClick={() => openDeleteConfirm(cat)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border-default bg-bg-default p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">
                {editing ? "Edit Category" : "Add Category"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="text-text-tertiary hover:text-text-primary disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <Input
                label={
                  <>
                    Category Name <span className="text-status-error">*</span>
                  </>
                }
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError("");
                }}
                placeholder="e.g. Technology"
                error={nameError}
                disabled={saving}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editing
                      ? "Save Changes"
                      : "Save Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Delete Confirm Modal */}
      {confirmOpen && categoryToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-overlay/50 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border-default bg-bg-default p-6 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-text-primary">
                Delete Category?
              </h3>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={closeDeleteConfirm}
                className="text-text-tertiary hover:text-text-primary disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-sm text-text-secondary">
              Are you sure you want to permanently delete “
              {categoryToDelete.name}”?
              <span className="mt-2 block">
                This action cannot be undone. Events using this category will no
                longer be linked to it.
              </span>
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={deleteLoading}
                onClick={closeDeleteConfirm}
              >
                Keep Category
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={deleteLoading}
                onClick={confirmDelete}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
