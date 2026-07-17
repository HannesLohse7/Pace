# Pace

An adaptive endurance coaching platform for working adults training for triathlon and other endurance events.

Pace is designed to be the easiest training app to follow — a calm interface, minimal taps, and a schedule that adapts to real life instead of the other way around.

## Who it's for

- Working adults training for Sprint, Olympic, Half Ironman, or Full Ironman triathlons
- Endurance athletes training for running, cycling, swimming, duathlon, or trail running

## MVP scope

- Authentication and onboarding
- Race creation
- Adaptive training plan generation
- Calendar integration and workout calendar
- Daily workout page
- Progress tracking

See [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) for full product scope and [docs/VISION.md](docs/VISION.md) for the long-term direction.

## Tech stack

- [Expo](https://expo.dev/) + [Expo Router](https://docs.expo.dev/router/introduction/) (file-based navigation)
- React Native + TypeScript (strict mode)
- [NativeWind](https://www.nativewind.dev/) (Tailwind-style utility classes for React Native)
- Supabase (planned — not wired up yet; see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md))

## Getting started

Requires Node **24** or newer (see `.nvmrc`; run `nvm use` if you use nvm).

```bash
npm install
npm start
```

This starts the Expo dev server. Scan the printed QR code with [Expo Go](https://expo.dev/go) on your phone, or press `w` to open the web preview.

## Project structure

```
app/                 # Expo Router routes (thin — delegate to feature screens)
features/            # Feature-first app code (e.g. features/home/)
  home/
    components/       # Feature-specific composite components
    data/              # Mock data
    screens/           # Top-level screen components
    types/             # Feature-specific types
shared/              # Cross-feature primitives
  components/          # Reusable UI (Screen, AppText, PrimaryButton, TabBar, ...)
  theme/               # Design tokens (colors, spacing, typography, shadows)
  hooks/ utils/ types/ # Scaffolded, not yet populated
services/            # Scaffolded, not yet populated
lib/supabase/         # Scaffolded, not yet populated
docs/                # Project documentation
design/              # Approved design export and design assets
branding/            # Brand assets
prompts/             # Prompt references
research/            # Supporting research
```

## License

MIT — see [LICENSE](LICENSE).
