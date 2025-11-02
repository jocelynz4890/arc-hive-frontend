# ArcHive Frontend

Use `npm run dev` to run the frontend.

## User Journey

The user Alex, a busy college student, struggled to maintain healthy routines like exercising, drinking water, and journaling, repeatedly abandoning them after missing a few days. One evening, his roommate suggests ArcHive, and Alex signs up, assigning habits to video game–like stats: HP for water, Strength for workouts, and Stamina for journaling. He creates a “Daily Gym” arc with his roommate, so progress only counts if both complete the task, adding accountability and motivation. Checking in at the gym updates his Strength stat on a visual radar chart after his progress is reflected after a daily refresh the next day, and rewards him with points to spend on rare avatars. Over time, the gamified, collaborative system encourages Alex to balance habits, track progress, and sustain routines that once felt impossible, making habit-building engaging, playful, and motivating.

## Screen Recordings, Visual Design Studies

All located at the top level of this repository.

## Testing

Force a refresh using `window.dailyRefreshService.forceRefresh()` in the developer console instead of waiting for midnight.

Developer note: when new avatars are added, run `deno run --allow-net --allow-read --allow-env scripts/seedAvatars.ts` in the backend directory to define avatars.
