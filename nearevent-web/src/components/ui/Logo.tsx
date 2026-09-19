type LogoProps = {
  variant?: "default" | "inverse";
  className?: string;
};

export default function Logo({ variant = "default", className = "" }: LogoProps) {
  const colorClass =
    variant === "inverse" ? "text-text-inverse" : "text-brand-primary";

  return (
    <div className={`font-bold tracking-tight ${colorClass} ${className}`}>
      NearEvent
    </div>
  );
}