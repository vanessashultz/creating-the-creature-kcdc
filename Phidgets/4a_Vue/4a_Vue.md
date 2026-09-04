# Recreating the Phidget Monitor in Vue

This guide assumes you've been through [`example1.md`](example1.md), [`example2.md`](example2.md), and [`example3.md`](example3.md), and have a single HTML file that connects to a Phidget Network Server and monitors a digital input button, a voltage ratio sensor, and a digital output, all from plain JavaScript.

We're going to rebuild that same page's functionality as a real Vue project, scaffolded with the official CLI and built with [Vite](https://vite.dev/) — the standard way a production Vue app gets started, rather than the single-file, no-build-tools approach the earlier examples used. The *hardware* half of the code (talking to `phidget22`, opening channels, reading `.state`/`.voltageRatio`) barely changes. What changes is the *display* half, and — new in this guide — *how the project is put together*: instead of one `.html` file with a `<script>` tag, you'll have a small folder of files that a build tool assembles for you.

## What stays the same, what changes

Worth naming up front, since a project scaffold touches a lot of files at once:

- **Unchanged:** the `phidget22.NetworkConnection`, `DigitalInput`, `VoltageRatioInput`, and `VoltageOutput` objects, their `isHubPortDevice`/`hubPort` setup, `open(5000)`, `close()`, `setEnabled()`. All of that is Phidget22 API, not DOM manipulation or project structure — it stays exactly as it was. That also includes the "one wire" limitation from `example3.md`: only the voltage output channel is opened by default, with the digital input and voltage ratio setup left in place but commented out.
- **Changed:** how the page's markup, state, and styling are organized (into a Vue *component*), and how the `phidget22` library gets into the page (an installed package instead of a CDN `<script>` tag).

## Step 1 — Scaffold the project

From the `hardware-workshop` directory, run:

```
npm create vue@latest
```

This launches Vue's official interactive project generator. It'll ask for a project name and then a series of yes/no questions about optional tooling — TypeScript, Vue Router, Pinia, ESLint, and so on. For this guide, answer **no** to all of the optional extras; none of them are needed to recreate `example1.md` through `example3.md`, and keeping the scaffold minimal keeps the comparison to the earlier examples close.

**Why answer "no" to everything?** Each of those tools solves a problem this project doesn't have yet — Vue Router is for pages with multiple routes, Pinia is for state shared across many components, TypeScript adds a type system on top of JavaScript. Adding them now would mean learning several new things at once instead of focusing on what a framework itself changes about the code you already understand.

Once it finishes, `cd` into the new project folder (skip this if you named the project `.` and scaffolded directly into `hardware-workshop`), then install the generated dependencies:

```
npm install
```

This is a new step compared to every earlier example. `phidget-button.html` and friends never had a "dependencies" concept — the CDN `<script>` tags fetched code from the network every time the page loaded, and that was the whole story. A scaffolded project instead lists what it depends on in `package.json`, and `npm install` downloads those into a local `node_modules` folder so the build tool can bundle them into your app.

## Step 2 — Install the Phidget22 library as a project dependency

The vanilla and single-file Vue examples both pulled in `phidget22` from a CDN:

```html
<script src="https://unpkg.com/phidget22/browser/phidget22.js"></script>
```

In a project with a build tool, the equivalent is to install it as a package instead:

```
npm install phidget22
```

This adds `phidget22` to your `package.json`'s `dependencies` and downloads it into `node_modules`. Where the CDN version created a *global* called `phidget22` that any script on the page could reach, the installed version is imported explicitly wherever it's needed:

```javascript
import * as phidget22 from 'phidget22'
```

**Why `import * as phidget22` instead of `import phidget22`?** The `phidget22` package exports its classes (`NetworkConnection`, `DigitalInput`, and so on) individually rather than bundled into one default object, so `import * as phidget22` collects all of those named exports under a single `phidget22` namespace — which then behaves exactly like the CDN version's `window.phidget22` did. If you instead try `import phidget22 from 'phidget22'`, the build will fail with an error about a missing "default" export — that's the tell that a package uses named exports instead of a single default one.

## Step 3 — Move the page-level styles into their own file

The vanilla and single-file Vue examples put every style rule in one `<style>` block, including the `body` rule that sets the page's font, width, and background. In a component-based project, styles that apply to the *whole page* are kept separate from styles that belong to one specific piece of UI (Step 6 covers those).

Create `src/assets/main.css`:

```css
body {
  font-family: system-ui, sans-serif;
  max-width: 720px;
  margin: 40px auto;
  padding: 0 16px;
  background: #f5f5f7;
  color: #1a1a1a;
}
```

Then import it at the top of `src/main.js`, before the existing lines:

```javascript
import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

**Why does this file already exist and do this?** `src/main.js` is the scaffold's entry point — it's the first JavaScript that runs, and its job is exactly what the bottom of your single-file `<script>` block used to do: create the Vue app and mount it. Importing a CSS file here means "this stylesheet applies globally, everywhere in the app," which is the right scope for a rule like `body { ... }` that isn't tied to one component.

## Step 4 — Replace the generated `App.vue` with your own template

The scaffold generated a placeholder component at `src/App.vue` with a "You did it!" welcome message. Open it — you'll see it already has the three sections a Vue **Single-File Component** (`.vue` file) is built from: `<script setup>`, `<template>`, and `<style scoped>`. Delete the placeholder content from each section; you'll fill them back in over the next few steps.

This three-part structure is the project equivalent of what a single-file Vue page mixed together in one `<script>` and `<style>` block — a `.vue` file just keeps them in clearly labeled sections of the same file, and the build tool understands how to compile each part.

Start with the `<template>` section — this is the same markup you'd write in the body of a CDN-based Vue page, just without the wrapping `<div id="app">` (the component *is* the mounted app now, so that wrapper isn't needed):

```html
<template>
  <h1>Phidget Monitor</h1>

  <section>
    <form class="connection-form" @submit.prevent="connect">
      <label>
        Server address
        <input v-model="serverAddress" type="text" :disabled="connected" />
      </label>
      <label>
        Port
        <input v-model.number="serverPort" type="number" style="width: 80px" :disabled="connected" />
      </label>
      <button type="submit" :disabled="connected">Connect</button>
      <button type="button" :disabled="!connected" @click="disconnect">Disconnect</button>
    </form>
    <div class="status-line">
      Status:
      <span :class="connected ? 'connected' : 'disconnected'">
        {{ connected ? 'Connected' : 'Disconnected' }}
      </span>
    </div>
  </section>

  <section>
    <h2>Button State</h2>
    <div class="button-visual" :class="buttonPressed ? 'pressed' : 'neutral'">
      {{ buttonPressed ? 'PRESSED' : 'NEUTRAL' }}
    </div>
  </section>

  <section>
    <h2>Voltage Ratio</h2>
    <div class="ratio-visual">
      <div class="ratio-value">{{ ratioDisplay }}</div>
      <div class="ratio-bar-track">
        <div class="ratio-bar-fill" :style="{ width: ratioBarWidth }"></div>
      </div>
    </div>
  </section>

  <section>
    <h2>Voltage Output</h2>
    <button
      class="output-button"
      :class="outputOn ? 'on' : 'off'"
      type="button"
      :disabled="!connected"
      @click="toggleOutput"
    >
      {{ outputOn ? 'ON' : 'OFF' }}
    </button>
  </section>

  <section>
    <h2>Raw Phidget State</h2>
    <div class="raw-state-panel">{{ rawStateText }}</div>
  </section>
</template>
```

Each binding here does the same job it would in a plain-HTML Vue page:

- **`@submit.prevent="connect"`** calls a `connect` function (Step 6) and replaces `event.preventDefault()`.
- **`v-model="serverAddress"`** and **`v-model.number="serverPort"`** two-way bind the inputs to reactive state, replacing manual `.value` reads.
- **`:disabled="..."`** and **`:class="..."`** keep attributes and classes in sync with expressions, replacing lines like `serverAddressInput.disabled = isConnected;` and `buttonVisual.classList.toggle(...)`.
- **`{{ ... }}`** placeholders replace `.textContent` assignments.
- **`:style="{ width: ratioBarWidth }"`** binds the bar's inline width, replacing `ratioBarFill.style.width = ...`.

You'll notice there are no `id="..."` attributes anywhere. `document.getElementById` is no longer how anything gets found or updated — the reactive bindings above do that job — so the `class="..."` names exist purely for styling (Step 7).

## Step 5 — Declare reactive state and computed values

Now the `<script setup>` section. This is where the project's structure genuinely differs from a plain Vue page — the earlier draft of this guide used `createApp({ data() {...}, computed: {...}, methods: {...} })`, the **Options API**. The official Vue scaffold defaults to a different style called the **Composition API**, written with `<script setup>`, which is what you'll use here instead. Both are legitimate ways to write Vue; this guide follows what the CLI generates by default.

Start with the imports and the reactive state:

```javascript
<script setup>
import { ref, computed } from 'vue'
import * as phidget22 from 'phidget22'

const serverAddress = ref('localhost')
const serverPort = ref(8989)
const connected = ref(false)
const buttonPressed = ref(false)
const voltageRatio = ref(null)
const outputOn = ref(false)
const rawState = ref({ status: 'Waiting for connection...' })
</script>
```

**Where `data() { return {...} } }` returned one object of reactive properties, `ref(...)` creates one reactive value at a time.** `ref('localhost')` wraps the string `'localhost'` in a small reactive container; you read or write its current value through `.value` (e.g. `serverAddress.value`) everywhere *except* inside the `<template>`, where Vue unwraps `ref`s automatically — which is why the template above writes `serverAddress` instead of `serverAddress.value`. This is the one syntax difference to keep in mind switching between the two styles: assignments in your functions use `.value`, but template expressions don't.

Anything declared at the top level of `<script setup>` — every `ref`, every function you'll add in Step 6 — is automatically available to the `<template>` section. There's no separate step to "expose" it, unlike the Options API's `data()`/`methods` object, or the plain HTML version's explicit `document.getElementById` calls.

## Step 6 — Add computed values

Add these below the `ref` declarations, still inside `<script setup>`:

```javascript
const rawStateText = computed(() => JSON.stringify(rawState.value, null, 2))

