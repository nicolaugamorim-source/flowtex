// Add to window for easy access in console: window.resetCookies()

export function resetCookiePreferences() {
  try {
    localStorage.removeItem("cookie_preferences");
    localStorage.removeItem("cookie_consent_given");
    console.log("✅ Cookie preferences reset! Reload the page to see the banner again.");
    window.location.reload();
  } catch (error) {
    console.error("Error resetting cookies:", error);
  }
}

// Make it available globally for console access
if (typeof window !== "undefined") {
  (window as any).resetCookies = resetCookiePreferences;
}
