export const activityEventTarget = new EventTarget();

export async function trackActivity(actionType: string, count: number = 1): Promise<void> {
  try {
    const response = await fetch("/api/activity/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action_type: actionType, count }),
    });

    if (response.ok) {
      // Update streak after tracking activity
      await updateStreak();
      activityEventTarget.dispatchEvent(new CustomEvent("activity:tracked", { detail: { actionType } }));
    } else {
      console.error("Failed to track activity:", response.statusText);
    }
  } catch (error) {
    console.error("Error tracking activity:", error);
  }
}

export async function updateStreak(): Promise<void> {
  try {
    const response = await fetch("/api/streak", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      console.error("Failed to update streak:", response.statusText);
    }
  } catch (error) {
    console.error("Error updating streak:", error);
  }
}

export async function removeActivity(): Promise<void> {
  try {
    const response = await fetch("/api/activity/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (response.ok) {
      activityEventTarget.dispatchEvent(new CustomEvent("activity:removed"));
    } else {
      console.error("Failed to remove activity:", response.statusText);
    }
  } catch (error) {
    console.error("Error removing activity:", error);
  }
}