const ratioDisplay = computed(() =>
  voltageRatio.value === null ? '--' : voltageRatio.value.toFixed(4)
)

const ratioBarWidth = computed(() => {
  if (voltageRatio.value === null) {
    return '0%'
  }
  const clampedRatio = Math.min(Math.max(voltageRatio.value, 0), 1)
  return `${clampedRatio * 100}%`
})
```

`computed(() => ...)` is the Composition API's version of a `computed` entry from the Options API — a value that's automatically recalculated whenever the reactive state it reads (here, `rawState.value` or `voltageRatio.value`) changes, and left alone otherwise. `rawStateText` replaces the old `updateRawStatePanel` function's `JSON.stringify` call; `ratioDisplay` and `ratioBarWidth` together replace what `setRatioVisual` used to do — formatting the number and clamping it into a bar width — split into two small computed values instead of one function with two side effects.

## Step 7 — Keep the Phidget channel objects out of Vue's reactive state

This idea doesn't change from the single-file version, but where you write it does. Declare the channel variables as plain `let` bindings at the top of `<script setup>`, above the `ref` declarations — *not* wrapped in `ref(...)`:

```javascript
// Phidget channel objects live outside Vue's reactive state.
// They're not values the template displays directly — they're handles
// used to talk to hardware, and their callbacks update reactive state
// instead of being observed by Vue directly.
let networkConnection = null
let digitalInput = null
let voltageRatioInput = null
let voltageOutput = null
```

**Why still keep them out?** The reasoning is identical to the earlier guide: Vue's reactivity works by wrapping tracked values so it can notice reads and writes, and Phidget22's channel objects already have their own internal getters, setters, and behavior tied to specific property names like `.state` and `.onStateChange`. Wrapping one of those in Vue's reactivity system risks interfering with how the library expects to manage those properties, and there's no benefit to doing so — the template never displays a `DigitalInput` object directly, only the plain values (`buttonPressed`, `voltageRatio`, `outputOn`) that a channel's callback copies out on purpose.

## Step 8 — Add the connection, disconnection, and toggle functions

Add these below the computed values, still inside `<script setup>`:

```javascript
async function connect() {
  try {
    rawState.value = { status: 'Connecting...' }
    await connectToPhidgetServer(serverAddress.value, serverPort.value)
  } catch (error) {
    rawState.value = { connectionError: String(error) }
    connected.value = false
  }
}

