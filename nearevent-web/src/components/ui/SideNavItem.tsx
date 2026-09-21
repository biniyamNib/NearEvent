import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  to: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
  disabled?: boolean;
};

export default function SideNavItem({
  to,
  label,
  icon,
  active = false,
  disabled = false,
}: Props) {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-text-disabled cursor-not-allowed">
        {icon}
        <span>{label}</span>
      </div>
    );
  }

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-brand-primary-light text-brand-primary"
          : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}