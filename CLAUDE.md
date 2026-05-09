# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Lumo AI

A React Native (iOS + Android) app that runs small language models (SLMs) fully on-device via [llama.rn](https://github.com/mybigday/llama.rn) (llama.cpp bindings). Models are downloaded from HuggingFace Hub and stored locally. No inference data leaves the device.

The npm package is named `lumo`; the app is published as **PocketPal AI** on the App Store and Google Play.

## Commands

```bash
# Install dependencies
yarn install
cd ios && pod install && cd ..   # iOS only

# Run
yarn ios         # iPhone 16 Pro simulator
yarn android     # Android emulator

# Lint / type-check / test
yarn lint
yarn typecheck
yarn test                        # all Jest tests
yarn test --testPathPattern src/store/__tests__/ModelStore.test.ts  # single file

# Localization
yarn l10n:validate               # validate en.json placeholders

# Clean builds
yarn clean:ios
yarn clean:android

# Metro
yarn start
yarn start:reset                 # clear cache
```

Commits must follow **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`).

## Architecture

### State management: MobX stores (`src/store/`)

All global state lives in singleton MobX stores. Screens and components import them directly — there is no React context for stores.

| Store | Responsibility |
|---|---|
| `ModelStore` | Model list, download management, llama.rn context lifecycle (load/unload), completion execution |
| `ChatSessionStore` | Chat sessions, messages, generation state, streaming throttle |
| `PalStore` | Pal CRUD, PalsHub marketplace integration, migration from legacy pal format |
| `HFStore` | HuggingFace Hub search and model metadata |
| `BackgroundStore` | Chat background image management (default + user-imported), overlay generation |
| `TTSStore` | TTS engine selection, playback state |
| `UIStore` | Theme, UI flags |
| `ServerStore` | Remote OpenAI-compatible server config |
| `FeedbackStore` | In-app feedback submission |
| `DeepLinkStore` | Deep link queue |

### Completion engines (`src/api/completionEngines.ts`)

Two implementations of the `CompletionEngine` interface:
- `LocalCompletionEngine` — wraps `LlamaContext` from `llama.rn` for on-device inference
- `OpenAICompletionEngine` — streams from a remote OpenAI-compatible server via SSE

`ModelStore` picks the right engine based on whether a local model or a remote server is active.

### TTS service (`src/services/tts/`)

Plugin architecture: four engines (`system`, `supertonic`, `kokoro`, `kitten`) registered in `engineRegistry.ts`. Each engine directory has its own voice list and download logic. `TTSStore` drives engine selection and playback state.

### Database: WatermelonDB (`src/database/`)

SQLite via WatermelonDB (JSI mode). Schema version 6. Tables: `chat_sessions`, `messages`, `completion_settings`, `global_settings`, `cached_pals`, `user_library`, `sync_status`, `local_pals`. Models and migrations live in `src/database/models/` and `src/database/migrations.ts`. Repository pattern in `src/repositories/` wraps queries.

### PalsHub (`src/services/palshub/`)

Cloud marketplace for shareable AI personas backed by Supabase + Google Sign-In. `AuthService`, `PalsHubService`, `SyncService` handle auth, CRUD, and bi-directional sync. `PalStore` coordinates between local pals (WatermelonDB `local_pals`) and remote cached pals (`cached_pals`).

### Navigation

React Navigation with a drawer (`@react-navigation/drawer`). Screens: `ChatScreen`, `ModelsScreen`, `PalsScreen`, `SettingsScreen`, `AboutScreen`. A `DevToolsScreen` ships only in debug builds. Route names are defined in `src/utils/navigationConstants.ts`.

### Theming (`src/utils/theme.ts`)

Three themes built on top of `react-native-paper` MD3 tokens: **dark** (default), **light**, and **x1** (a blue-purple experimental theme). Each theme extends MD3 base colors with custom semantic tokens (glass surfaces, message bubbles, thinking bubbles, button variants). `UIStore.colorScheme` drives the active theme; components consume it via the `useTheme()` hook from `src/hooks/useTheme.ts`.

### Visual system

The app has a distinctive "AI soul terminal" aesthetic centered on dark backgrounds, blue-purple glow, and glassmorphism.

- **Glass effects** — Two paths controlled by `UIStore.useLiquidGlass`: when enabled, uses `@shopify/react-native-skia` + `@uginy/react-native-liquid-glass` for a matte glass effect; when disabled, falls back to `@react-native-community/blur` for plain frosted glass. Used by `GlassCard`, `LiquidGlass`, and `ChatInput` components.
- **Background layer** — `BackgroundLayer` component renders the character/AI-projection background behind chat. Managed by `BackgroundStore` (default `background.png` + user-imported images). Default background is a dark cosmic scene with gold-rimmed hologram figure.
- **Bubble system** — Custom message bubbles (`Bubble`, `ResponseBubble`, `ThinkingBubble`, `LoadingBubble`) with glow effects, distinct from stock chat UIs.

### Environment flags

- `__DEV__` — React Native dev mode. Gates `DevToolsScreen` and debug-only behavior.
- `__E2E__` — Set in the E2E build flavor (`com.pocketpalai.e2e`). Ships the `AutomationBridge` (`src/__automation__/`) and enables deep-link test hooks.

### Localization (`src/locales/`)

i18n via a custom `t()` helper in `src/locales/index.ts`. **Only edit `src/locales/en.json`** — all other locale files are maintained by Weblate translators. Use `{{placeholder}}` (double braces) for dynamic values. Validate with `yarn l10n:validate`.

### E2E tests (`e2e/`)

Appium + WebDriverIO test suite. The E2E build (`yarn android:build:e2e`) uses a separate `com.pocketpalai.e2e` application ID and ships an automation bridge (`src/__automation__/`) that is excluded from prod builds. Specs: `quick-smoke`, `load-stress`, `thinking`, `diagnostic`, `benchmark-matrix`. See `e2e/README.md` for full usage.

### Key conventions

- `src/utils/types.ts` — central `MessageType` namespace and core model/chat types
- `src/types/pal.ts` — Pal and `ParameterDefinition` types (schema-driven dynamic parameters)
- `src/utils/completionTypes.ts` — `CompletionEngine` interface and related param types
- Native specs live in `src/specs/` (React Native New Architecture codegen)
- Mocks for Jest are in `__mocks__/external/`; real tests in `__tests__` siblings to the modules they test
- Coverage thresholds enforced at 60% (branches/functions/lines/statements)
