**# PRODUCT SPEC**



**## Product Overview**

**An adaptive endurance coaching platform for working adults training for triathlon and other endurance events.**



**The app is designed to be the easiest training app to follow, with a calm interface, minimal taps, and intelligent schedule adaptation.**



**## MVP Scope**

**The MVP includes only:**

**- Authentication**

**- User onboarding**

**- Race creation**

**- Adaptive training plan generation**

**- Calendar integration**

**- Workout calendar**

**- Daily workout page**

**- Progress tracking**



**## Non-MVP Exclusions**

**The MVP does not include:**

**- Social feed**

**- Coach marketplace**

**- Community**

**- Achievements**

**- Nutrition tracking**

**- Meal planning**

**- FTP estimation**

**- AI image generation**

**- Messaging**

**- Premium subscriptions**

**- Smartwatch complications**

**- Wearable analytics beyond what is required**



**## Core User Flows**

**### 1. Authentication Flow**

**User signs up or logs in, then enters the app with minimal friction.**



**### 2. Onboarding Flow**

**User provides essential training context, such as goal event, schedule constraints, and current experience.**

**The app uses this data to generate the first training plan.**



**### 3. Race Creation Flow**

**User creates a race goal, including race type and date.**

**The race becomes the anchor for training periodization and planning.**



**### 4. Plan Generation Flow**

**The app generates an adaptive training plan based on race distance, availability, recovery, and training history.**

**The plan should be structured, realistic, and progressively built.**



**### 5. Calendar Integration Flow**

**The app syncs with the user's calendar and treats it as the source of truth.**

**Existing events are never overwritten.**

**Training is placed around life constraints.**



**### 6. Workout Calendar Flow**

**The calendar shows upcoming workouts in a simple, readable format.**

**Users can see what to do, when to do it, and how the schedule adapts.**



**### 7. Daily Workout Flow**

**Each day has a focused workout page with the session details, purpose, and any adjustments made.**

**The app should explain why a workout changed when it does.**



**### 8. Progress Tracking Flow**

**The app tracks training completion and progress over time.**

**It should help the athlete understand consistency, adherence, and plan progression without clutter.**



**## Screen List**

**### Authentication Screens**

**- Welcome screen**

**- Sign up screen**

**- Log in screen**

**- Password reset screen**



**### Onboarding Screens**

**- Goal selection screen**

**- Race type selection screen**

**- Race date screen**

**- Availability screen**

**- Preferred workout time screen**

**- Experience screen**

**- Training history screen**

**- Summary and plan setup screen**



**### Race Screens**

**- Race list screen**

**- Create race screen**

**- Edit race screen**

**- Race details screen**



**### Training Plan Screens**

**- Plan overview screen**

**- Plan generation loading screen**

**- Plan adaptation explanation screen**

**- Recovery week view**

**- Taper week view**



**### Calendar Screens**

**- Workout calendar screen**

**- Day view screen**

**- Week view screen**

**- Calendar sync settings screen**



**### Daily Workout Screens**

**- Daily workout detail screen**

**- Workout steps screen**

**- Completed workout screen**

**- Missed workout handling screen**

**- Workout swap or reschedule explanation screen**



**### Progress Screens**

**- Progress overview screen**

**- Training consistency screen**

**- Weekly summary screen**

**- Milestone screen**



**## Detailed Screen Behavior**

**### Welcome Screen**

**Communicates the product promise clearly and simply.**

**Offers authentication entry points with minimal distraction.**



**### Onboarding Screens**

**Collect only information needed to generate a useful first plan.**

**Avoid unnecessary questions.**

**When uncertain, make recommendations instead of asking for more input.**



**### Create Race Screen**

**Allows the user to define the event they are training for.**

**Must support race distance and date.**



**### Plan Overview Screen**

**Shows the current training phase, upcoming focus, and next recommended workouts.**

**Should remain calm and readable.**



**### Workout Calendar Screen**

**Displays the schedule in a way that reduces cognitive load.**

**Must adapt automatically when life changes.**



**### Daily Workout Screen**

**Shows the day's session, purpose, duration, intensity, and notes.**

**Should explain why the workout is assigned and how it fits the bigger picture.**



**### Progress Screen**

**Shows progress in a motivating but non-overwhelming way.**

**Focus on consistency, completion, and training progression.**



**## Adaptive Scheduling Requirements**

**The plan must rebuild intelligently when the user:**

**- Misses a workout**

**- Travels**

**- Gets sick**

**- Works late**

**- Sleeps poorly**

**- Has extra time**

**- Changes race date**



**The system should preserve training intent while adapting volume, intensity, and timing safely.**

**It should explain the change in plain language.**



**## User Stories**

**- As an athlete, I want to create a race goal so the app can build a plan around it.**

**- As an athlete, I want the app to adapt when my schedule changes so I do not have to reorganize workouts manually.**

**- As an athlete, I want to see my workouts on a calendar so I know what is coming next.**

**- As an athlete, I want a clear daily workout page so I can complete the session without confusion.**

**- As an athlete, I want the app to explain why a workout changed so I trust the recommendation.**

**- As an athlete, I want to track progress so I can see consistency and improvement over time.**



**## UX Requirements**

**- Few taps per task.**

**- No clutter.**

**- Large touch targets.**

**- Calm visual hierarchy.**

**- Clear explanations.**

**- Fast navigation.**

**- Minimal friction.**



**## Data Model Concepts**

**The product should at minimum support concepts for:**

**- User**

**- Athlete profile**

**- Race**

**- Training plan**

**- Training phase**

**- Workout**

**- Workout completion**

**- Calendar event**

**- Schedule constraint**

**- Adaptation reason**

**- Progress metric**



**## Future Expansion**

**The architecture should support future expansion into:**

**- Running**

**- Cycling**

**- Swimming**

**- Trail running**

**- Ultra running**

**- Gravel racing**

**- Adventure racing**



**The initial experience must remain focused on the MVP scope.**

