# Repository Guidelines

## Project Structure & Module Organization

This is a Vite-powered React and TypeScript single-page application. Code lives in `src/`: `main.tsx` mounts the app, `App.tsx` is the root component, and `index.css` defines global styles. As the project grows, use `src/components/`, `src/features/`, and `src/lib/` for reusable UI, features, and utilities.

Put unchanged static files in `public/` and reference data in `assets/`. Firebase configuration lives in `.firebaserc`, `firebase.json`, `firestore.rules`, and `firestore.indexes.json`. Generated `dist/` output must not be committed.

## Build, Test, and Development Commands

- `npm install` installs the locked dependencies. Use Node.js 22.22.1 or newer.
- `npm run dev` starts the Vite development server.
- `npm run typecheck` runs TypeScript without emitting files.
- `npm run lint` checks TypeScript and React code with ESLint.
- `npm run format` formats supported files with Prettier.
- `npm run build` type-checks and creates the production bundle in `dist/`.
- `npm run preview` serves the production bundle locally.

Run `npm run lint && npm run typecheck && npm run build` before opening a pull request. Firebase Hosting also runs the build before deployment.

## Coding Style & Naming Conventions

Use two-space indentation, single quotes, no semicolons, and trailing commas, as enforced by Prettier. Write components as typed function components. Use `PascalCase` for components and their files, `camelCase` for functions and variables, and descriptive kebab-case names for static assets. Keep feature-specific styles and types close to their owning module.

Husky runs lint-staged on commit; staged JavaScript and TypeScript files receive ESLint fixes and Prettier formatting automatically.

## Testing Guidelines

No automated test framework is configured. Run lint, type-check, and build checks, then manually verify affected flows with `npm run dev`. When tests are introduced, colocate `*.test.ts` or `*.test.tsx` files beside the code under test and add the runner to `package.json`.

## Commit & Pull Request Guidelines

The history contains only an initial commit, so no convention is established. Use short, imperative subjects such as `Add duty history form` and keep commits focused. Pull requests should explain the change, list verification steps, link issues, and include screenshots for UI changes. Call out Firebase rule, index, or hosting changes explicitly.

## Security & Configuration

Never commit secrets or local `.env` files. Keep Firestore access deny-by-default unless a feature has documented authentication and authorization requirements. Review rule changes carefully before deployment and do not hand-edit generated files in `dist/`.
