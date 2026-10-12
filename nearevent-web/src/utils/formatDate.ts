export function formatEventDateTime(
  dateStr?: string,
  timeStr?: string
): string {
  if (!dateStr) return "—";

  try {
    const time = (timeStr || "00:00").slice(0, 5);
    const d = new Date(`${dateStr}T${time}:00`);

    if (Number.isNaN(d.getTime())) return dateStr;

    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    const day = d.getDate(); 
    const month = d.toLocaleDateString("en-US", { month: "short" }); 

    const timeLabel = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }); 

    return `${weekday} ${day} ${month}, ${timeLabel}`;
  } catch {
    return dateStr;
  }
}

export function formatDateLabel(dateStr: string) {
  try {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

export function formatTime(timeStr: string) {
  const clean = timeStr?.slice(0, 5) || "";
  const [h, m] = clean.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return timeStr;
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}