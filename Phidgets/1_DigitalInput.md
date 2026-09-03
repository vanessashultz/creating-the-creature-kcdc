# Building the Phidget Button Monitor — A Beginner's Walkthrough

This guide walks through `phidget-button.html` piece by piece, explaining not just *what* each part does but *why* it's written that way. No prior JavaScript experience assumed.

## What we're building

A single HTML file, opened directly in a browser, that:
1. Connects to a Phidget Network Server over the network.
2. Listens to a digital input (a button/switch) plugged into a Phidget hub.
3. Shows a colored circle that flips between "PRESSED" and "NEUTRAL" as you press the button.
4. Shows a raw JSON dump of whatever the Phidget library is telling us, for debugging.

Everything lives in one `.html` file — no build tools, no `npm install`, no server needed on your end. You just double-click the file (or serve it) and it runs. That's the right call for a workshop: fewer moving parts means fewer places for things to break before you've even gotten to the interesting part.

## Step 1 — The skeleton (lines 1–6)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Phidget Button Monitor</title>
  <script src="https://unpkg.com/phidget22/browser/phidget22.js"></script>
```

This is boilerplate every HTML page needs, plus one important line: the `<script src="...">` tag. This pulls in Phidget's official browser SDK from a public CDN (a server that just hosts files). Once this line runs, a global object called `phidget22` becomes available to the rest of our page — that's the library we'll use to talk to the hardware.

**Why a CDN instead of downloading the file?** For a one-file workshop demo, it avoids asking anyone to install Node.js or manage a `node_modules` folder. The tradeoff is you need an internet connection to load the page the first time.

## Step 2 — The visual layout (lines 107–137)

Skipping the CSS for now (styling doesn't affect behavior), the body has three sections:

1. **A connection form** — text inputs for the server address/port and a Connect/Disconnect button.
2. **A button visual** — an empty `<div>` that we'll color and label from JavaScript.
3. **A raw state panel** — another `<div>` that will show JSON text.

Each element that JavaScript needs to control later has an `id` attribute (e.g. `id="buttonVisual"`). Think of an `id` as a unique name tag — JavaScript uses `document.getElementById("buttonVisual")` to grab that exact element and change it. Nothing shows up dynamically until JavaScript reaches in and modifies it.

## Step 3 — Grabbing references to the elements (lines 141–148)

```javascript
const connectionForm = document.getElementById("connectionForm");
const serverAddressInput = document.getElementById("serverAddress");
const serverPortInput = document.getElementById("serverPort");
const connectButton = document.getElementById("connectButton");
const disconnectButton = document.getElementById("disconnectButton");
const statusText = document.getElementById("statusText");
const buttonVisual = document.getElementById("buttonVisual");
const rawStatePanel = document.getElementById("rawStatePanel");
```

This is done once, up front, and stored in `const` (constant — the variable itself never gets reassigned to point at something else) variables. Every function below reuses these same references instead of re-querying the page each time.

**Why look these up once instead of every time we need them?** Searching the whole page (`document.getElementById(...)`) has a small cost, and doing it repeatedly for the same element is just wasted work. Since these elements never disappear from the page, we can safely cache them once.

## Step 4 — Helper functions that only touch the display (lines 154–171)

```javascript
function updateRawStatePanel(stateObject) {
  rawStatePanel.textContent = JSON.stringify(stateObject, null, 2);
}

function setConnectedUI(isConnected) {
  statusText.textContent = isConnected ? "Connected" : "Disconnected";
  statusText.className = isConnected ? "connected" : "disconnected";
  connectButton.disabled = isConnected;
  disconnectButton.disabled = !isConnected;
  serverAddressInput.disabled = isConnected;
  serverPortInput.disabled = isConnected;
}

