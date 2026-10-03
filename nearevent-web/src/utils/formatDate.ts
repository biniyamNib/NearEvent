export function formatEventDateTime(date: string, time: string) {
  // date: YYYY-MM-DD, time: HH:MM or HH:MM:SS...
  const cleanTime = time.slice(0, 5); // HH:MM
  const value = new Date(`${date}T${cleanTime}:00`);

  if (Number.isNaN(value.getTime())) {
    return `${date} · ${cleanTime}`;
  }

  return value.toLocaleString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
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