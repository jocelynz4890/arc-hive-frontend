# ArcHive

Frontend deployment link: https://arc-hive.onrender.com
Backend deployment link: https://arc-hive-backend.onrender.com

Use `npm run dev` to run the frontend. `deno run start` to run the backend.

## User Journey

The user Alex, a busy college student, struggled to maintain healthy routines like exercising, drinking water, and journaling, repeatedly abandoning them after missing a few days. One evening, his roommate suggests ArcHive, and Alex signs up, assigning habits to video game–like stats: HP for water, Strength for workouts, and Stamina for journaling. He creates a “Daily Gym” arc with his roommate, so progress only counts if both complete the task, adding accountability and motivation. Checking in at the gym updates his Strength stat on a visual radar chart after his progress is reflected after a daily refresh the next day, and rewards him with points to spend on rare avatars. Over time, the gamified, collaborative system encourages Alex to balance habits, track progress, and sustain routines that once felt impossible, making habit-building engaging, playful, and motivating.

## Screen Recordings, Visual Design Studies

All located at the top level of this repository.

1. Check-In_Recording.mov
2. FinalRecording1.mov and FinalRecording2.mov
3. A4C_Final_Recording.mov (the trace is in Trace.md)

## Testing

Force a refresh for testing with:

```
# Local development
curl -X POST http://localhost:8000/api/DailyRefresh/trigger \
       -H "Content-Type: application/json" \
       -d '{"secret":"change-me-in-production"}'

# Production (use HTTPS!)
curl -X POST https://arc-hive-backend.onrender.com/api/DailyRefresh/trigger \
       -H "Content-Type: application/json" \
       -d '{"secret":"<INSERT_SECRET_HERE>"}'
```

Developer note: when new avatars are added, run `deno run --allow-net --allow-read --allow-env scripts/seedAvatars.ts` in the backend directory to define avatars.

## Other Relevant Files (at the top level of this repository)

- Reflection.md
- Design.md
- Visual Design Studies: Color.png and Typography.png