async function connectToPhidgetServer(address, port) {
  networkConnection = new phidget22.NetworkConnection({
    hostname: address,
    port: port,
    onError: (code, message) => {
      rawState.value = { connectionError: { code, message } }
    },
    onDisconnect: () => {
      connected.value = false
      rawState.value = { status: 'Disconnected from server' }
    }
  })

  await networkConnection.connect()

  // Like the plain-HTML version, we only have one wire for this demo, so
  // only the voltage output channel is opened here. openDigitalInput() and
  // openVoltageRatioInput() are left in place below — swap the call here
  // to try them instead.
  // await openDigitalInput()
  // await openVoltageRatioInput()
  await openVoltageOutput()

  connected.value = true
}

async function openDigitalInput() {
  digitalInput = new phidget22.DigitalInput()
  digitalInput.isHubPortDevice = true
  digitalInput.hubPort = 0

  digitalInput.onAttach = () => {
    rawState.value = {
      status: 'Attached',
      deviceName: digitalInput.deviceName,
      serialNumber: digitalInput.deviceSerialNumber,
      channel: digitalInput.channel,
      state: digitalInput.state
    }
    buttonPressed.value = digitalInput.state === true
  }

  digitalInput.onDetach = () => {
    rawState.value = { status: 'Device detached' }
    buttonPressed.value = false
  }

  digitalInput.onStateChange = (state) => {
    // This particular button/wiring reports `false` when physically
    // pressed and `true` when released — invert for display.
    buttonPressed.value = !state
    rawState.value = {
      status: 'State change',
      deviceName: digitalInput.deviceName,
      serialNumber: digitalInput.deviceSerialNumber,
      channel: digitalInput.channel,
      state: state,
      timestamp: new Date().toISOString()
    }
  }

  await digitalInput.open(5000)
}

