type StatusBadgeProps = {
  status: string;
};

const styles: Record<string, string> = {
  published: "bg-status-success-light text-status-success",
  pending: "bg-status-warning-light text-status-warning",
  draft: "bg-border-default text-text-tertiary",
  cancelled: "bg-status-error-light text-status-error",
  rejected: "bg-status-error-light text-status-error",
  registration_closed: "bg-brand-primary-light text-brand-primary",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const key = status.toLowerCase().replaceAll(" ", "_");
  const className = styles[key] || "bg-[#E2E8F0] text-[#64748B]";

  const label = status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}