# PROJECT RULES

## Mission
Build the world's most intelligent and user-friendly endurance training platform.

The app should function like a personal endurance coach that understands both the science of training and the realities of everyday life.

Our goal is not to create another workout app.
Our goal is to create the easiest training app to follow.

Every design decision should answer one question:

"Does this make it easier for an athlete to consistently train?"

If not, reconsider it.

## Core Philosophy
Training should adapt to life.
Life should never have to adapt to training.

The application should constantly balance:
- Performance
- Recovery
- Schedule
- Consistency
- Athlete enjoyment

## Target User
Primary:
- Working adults training for Sprint Triathlon
- Working adults training for Olympic Triathlon
- Working adults training for Half Ironman
- Working adults training for Full Ironman

Secondary:
- Endurance athletes training for Running
- Endurance athletes training for Cycling
- Endurance athletes training for Swimming
- Endurance athletes training for Duathlon
- Endurance athletes training for Trail Running

## Product Principles
The app should always be:
- Simple
- Friendly
- Motivating
- Data-driven
- Adaptive
- Fast
- Never overwhelming
- Never cluttered
- Never intimidating

## MVP Rules
The MVP should only include:
- Authentication
- User onboarding
- Race creation
- Adaptive training plan generation
- Calendar integration
- Workout calendar
- Daily workout page
- Progress tracking

## Features Not Allowed During MVP
- Social feed
- Coach marketplace
- Community
- Achievements
- Nutrition tracking
- Meal planning
- FTP estimation
- AI image generation
- Messaging
- Premium subscriptions
- Smartwatch complications
- Wearable analytics beyond what is required

## The One Killer Feature
Everything revolves around one idea:
Adaptive scheduling.

If a user:
- Misses a workout
- Travels
- Gets sick
- Works late
- Sleeps poorly
- Has extra time
- Changes race date

The plan should intelligently rebuild itself.

This is the company's competitive advantage.
Prioritize this above everything.

## User Experience Rules
- Require as few taps as possible.
- Never manually reorganize workouts.
- Make recommendations instead of asking unnecessary questions.
- Keep the UI calm.
- Never overload the screen.
- Always explain why changes are made.

## AI Rules
- The AI should never hallucinate.
- If uncertain, say so.
- Never invent training science.
- Base recommendations on accepted endurance training principles.
- Explain reasoning.
- Prioritize athlete health over performance.

## Design Rules
- Minimal
- Modern
- White space
- Readable
- Accessible
- Large touch targets
- Fast animations
- Dark mode
- Light mode
- No unnecessary decoration
- Content first

## Coding Rules
Use:
- TypeScript
- React Native
- Expo
- Expo Router
- Supabase
- NativeWind
- Strict typing
- No any
- No duplicated code
- No unnecessary libraries
- One responsibility per component
- Prefer composition over complexity
- Reusable components

## Architecture Rules
Business logic must not live inside UI components.
Separate:
- UI
- Business logic
- Database
- API
- Utilities
- Hooks
- Types
- Services

Follow a scalable architecture from day one.

## Naming Rules
Use descriptive names.
Avoid abbreviations.

Example:
- generateTrainingPlan()
- Not genPlan()

## File Organization
Every feature should have:
- components/
- hooks/
- services/
- types/
- screens/
- utils/

Tests should mirror folder structure.

## Performance Rules
- Optimize for responsiveness.
- Avoid unnecessary renders.
- Lazy load where possible.
- Optimize images.
- Optimize network requests.
- Batch API calls.
- Cache intelligently.
- Consider offline support.

## Calendar Rules
Calendar integration is a first-class feature.
Support:
- Google Calendar
- Apple Calendar
- Outlook Calendar

The calendar should be the user's source of truth.
Training adapts around calendar events.
Never overwrite existing events.

## Training Rules
Plans must consider:
- Experience
- Fitness
- Race distance
- Available hours
- Available days
- Preferred workout times
- Recovery
- Missed workouts
- Progression
- Taper
- Recovery weeks

Training should increase gradually.
Never spike training load.

## Wearable Rules
Architecture must support:
- COROS
- Garmin
- Apple Health
- Google Health Connect
- Strava
- Future integrations

Design APIs to be provider-independent where possible.

## Security Rules
- Never expose API keys.
- Use secure authentication.
- Encrypt sensitive data.
- Follow least privilege.
- Validate all inputs.

## Documentation Rules
Every feature should include:
- Purpose
- Architecture
- Dependencies
- Future improvements

No undocumented code.

## AI Coding Rules
Claude should never:
- Rewrite unrelated files
- Refactor the project unless asked
- Change architecture without approval
- Rename files without approval
- Delete code without approval

Always keep changes isolated.

## Git Rules
- Small commits
- One feature per commit
- Meaningful commit messages
- No large refactors mixed with features

## Testing Rules
- Manually test every feature before moving on.
- Add automated tests for critical logic.
- Never merge broken functionality.

## Product Decisions
Prioritize:
1. User simplicity
2. Reliability
3. Performance
4. Scalability
5. Features

Never add complexity unless it clearly improves the user experience.

## Final Rule
Whenever uncertain, ask:

"What would make training easier for the athlete?"

That answer should guide every product, design, and engineering decision.