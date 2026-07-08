// Lets the onboarding guide know, as soon as possible, whether the user still needs to
// pick a calendar — avoids blindly polling the DOM for up to ~2s when the dashboard
// already knows the answer (calendars are typically configured, so this is the common case).
let calendarsConfigured: boolean | null = null;

export function setCalendarsConfiguredFlag(value: boolean | null) {
  calendarsConfigured = value;
}

export function getCalendarsConfiguredFlag() {
  return calendarsConfigured;
}
