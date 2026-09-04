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

## Step 1 — Install the Phidget22 SDK as a dependency

The original files pulled in the SDK with a `<script>` tag pointed at a CDN.
A React Router app already has a build pipeline, so instead the SDK is
installed like any other package:

```bash
npm install phidget22
```

and imported directly in each route component:

```tsx
import * as phidget22 from "phidget22";
```

`phidget22.NetworkConnection`, `phidget22.DigitalInput`, and the rest are
then used exactly as they were off the old global — just referenced without
the `window.` prefix. This also means the SDK is version-pinned in
`package.json` and bundled by Vite instead of fetched from a CDN at runtime.

## Step 2 — Drop the hand-rolled types

The vanilla JS examples never needed types. TypeScript does, but the
`phidget22` package ships its own type declarations, so there's no need to
hand-write ambient types the way an earlier pass of this example did with
`app/phidget22.d.ts` — importing the package gives full, accurate types for
`NetworkConnection`, `DigitalInput`, `VoltageRatioInput`, `DigitalOutput`,
and everything else in the SDK for free.

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
channel's setup and cleanup the same way — nothing from the earlier
channels' code changed to make room for the new one. It also carries over
`example3.md`'s "one wire" limitation: `connectToPhidgetServer` in
`example3.tsx` defines `openDigitalInput()`, `openVoltageRatioInput()`, and
`openDigitalOutput()` as local helper functions, but only calls
`openDigitalOutput()` — the other two calls are left in place, commented
out, exactly like the commented-out calls in `example3.md`'s finished HTML
file.

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
   whatever hardware is plugged into hub port 0 for each page — a button
   for `/example1`, a voltage ratio sensor for `/example2`, and a voltage
   output device (an LED) for `/example3`, which only opens that one
   channel by default. To try the button or ratio sensor on `/example3`
   instead, swap which `open...()` call is commented out in
   `connectToPhidgetServer`.

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
