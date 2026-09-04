# Porting the Phidget Examples to Angular

This guide walks through turning the single-file demos in
[`example1.md`](example1.md), [`example2.md`](example2.md), and
[`example3.md`](example3.md) into routed Angular components inside this
`ng new`-generated app. It assumes you've read those three guides — this
one focuses on what changes (and why) when the same ideas move from one
plain `.html` file into an Angular project.

Each Phidget example becomes its own standalone component
(`Example1`, `Example2`, `Example3`), each with a route, rather than one
file that keeps growing. Angular's component boundary already gives you
the separation `example1.md`'s "Why this structure overall?" section
argued for by hand — display, connection logic, and event wiring per
component — so there's no need to cram all three channels into one file
the way the plain-HTML versions optionally could.

## Step 1 — Load the Phidget SDK once, globally

The original files pulled in the SDK with a `<script>` tag in `<head>`.
In an Angular app there's one `index.html` shared by every route, so the
script tag moves there instead of being duplicated per component:

```html
<!-- src/index.html -->
<head>
  ...
  <script src="https://unpkg.com/phidget22/browser/phidget22.js"></script>
</head>
```

Because this loads before Angular bootstraps, `phidget22` is a real
global by the time any component runs. TypeScript doesn't know that,
though — there's no `@types/phidget22` package — so each component that
uses it declares the same escape hatch the plain-HTML version got for
free from being plain JavaScript:

```ts
declare const phidget22: any;
```

## Step 2 — Replace `getElementById` lookups with template bindings

`example1.md`'s Step 3 cached DOM references once with
`document.getElementById(...)`. Angular doesn't need that step at all —
the template binds directly to component state, and Angular keeps the
DOM in sync on every change. Where the original had:

```js
const buttonVisual = document.getElementById("buttonVisual");
// ...
buttonVisual.classList.toggle("pressed", isPressed);
buttonVisual.textContent = isPressed ? "PRESSED" : "NEUTRAL";
```

the Angular version has a `signal` on the component and a class/text
binding in the template:

```ts
buttonPressed = signal(false);
```

```html
<div class="button-visual" [class.pressed]="buttonPressed()" [class.neutral]="!buttonPressed()">
  {{ buttonPressed() ? 'PRESSED' : 'NEUTRAL' }}
</div>
```

`signal()` plays the same role `const` variables plus manual DOM writes
played before: a single source of truth for "what should the screen show
right now." The difference is you only ever call `.set(...)` on it —
Angular re-renders whatever reads it, so `setButtonVisual`-style helper
functions that reach into the DOM are no longer needed.

## Step 3 — Turn the connection form into a template-driven form

The original `<form id="connectionForm">` read raw `.value` strings off
its inputs on submit. The Angular templates use `FormsModule`'s
`ngModel` instead, bound to signals:

```html
<form class="connection-form" (ngSubmit)="connect()">
  <input
    type="text"
    name="serverAddress"
    [ngModel]="serverAddress()"
    (ngModelChange)="serverAddress.set($event)"
    [disabled]="connected()"
  />
  ...
</form>
```

`(ngSubmit)` replaces the old `addEventListener("submit", ...)` +
`event.preventDefault()` pair — Angular's form directive already stops
the browser's default reload behavior, so that guard isn't needed here.
`[disabled]="connected()"` replaces the manual
`serverAddressInput.disabled = isConnected` line from
`setConnectedUI` — a binding instead of an imperative assignment.

## Step 4 — Keep the Phidget objects as plain instance fields

The parts of the original code that talk to actual hardware barely
change. `connectToPhidgetServer` and `disconnectFromPhidgetServer`
become `async` methods on the component; `digitalInput`,
`voltageRatioInput`, and `voltageOutput` become `private` instance
fields instead of `let` variables at file scope:

```ts
private digitalInput: any = null;

async connect(): Promise<void> {
  const connection = new phidget22.NetworkConnection({ ... });
  await connection.connect();

  this.digitalInput = new phidget22.DigitalInput();
  this.digitalInput.isHubPortDevice = true;
  this.digitalInput.hubPort = 0;

  this.digitalInput.onStateChange = (state: boolean) => {
    this.buttonPressed.set(!state);
    this.updateRawState({ ... });
  };

  await this.digitalInput.open(5000);
  this.setConnected(true);
}
```

Everything about *how* the Phidget library is used — `isHubPortDevice`,
`hubPort`, the `onAttach`/`onDetach`/`onStateChange` callbacks, the
`!state` inversion for this particular button's wiring, `open(5000)` —
is identical to `example1.md`. The only change is that callbacks call
`this.someSignal.set(...)` instead of writing to the DOM directly, and
`this.updateRawState(...)` replaces `updateRawStatePanel(...)`:

```ts
private rawState = signal('Waiting for connection...');

private updateRawState(stateObject: unknown): void {
  this.rawState.set(JSON.stringify(stateObject, null, 2));
}
```

The `try`/`catch` around each channel's `.close()` in
`disconnectFromPhidgetServer`, and the guard clause in the voltage
output's click handler (`if (!this.voltageOutput) { return; }` from
`example3.md`), carry over unchanged — hardware can still be unplugged
mid-session or a server can still vanish regardless of which framework
is drawing the UI. `example3`'s component also carries over
`example3.md`'s "one wire" limitation: it only ever opens the voltage
output channel (`phidget22.VoltageOutput`, using `.enabled`/`setEnabled()`
instead of `DigitalOutput`'s `.state`/`setState()`), since `example1` and
`example2` already cover the digital input and voltage ratio channels as
their own standalone demos.

## Step 5 — One component per example, wired up with routes

Rather than making `example2` and `example3`'s components extend
`example1`'s (the way the guides additively extended one `.html` file),
each example is its own self-contained standalone component — matching
`example1.html`, `example2.html`, and `example3.html`, which are each
independent, single-channel demos:

```
src/app/
  example1/  (digital input — the button monitor)
  example2/  (voltage ratio input)
  example3/  (voltage output control)
```

They're registered as routes and reachable from a small nav bar in the
root component:

```ts
// src/app/app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'example1', pathMatch: 'full' },
  { path: 'example1', component: Example1 },
  { path: 'example2', component: Example2 },
  { path: 'example3', component: Example3 },
];
```

```html
<!-- src/app/app.html -->
<nav class="example-nav">
  <a routerLink="/example1" routerLinkActive="active">Example 1 — Button</a>
  <a routerLink="/example2" routerLinkActive="active">Example 2 — Voltage Ratio</a>
  <a routerLink="/example3" routerLinkActive="active">Example 3 — Voltage Output</a>
</nav>

<router-outlet />
```

The layout rules shared by all three (`.connection-form`,
`.status-line`, `.raw-state-panel`, etc.) live in one
`src/app/phidget-shared.css`, referenced from each component's
`styleUrls` array alongside a component-specific stylesheet for its own
visual (`.button-visual`, `.ratio-visual`, `.output-button`) — the same
CSS from the original `<style>` blocks, just split along the same lines
as the components themselves instead of duplicated three times.

## Trying it yourself

1. `npm start` (or `ng serve`) and open `http://localhost:4200`.
2. Use the nav bar to switch between Example 1, 2, and 3 — each is an
   independent route with its own connection form.
3. Enter your Phidget Network Server's address and port and connect, the
   same way you would with the plain `.html` files. The behavior —
   including the button's `!state` inversion and the voltage output's
   optimistic-update-free click handler — is unchanged from the originals.
   Example 3 expects a voltage output device (an LED) on hub port 0, the
   same single-wire setup `example3.md` ends on.
