# Design Document

## Backend Changes

Most backend changes were made in response to three issues:

Uncaught edge cases or bugs, not enforcing invariants
Unimplemented queries or functions that turned out to be necessary as discovered during implementation of the backend (implementing utilities that would be useful in consideration of how a different concept works) or testing of the frontend
Lack of security-preserving features

### Rewarding Concept

I added some actions that I realized were missing when considering how the concept would work on the frontend:

```
getRarity(rarity: String): (chance: Number)
	requires rarity is one of {common, rare, epic, legendary}
	effect returns the percentage chance associated with getting that rarity, where common is 65%, rare is 25%, epic is 9.5%, and legendary is 0.5%.

pickRandomAvatar(availableAvatars: set of Avatar): (avatar: Avatar)
	requires true
	effect picks a random avatar from availableAvatars weighted by rarity
```

The Rewarding concept’s resulting implementation of pickRandomAvatar had a bug where the chances depend on the distribution of rarities of avatars in the avatar pool, so I then modified it to pick a rarity first instead of choosing based on existing avatars.

I also added an action to award points to batches of users and points, since I considered that an arc has a set of users whose points would be awarded at the same time.

### Authentication Concept

I updated the concept to clarify that hashed passwords were being stored in the state for security, which is an important detail to add.

In the actual implementation, I added two helper functions to convert between MongoDB IDs and usernames for convenience that I did not add in the concept specification since they are queries.

The Authentication concept had no support for sessioning, causing all endpoints to lack security, so I added state to store session objects which map tokens to users. The actions associated with this are createSession for an existing user, validateSession given a token (which returns the associated user if the session is valid), and invalidateSession to invalidate a session token.

### Arc Tracking Concept

I originally designed the concept with the idea in mind that each user would have a maximum of 10 arcs they could be a part of (enforced in action requirements for adding users to arcs) in order to consider how the application would scale, but I raised this to 30 after more consideration of how many arcs a user would want to create. I ended up removing this limit altogether after considering the paragraph below, where I detail why arcs cannot be deleted.

I received feedback on potentially adding an action to remove a user from an arc. However, I decided against this due to the complication of deciding which user in the arc gets to remove other users. Voting is a solution, although it seems overly complex for this context, and having the "owner" of the arc is another solution, but one that does not work here since I deliberately made it so that arcs have no owner, just a set of members so that everyone within an arc has equal status. Not being able to remove a single user from an arc, and more generally not being able to delete arcs at all, is intended so that arcs are made with purpose and users are incentivized to continue making progress on them. Also, all of the user's arcs over time serve to highlight their progress and shift in goals over time.

