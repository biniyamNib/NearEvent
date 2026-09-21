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