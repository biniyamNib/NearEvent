type StatusBadgeProps = {
  status: string;
};

const styles: Record<string, string> = {
  published: "bg-[#D1FAE5] text-[#059669]",
  pending: "bg-[#FEF3C7] text-[#D97706]",
  draft: "bg-[#E2E8F0] text-[#64748B]",
  cancelled: "bg-[#FFE4E6] text-[#E11D48]",
  rejected: "bg-[#FFE4E6] text-[#E11D48]",
  registration_closed: "bg-[#DBEAFE] text-[#2563EB]",
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