function setButtonVisual(isPressed) {
  buttonVisual.classList.toggle("pressed", isPressed);
  buttonVisual.classList.toggle("neutral", !isPressed);
  buttonVisual.textContent = isPressed ? "PRESSED" : "NEUTRAL";
}
```

These three functions have one job each and don't talk to Phidget hardware at all — they just take a value and update what's on screen.

- `updateRawStatePanel` takes any JavaScript object and turns it into readable, indented JSON text with `JSON.stringify(..., null, 2)`. The `2` means "indent with 2 spaces," which is what makes the raw state panel readable instead of one long line.
- `setConnectedUI` flips the Connect/Disconnect buttons' enabled state and updates the status label. Disabling the form fields while connected prevents someone from editing the address mid-connection and confusing the app.
- `setButtonVisual` toggles CSS classes (`pressed` / `neutral`) rather than manually rewriting styles. The colors themselves live in the `<style>` block — this function only decides *which* state applies.

**Why separate "update the display" from "talk to the Phidget"?** This is a common and useful pattern: keep the code that reacts to hardware events separate from the code that decides what the screen should look like. If you ever want to change the visual (a different animation, a sound effect, whatever), you only touch these functions — you don't need to understand the networking code at all.

## Step 5 — Connecting to the server (lines 173–235)

```javascript
async function connectToPhidgetServer(address, port) {
  const connection = new phidget22.NetworkConnection({
    hostname: address,
    port: port,
    onError: (code, message) => updateRawStatePanel({ connectionError: { code, message }}),
    onConnect: () => updateRawStatePanel({ status: "Connected"}),
    onDisconnect: () => {
      setConnectedUI(false);
      updateRawStatePanel({ status: "Disconnected from server" })
    }
  });

  await connection.connect();
```

`async function` marks this function as one that does work which takes time (like reaching across the network) without freezing the page while it waits. Inside it, `await connection.connect()` means "pause this function here until the connection either succeeds or fails, but let the rest of the page keep working in the meantime." This is the standard way JavaScript handles anything that isn't instant — network calls, file access, timers.

`NetworkConnection` is a Phidget22 object representing the link to the Phidget Network Server (a small program that exposes locally-plugged-in Phidget hardware to other Phidgets on the network). We hand it three callback functions:

- `onError` — fires if something goes wrong at the connection level.
- `onConnect` — fires once the connection is live.
- `onDisconnect` — fires if the server drops us, and importantly calls `setConnectedUI(false)` so the page reflects reality instead of pretending we're still connected.

A **callback** is just a function you hand to something else, to be called later when an event happens — you're not calling it yourself, the Phidget library is.

```javascript
  digitalInput = new phidget22.DigitalInput();

  digitalInput.isHubPortDevice = true;
  digitalInput.hubPort = 0;
```

`DigitalInput` represents one specific type of Phidget channel — a simple on/off sensor, which is exactly what a pushbutton is. Setting `isHubPortDevice = true` and `hubPort = 0` tells the library: "don't search for just any digital input on the network — target the device plugged directly into port 0 of the hub." This matters once more than one Phidget is on the network; without pinning the port, the library would grab whichever digital input it found first, which may not be the button you're pressing.

```javascript
  digitalInput.onAttach = () => {
    updateRawStatePanel({ ... });
    setButtonVisual(digitalInput.state === true);
  };

  digitalInput.onDetach = () => {
    updateRawStatePanel({ status: "Device detached" });
    setButtonVisual(false);
  };

  digitalInput.onStateChange = (state) => {
    setButtonVisual(!state);
    updateRawStatePanel({ ... state, timestamp: new Date().toISOString() ... });
  };

  await digitalInput.open(5000);

  setConnectedUI(true);
```

Three more callbacks, this time on the channel itself:

- `onAttach` fires once the library has actually found and linked to the physical device. This is where we read its initial state — the button might already be held down when the page loads.
- `onDetach` fires if the device is unplugged or the connection is lost. We reset the visual to neutral rather than leaving it showing a stale "pressed" state.
- `onStateChange` is the one that matters for live interaction — it fires every time the button is pressed or released. `setButtonVisual(!state)` inverts the raw hardware value before displaying it, because this particular button/wiring reports `false` when physically pressed and `true` when released (a common wiring choice — many buttons pull the signal low when closed). Adjust or remove that `!` if your own switch is wired the opposite way; the raw state panel below it always shows the *unmodified* value so you can tell which way your hardware actually behaves.

`digitalInput.open(5000)` starts the search for the matching device and waits up to 5000 milliseconds (5 seconds) for it to attach before giving up. `setConnectedUI(true)` only runs after that succeeds, so the UI can't claim "Connected" before there's actually a working channel.

## Step 6 — Disconnecting cleanly (lines 237–249)

```javascript
async function disconnectFromPhidgetServer() {
  if (digitalInput) {
    try {
      await digitalInput.close();
    } catch (error) {
      // Channel may already be closed — nothing to do here.
    }
    digitalInput = null;
  }
  setButtonVisual(false);
  setConnectedUI(false);
  updateRawStatePanel({ status: "Disconnected" });
}
```

The `try { ... } catch (error) { ... }` block means "attempt this, and if it throws an error, don't crash the page — just note it and move on." Closing an already-closed channel is one of those situations, so we swallow that specific failure rather than letting it stop the cleanup. Setting `digitalInput = null` afterward signals "there's currently no active channel," which other code can check.

## Step 7 — Wiring up the buttons (lines 251+)

```javascript
connectionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  ...
  await connectToPhidgetServer(address, port);
  ...
});

disconnectButton.addEventListener("click", disconnectFromPhidgetServer);
```

`addEventListener` is how JavaScript reacts to things a user does — a form submission, a button click. `event.preventDefault()` stops the browser's default behavior of reloading the page when a form is submitted, which is what would normally happen and would blow away our connection.

## Why this structure overall?

- **Display logic, connection logic, and event wiring are kept in separate, small functions.** Each one is short enough to read top to bottom and understand on its own — that's the goal when someone unfamiliar with the code needs to modify it later.
- **The raw state panel exists specifically for debugging.** When hardware doesn't behave the way you expect, seeing the actual values the library is reporting (not just the pretty visual) is the fastest way to figure out why.
- **Everything defensive (`try/catch`, disabling inputs while connected, checking `digitalInput` before using it) exists because hardware and networks fail in ways code doesn't.** A button can be unplugged mid-session, a server can vanish — the page should degrade to a clear "disconnected" state instead of silently breaking.

## Trying it yourself

1. Make sure a Phidget Network Server is running and reachable, with a digital input device (a pushbutton) plugged into hub port 0.
2. Open `phidget-button.html` in a browser.
3. Enter the server's address and port (default `localhost:8989`) and click Connect.
4. Watch the raw state panel for the `"Attached"` message, then press the physical button — the circle and the raw state panel should update together.

If the circle doesn't match physical reality (pressed shows as neutral or vice versa), that's the inversion in `onStateChange` — flip the `!state` to `state` and reload.
