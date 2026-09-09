import * as chrono from "chrono-node";

/**
 * Builds a Google Calendar "quick add" link — Google's public, key-free
 * event-creation template. No OAuth, no Cloud project, no backend call:
 * it just opens Calendar with the event pre-filled so the user reviews
 * and saves it with one click. This is the same mechanism most "Add to
 * Calendar" buttons on the web use.
 *
 * We do the natural-language date parsing (e.g. "next Thursday") entirely
 * client-side with chrono-node so a vague deadline like "Thursday" still
 * becomes a real date on the invite, without ever leaving the browser.
 */
export function buildGoogleCalendarUrl(task) {
  const base = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: task.task,
  });

  const details = [`Owner: ${task.owner}`, "Created with DoIt!"].join("\n");
  params.set("details", details);

  const date = parseDeadline(task.deadline);
  if (date) {
    params.set("dates", `${toAllDayRange(date)}`);
  }

  return `${base}?${params.toString()}`;
}

function parseDeadline(deadline) {
  if (!deadline || /not specified/i.test(deadline)) return null;
  const results = chrono.parseDate(deadline, new Date(), { forwardDate: true });
  return results || null;
}

function toAllDayRange(date) {
  const start = formatDate(date);
  const end = formatDate(new Date(date.getTime() + 24 * 60 * 60 * 1000));
  return `${start}/${end}`;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}
