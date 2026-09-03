# Recreating the Examples in React — `example4b`

This guide walks through how `example1.html`, `example2.html`, and `example3.html`
were rebuilt as pages in a React Router app (created with
`npx create-react-router@latest`), following the same cumulative structure as
[`example1.md`](example1.md), [`example2.md`](example2.md), and
[`example3.md`](example3.md): each example adds one more Phidget channel on
top of the last, without breaking what came before.

The React versions live at `app/routes/example1.tsx`, `example2.tsx`, and
`example3.tsx`, and are reachable at `/example1`, `/example2`, `/example3`
once the dev server is running.

## Step 1 — Load the Phidget22 SDK once, globally

The original files each pulled in the SDK with a `<script>` tag in `<head>`.
In a React Router app there's one HTML shell (`app/root.tsx`) shared by every
route, so the script only needs to be added once, in `Layout`:

```tsx
<script src="https://unpkg.com/phidget22/browser/phidget22.js"></script>
```

This makes the same global `phidget22` object available on `window` in every
route component, exactly as it was available globally in the plain HTML
pages.

## Step 2 — Type the global SDK

The vanilla JS examples never needed types. TypeScript does, so
`app/phidget22.d.ts` declares a minimal `namespace phidget22` (just the
classes and members the examples actually use: `NetworkConnection`,
`DigitalInput`, `VoltageRatioInput`, `DigitalOutput`) and augments
`Window` with a `phidget22` property. This is intentionally thin — just
enough shape to avoid `any` — not a full port of the SDK's real types.

## Step 3 — Replace DOM lookups with React state and refs

Every `document.getElementById(...)` in the original files became either:

- **React state** (`useState`), for anything that affects what's rendered —
  connection status, button-pressed state, voltage ratio, output state, and
  the raw state panel's contents.
- **A `useRef`**, for the live Phidget channel objects themselves
  (`digitalInputRef`, `voltageRatioInputRef`, `digitalOutputRef`). These
  need to persist across renders without *causing* a re-render when
  assigned, which is exactly what `useRef` is for — the same role the plain
  `let digitalInput = null;` variables played in the HTML versions.

The three "display only" helper functions (`setConnectedUI`,
`setButtonVisual`, `setRatioVisual`, `setOutputButtonVisual`) disappear as
separate functions — in React, the JSX itself is that function, re-run
automatically whenever the relevant state changes. For example,
`isButtonPressed ? "pressed" : "neutral"` in the `className` replaces
`buttonVisual.classList.toggle(...)`.

## Step 4 — Keep the connect/disconnect logic structurally identical

`connectToPhidgetServer` and `disconnectFromPhidgetServer` were carried over
almost line-for-line — same `NetworkConnection` setup, same per-channel
`onAttach` / `onDetach` / `onStateChange` (or `onVoltageRatioChange`)
callbacks, same guarded `try/catch` around each channel's `close()`. The
only change inside them is that every place the original wrote directly to
the DOM (`buttonVisual.textContent = ...`) now calls a state setter
(`setIsButtonPressed(...)`) instead, and callback assignment happens on a
locally-created object which is then also stored in the matching ref
(`digitalInputRef.current = digitalInput`).

This mirrors the additive pattern from `example2.md`/`example3.md`
directly: `example2.tsx` is `example1.tsx` with a second channel's setup,
state, and cleanup inserted alongside the first; `example3.tsx` adds a third
channel the same way — nothing from the earlier channels' code changed to
make room for the new one.

## Step 5 — Turn the connection form into a controlled form

The server address and port inputs became controlled inputs
(`value` + `onChange` wired to `useState`), and the form's `onSubmit`
handler still calls `event.preventDefault()` for the same reason as the
original — to stop the browser from reloading the page and killing the
connection.

## Step 6 — Reuse the original CSS almost as-is

The visual design (the colored circle, the ratio bar, the dark raw-state
panel) is the same CSS as the HTML files, moved into a shared stylesheet at
`app/phidget-examples.css` and imported by all three route components. The
selectors were left as ID selectors (`#buttonVisual`, `#ratioBarFill`,
`#outputButton`, `#rawStatePanel`) so the CSS itself didn't need to change —
only the surrounding page shell (`.phidget-page`, `.connection-form`,
`.status-line`) was renamed from IDs to classes, since only one instance of
those exists in the app shell already (`app/app.css`) that uses Tailwind's
`@import "tailwindcss"`.

## Step 7 — Wire up routing

Each example got its own route in `app/routes.ts`:

```ts
export default [
  index("routes/home.tsx"),
  route("example1", "routes/example1.tsx"),
  route("example2", "routes/example2.tsx"),
  route("example3", "routes/example3.tsx"),
] satisfies RouteConfig;
```

and the home page (`app/routes/home.tsx`) got plain links to `/example1`,
`/example2`, `/example3` so all three are reachable from the app's root.

## Trying it yourself

1. `npm install`
2. `npm run dev`
3. Visit `/example1`, `/example2`, `/example3` in the browser.
4. Same as the HTML versions: enter the Phidget Network Server's address and
   port (default `localhost:8989`), click Connect, and interact with
   whatever hardware is plugged into hub port 0 for each channel type.

## What's genuinely different from the HTML versions

- **No manual DOM writes anywhere.** Every place the original called
  `.textContent =`, `.classList.toggle(...)`, or `.style.width =` is now
  just JSX reading from state.
- **Cleanup is still manual.** React doesn't know how to close a Phidget
  channel for you — `disconnectFromPhidgetServer` still explicitly closes
  each ref's current channel, same as before.
- **Nothing here uses `useEffect`.** All three examples only touch Phidget
  hardware in response to a user action (submitting the connect form,
  clicking Disconnect, clicking the output button), so there's no
  connect-on-mount behavior that would need an effect.