async function openVoltageRatioInput() {
  voltageRatioInput = new phidget22.VoltageRatioInput()
  voltageRatioInput.isHubPortDevice = true
  voltageRatioInput.hubPort = 0

  voltageRatioInput.onAttach = () => {
    rawState.value = {
      status: 'Attached',
      deviceName: voltageRatioInput.deviceName,
      serialNumber: voltageRatioInput.deviceSerialNumber,
      channel: voltageRatioInput.channel,
      voltageRatio: voltageRatioInput.voltageRatio
    }
    voltageRatio.value = voltageRatioInput.voltageRatio
  }

  voltageRatioInput.onDetach = () => {
    rawState.value = { status: 'Device detached' }
    voltageRatio.value = null
  }

  voltageRatioInput.onVoltageRatioChange = (ratio) => {
    voltageRatio.value = ratio
    rawState.value = {
      status: 'Voltage ratio change',
      deviceName: voltageRatioInput.deviceName,
      serialNumber: voltageRatioInput.deviceSerialNumber,
      channel: voltageRatioInput.channel,
      voltageRatio: ratio,
      timestamp: new Date().toISOString()
    }
  }

  await voltageRatioInput.open(5000)
}

async function openVoltageOutput() {
  voltageOutput = new phidget22.VoltageOutput()
  voltageOutput.isHubPortDevice = true
  voltageOutput.hubPort = 0

  voltageOutput.onAttach = () => {
    rawState.value = {
      status: 'Attached',
      deviceName: voltageOutput.deviceName,
      serialNumber: voltageOutput.deviceSerialNumber,
      channel: voltageOutput.channel,
      enabled: voltageOutput.enabled
    }
    outputOn.value = voltageOutput.enabled === true
  }

  voltageOutput.onDetach = () => {
    rawState.value = { status: 'Device detached' }
    outputOn.value = false
  }

  await voltageOutput.open(5000)
  await voltageOutput.setVoltage(4) // Set the voltage as soon as the channel is open
}

async function disconnect() {
  for (const channel of [digitalInput, voltageRatioInput, voltageOutput]) {
    if (channel) {
      try {
        await channel.close()
      } catch (error) {
        // Channel may already be closed — nothing to do here.
      }
    }
  }
  digitalInput = null
  voltageRatioInput = null
  voltageOutput = null

  buttonPressed.value = false
  voltageRatio.value = null
  outputOn.value = false
  connected.value = false
  rawState.value = { status: 'Disconnected' }
}

