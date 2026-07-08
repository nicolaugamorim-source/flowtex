// Tiny shared flag so unrelated components (like the real AI command modal)
// can tell whether the first-time onboarding guide is currently running.
let active = false;

export function setOnboardingActive(value: boolean) {
  active = value;
}

export function isOnboardingActive() {
  return active;
}
