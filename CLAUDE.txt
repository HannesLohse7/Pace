# CLAUDE

## Purpose
These instructions define how Claude Code should behave while working on this project.

The goal is to build the easiest training app to follow, with strong architecture and minimal disruption.

## Core Coding Standards
- Use TypeScript.
- Use strict typing.
- Avoid any.
- Prefer small, reusable components.
- Keep one responsibility per component.
- Separate UI from business logic.
- Keep code easy to read and extend.
- Prefer composition over complexity.

## Approved Stack
Use:
- React Native
- Expo
- Expo Router
- Supabase
- NativeWind

Do not add unnecessary libraries.

## File and Folder Discipline
Every feature should be organized with:
- components/
- hooks/
- services/
- types/
- screens/
- utils/

Tests should mirror the folder structure.

## Change Management Rules
- Keep changes isolated.
- Do not rewrite unrelated files.
- Do not refactor the project unless asked.
- Do not rename files unless asked.
- Do not delete code unless asked.
- Do not change architecture without approval.

## When to Ask for Clarification
Ask before proceeding when:
- A request is ambiguous.
- A change could affect multiple systems.
- A design choice changes product scope.
- A file move or rename is implied.
- A refactor would touch unrelated code.
- A behavior requirement is missing important details.

If the safest path is unclear, ask a concise question instead of guessing.

## Implementation Approach
- Make the smallest useful change.
- Preserve existing behavior unless the task explicitly changes it.
- Add reusable abstractions only when they solve a real problem.
- Keep business logic out of UI components.
- Favor clear names over short names.

## Testing Expectations
- Manually test every feature before moving on.
- Add automated tests for critical logic.
- Never leave broken functionality in place.
- Verify the user flow end to end when possible.

## Commit Style
- Use small commits.
- One feature per commit.
- Write meaningful commit messages.
- Avoid mixing refactors with features.

## Documentation Expectations
Every feature should include:
- Purpose
- Architecture
- Dependencies
- Future improvements

Do not leave undocumented code.

## Product Judgment
When there is a tradeoff, optimize for:
1. User simplicity
2. Reliability
3. Performance
4. Scalability
5. Features

If uncertain, ask:

"What would make training easier for the athlete?"

Use that answer to guide the implementation.