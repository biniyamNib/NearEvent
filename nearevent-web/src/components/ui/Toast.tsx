type ToastProps = {
  message: string;
  type?: "success" | "error";
  onClose?: () => void;
};

export default function Toast({ message, type = "success", onClose }: ToastProps) {
  if (!message) return null;

  const styles =
    type === "success"
      ? "bg-status-success text-white"
      : "bg-status-error text-white";

  return (
    <div className="fixed top-4 left-1/2 z-[100] -translate-x-1/2">
      <div
        className={`rounded-xl px-4 py-2.5 text-sm shadow-lg ${styles}`}
        onClick={onClose}
      >
        {message}
      </div>
    </div>
  );
}