I also considered that a user may want their arcs to be ordered on their screen as they start to accumulate, so I considered adding additional state so that users could order/rank their arcs, but decided that the getArcs action could just return arcs in a certain order, which I added to the concept spec. This can also be used on the frontend to implement pagination so that the user's page is not filled up with arcs they've abandoned (but the intention of leaving them there is for the user to see all the goals they've abandoned and feel more motivated).

I added an action to refresh all arcs, and a query to retrieve a single arc.

### StatTracking Concept

This concept remained relatively the same, with just an additional action to update stats in batches for a group of users, since users are often processed as a group due to the ArcTracking concept grouping users together in arcs.

### Friending Concept

This concept remained relatively the same. I added 'removeFriend' and also changed the state to allow more performative operations involving sets that map from friend codes to usernames and usernames to friend codes.

### DailyRefresh Concept

In order to refresh my app daily at midnight, I had to create a new concept that had no state and contained one action, a trigger that took a secret (for security, so that it cannot be called by anything other than a cron job that schedules when this trigger is called) and will set off a chain of actions across concepts that should execute one by one through chained syncs, since some of their inputs depend on previous actions’ outputs.

### Events Concept

I found that after the chain of sync actions triggered by the DailyRefresh concept occurred, the UI could not refresh automatically, so I added the Events concept only contains a single action, emit, to force a refresh on the frontend after the daily refresh event sequence occurs. This is used along with updating the Request concept to create an endpoint for server sent events. I use polling in addition to this as a fallback.

### Syncs and Security Considerations

I started with a sync for the daily refresh, which should allow the user to earn rewards points, reset streaks for their arcs, and update their stats (actions across 3 concepts). In addition, the number of points, streak continuation/reset, and stat gains/losses depend on the information of whether a user made arc progress individually and with the rest of the arc members, so an additional action is required to convey that information as input to the other actions.

Next, I added a sync to initialize the user's data when they are initially registered.

All routes used by the syncs were excluded in `passthrough.ts`.

All actions that involved writing to the database, or that could've revealed sensitive user information, such as being able to retrieve a friend code from just a user ID, were excluded in `passthrough.ts` so that they would not be public endpoints.

All queries are excluded as well, since they directly interface with the database and should not be exposed.

The syncs use session tokens to ensure the user is authenticated.

### Deployment

#### Static Site

I set up a static site for my frontend. Link here: https://arc-hive.onrender.com

#### Web Service

I set up a web service for my backend. Link here: https://arc-hive-backend.onrender.com

#### Cron Job

I used https://console.cron-job.org/jobs to create a cron job to POST at the URL https://arc-hive-backend.onrender.com/api/DailyRefresh/trigger, with the crobtab expression `0 0 * * *` so that it runs daily at midnight, and a request body with {"secret":"<YOUR_DAILY_REFRESH_SECRET>"}. The issue here is that there is a timeout of 30s, which might not be long enough to do a full refresh for all users, but the daily refresh endpoint returns immediately after verifying the secret, and all the heavy work is done in the later syncs it triggers, but this means that if processing fails, it won't be reflected in the HTTP response, and logs will be required to detect failures.

## Frontend Changes

Most of the frontend changes that differ from the original design were made in response to visual design choices (color and typography) that impacted readability/navigability in unexpected ways after the visual changes were made.

### Visual Design

From my visual design study, I chose a color palette that was playful, fun, and invigorating, and typography that emphasized the game-themed nature of the app. I also used ChatGPT to generate custom pixelated icons to insert in the app. These visual elements caused the page layout to not be as readable as expected, since some of the fonts were large, and elements such as the radar chart ended up being bigger than expected.

### Resulting Page Layout Changes

- The navbar is no longer [username on left, navigation icons]. Instead, the name of the app is on the left, while the user’s username is right aligned along with icons + a one word description of where each icon navigates to for clarity, and to include the app’s name somewhere on the page.
- There are no longer explicit back buttons since popups with ‘x’ buttons are used instead for more intuitive navigability without relying on nested pages and breadcrumbs. This eliminates unnecessary extra pages, like a separate page for creating an arc or viewing a friend’s profile, which can be done in a small popup. Entering a friend code can also be done in just a single div on the friend page rather than a whole separate page.
- To eliminate visual clutter on the home page, either he stat chart or progress details bars are displayed at a time (they exist on sides of the same card, which can be flipped). This is because 1) they display the same info in different formats, and 2), there was not enough room to fit three large visual elements in one row on the home page (the user’s avatar had to be displayed there as well).
- Arcs are displayed as cards on one arc page with pagination, and sorting so that arcs with extended streaks are displayed first, followed by arcs that were most recently created. This more compactly presents information, rather than forcing each arc to have a separate page. Marking an arc as completed also involves just clicking on the arc’s card, turning it green
- Validation was performed in places where forms had to be submitted: login/signup, entering friend codes, spending points, creating arcs. These display detailed messages of what error occurred, e.g. “You cannot enter your own friend code”, “You have already friended this user”, “This username does not exist”, “You cannot have whitespaces in your username”, “You must name your arc”, “You don’t have enough points to spend”, and more.
- The friend code can be easily copied to the clipboard by clicking an icon next to the friend code, which displays a message briefly to let the user know that the code has been copied. Similar indicators exist for point spending on the rewards page.
- Brief messages are present at the top of every page and in areas where a user needs more information that may not be obvious from just viewing the app, to guide the user more effectively.
- To handle different screen sizes (for example, when being viewed on mobile), I ensured the navbar and all other UI components had flexbox properties configured and also handled cases where a long input text field may overflow from the container that it is located within.
