import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications";

// Computes and updates the user's daily activity streak, returning a
// milestone message when the new streak count hits a notable threshold.
const MILESTONE_MESSAGES: Record<string, string[]> = {
  "1": [
    "First day. The hardest one.",
    "Day one begins. You got this.",
    "Every expert started here."
  ],
  "3": [
    "3 days in. Building a habit.",
    "Three's the magic number.",
    "Momentum is building."
  ],
  "7": [
    "One week straight.",
    "Seven days. You're unstoppable.",
    "A full week of consistency."
  ],
  "14": [
    "Two weeks. You're consistent.",
    "Half a month. Impressive.",
    "Fourteen days of discipline."
  ],
  "30": [
    "30 days. Most people quit before this.",
    "A full month. You're serious.",
    "Thirty days of dedication."
  ],
  "60": [
    "Two months. This is who you are now.",
    "Sixty days. It's a lifestyle.",
    "Two months in. Unstoppable."
  ],
  "90": [
    "90 days. Rare.",
    "Three months of excellence.",
    "Ninety days. Legendary status."
  ]
};

const getMessageOptions = (streak: number): string[] => {
  // Get milestone messages or default to generic options
  let options = MILESTONE_MESSAGES[streak.toString()];

  if (!options) {
    // Default generic messages
    options = [
      "Keep it going.",
      "Another day, another win.",
      "Consistency pays off."
    ];
  }

  return options;
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("streak_count, longest_streak, last_active_date")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching streak:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      streak_count: profile?.streak_count ?? 0,
      longest_streak: profile?.longest_streak ?? 0,
      last_active_date: profile?.last_active_date,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to fetch streak" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current profile
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("streak_count, longest_streak, last_active_date")
      .eq("id", user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching profile:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Calculate dates
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const lastActiveDate = profile?.last_active_date;

    let streakCount = profile?.streak_count ?? 0;
    let longestStreak = profile?.longest_streak ?? 0;
    const previousLongestStreak = longestStreak;
    let newLastActiveDate = lastActiveDate;

    console.log(`[STREAK] Processing for user ${user.id}`);
    console.log(`  - Today: ${today}`);
    console.log(`  - Yesterday: ${yesterday}`);
    console.log(`  - Last active: ${lastActiveDate}`);
    console.log(`  - Current streak: ${streakCount}`);

    if (lastActiveDate === today) {
      // Already counted today, no change
      console.log("  - Already active today, no change");
    } else if (lastActiveDate === yesterday) {
      // Consecutive day — increment streak
      streakCount += 1;
      newLastActiveDate = today;
      if (streakCount > longestStreak) {
        longestStreak = streakCount;
      }
      console.log(`  - Consecutive day! Streak: ${streakCount}`);
    } else {
      // Streak broken — reset to 1
      streakCount = 1;
      newLastActiveDate = today;
      console.log("  - Streak broken, reset to 1");
    }

    // Update profile with new streak
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        streak_count: streakCount,
        longest_streak: longestStreak,
        last_active_date: newLastActiveDate,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating streak:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`[STREAK] Updated - Streak: ${streakCount}, Best: ${longestStreak}`);

    // Only celebrate an actual new personal best (not every day the streak
    // simply continues below the existing record), and only once — a streak
    // of 1 beating a longestStreak of 0 on someone's very first day isn't a
    // "record" worth a notification.
    if (longestStreak > previousLongestStreak && longestStreak > 1) {
      await createNotification(
        user.id,
        "streak_milestone",
        "New longest streak!",
        `You just hit a ${longestStreak}-day streak — your best yet.`,
        { streak: longestStreak }
      );
    }

    return NextResponse.json({
      streak_count: streakCount,
      longest_streak: longestStreak,
      last_active_date: newLastActiveDate,
      success: true,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to update streak" }, { status: 500 });
  }
}