async function toggleOutput() {
  if (!voltageOutput) {
    return
  }

  const nextState = !voltageOutput.enabled

  try {
    await voltageOutput.setEnabled(nextState)
    outputOn.value = nextState
    rawState.value = {
      status: 'State change',
      deviceName: voltageOutput.deviceName,
      serialNumber: voltageOutput.deviceSerialNumber,
      channel: voltageOutput.channel,
      enabled: nextState,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    rawState.value = { setEnabledError: String(error) }
  }
}
```

Read this next to `example3.md`'s finished version of `connectToPhidgetServer`, `disconnectFromPhidgetServer`, and the output button's click listener — the Phidget22 calls are line-for-line the same, including the "only one wire" limitation: `openDigitalInput()` and `openVoltageRatioInput()` are defined but their calls stay commented out, matching the commented-out calls in `example3.md`'s finished HTML file. The only real differences:

- **Reactive assignments use `.value`.** `buttonPressed.value = digitalInput.state === true` is the Composition API's version of what the single-file guide wrote as `this.buttonPressed = digitalInput.state === true`.
- **There's no `methods: {...}` wrapper.** `connect`, `connectToPhidgetServer`, `openDigitalInput`, `openVoltageRatioInput`, `openVoltageOutput`, `disconnect`, and `toggleOutput` are just top-level `async function` declarations, made available to the template automatically (Step 5).
- **No `this` anywhere.** The Options API relied on arrow functions preserving `this` from the surrounding method; `<script setup>` functions and callbacks just close over the `ref`s directly, since there's no component instance object to refer to in the first place.

## Step 9 — Add the component-specific styles

Fill in the `<style scoped>` section of `App.vue` with everything from the earlier guides' `<style>` block *except* the `body` rule, which you already moved to `src/assets/main.css` in Step 3:

```css
<style scoped>
h1 {
  font-size: 1.4rem;
}

/* Connection form */
.connection-form {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.connection-form input {
  padding: 6px 8px;
  font-size: 1rem;
}

.connection-form button {
  padding: 6px 14px;
  font-size: 1rem;
  cursor: pointer;
}

.status-line {
  margin-bottom: 24px;
  font-size: 0.95rem;
}

.status-line .connected {
  color: #1a7f37;
  font-weight: bold;
}

.status-line .disconnected {
  color: #b42318;
  font-weight: bold;
}

/* Button visual */
.button-visual {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  margin: 32px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  background: #8a8f98;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  transition: background-color 0.1s ease, transform 0.1s ease;
  user-select: none;
}

.button-visual.pressed {
  background: #d3322b;
  transform: scale(0.94);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) inset;
}

.button-visual.neutral {
  background: #3a9d4f;
}

/* Voltage ratio visual */
.ratio-visual {
  margin: 32px auto;
  max-width: 480px;
}

.ratio-value {
  font-size: 2.4rem;
  font-weight: bold;
  text-align: center;
  font-family: 'Courier New', monospace;
}

.ratio-bar-track {
  width: 100%;
  height: 24px;
  background: #d9dce1;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 12px;
}

.ratio-bar-fill {
  height: 100%;
  width: 0%;
  background: #3a9d4f;
  transition: width 0.1s ease;
}

/* Output control button */
.output-button {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  margin: 32px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  background: #8a8f98;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  transition: background-color 0.1s ease, transform 0.1s ease;
  user-select: none;
  border: none;
  cursor: pointer;
}

.output-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.output-button.on {
  background: #3a9d4f;
}

.output-button.off {
  background: #8a8f98;
}

.output-button:active:not(:disabled) {
  transform: scale(0.94);
}

/* Raw state panel */
.raw-state-panel {
  background: #10131a;
  color: #b6ffb6;
  padding: 16px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}

section {
  margin-bottom: 28px;
}

label {
  font-size: 0.9rem;
}
</style>
```

**Why `scoped`?** The `scoped` attribute on this `<style>` block tells Vue's build step to automatically rewrite these selectors so they only match elements inside *this* component's template. That means `.button-visual` here can never accidentally collide with a `.button-visual` class used by some other component elsewhere in a larger app — the styling is as self-contained as the component itself. This isn't a concern the earlier single-file examples had, since there was only ever one `<style>` block for the whole page.

## Step 10 — Run it

Start the dev server:

```
npm run dev
```

This does what double-clicking `phidget-button.html` used to do — except instead of the browser loading a static file directly, Vite compiles your `.vue` component, serves it, and watches for changes so edits show up without a manual reload. Open the URL it prints (typically `http://localhost:5173`).

## Trying it yourself

1. Make sure a Phidget Network Server is running and reachable, with a voltage output device (an LED) plugged into hub port 0 — the same single-wire setup `example3.md` ends on.
2. With `npm run dev` running, open the app in a browser.
3. Enter the server's address and port (default `localhost:8989`) and click Connect.
4. Click the output button — the LED should switch on and off along with the page, behaving identically to the vanilla HTML version, but now built from a proper project structure: state and logic in `<script setup>`, markup in `<template>`, and styling scoped to the component in `<style scoped>`.
5. To try the button or voltage ratio sensor instead, swap which `open...()` call is commented out in `connectToPhidgetServer` — same as swapping which channel is active in `example3.md`'s HTML file.

If you want to ship this somewhere other than your own machine, `npm run build` produces a `dist/` folder of static files — the compiled, bundled equivalent of the single `.html` file the earlier examples were, ready to be hosted anywhere that can serve static files.
