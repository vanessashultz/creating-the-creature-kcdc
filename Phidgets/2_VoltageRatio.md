# Adding a Voltage Ratio Reading — Extending `phidget-button.html`

This guide assumes you've been through [`example1.md`](example1.md) and have a working `phidget-button.html` that lights up a circle when a digital input button is pressed.

We're going to extend that same file rather than change it. By the end, your page will monitor *two* Phidget channels at once: the digital input button from `example1.md`, still working exactly as it did, plus a new **voltage ratio** channel — a continuous value roughly between 0 and 1, which is what Phidget's analog sensors (like a potentiometer or a flex sensor) report. Nothing you already have gets removed or rewritten; every step below only adds new HTML, CSS, or JavaScript alongside what's there.

The result won't look exactly like `example2.html` — that file only handles a voltage ratio channel on its own. That's fine. The point here is to see how a second channel can live comfortably alongside the first once you understand the pattern.

Work through this top to bottom, adding to your existing file as you go.

## Step 1 — Add CSS for the ratio visual

Your `<style>` block already has a `/* Button visual */` section for `#buttonVisual`. Leave that exactly as it is, and add a new `/* Voltage ratio visual */` section after it:

```css
/* Voltage ratio visual */
#ratioVisual {
  margin: 32px auto;
  max-width: 480px;
}

#ratioValue {
  font-size: 2.4rem;
  font-weight: bold;
  text-align: center;
  font-family: "Courier New", monospace;
}

#ratioBarTrack {
  width: 100%;
  height: 24px;
  background: #d9dce1;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 12px;
}

#ratioBarFill {
  height: 100%;
  width: 0%;
  background: #3a9d4f;
  transition: width 0.1s ease;
}
```

**Why a track-and-fill bar instead of just text?** A number alone (`0.5731`) doesn't give you an instant sense of "is this near the top or bottom of the range?" A bar that fills left-to-right does, at a glance. `#ratioBarTrack` is the empty gray background; `#ratioBarFill` is the colored portion whose `width` we'll set from JavaScript, and `transition: width 0.1s ease` makes that width change animate smoothly rather than jumping.

## Step 2 — Add markup for the ratio visual

In the body, you already have a section for the button:

```html
<section>
  <h2>Button State</h2>
  <div id="buttonVisual" class="neutral">NEUTRAL</div>
</section>
```

Leave it in place, and add a new section right after it:

```html
<section>
  <h2>Voltage Ratio</h2>
  <div id="ratioVisual">
    <div id="ratioValue">--</div>
    <div id="ratioBarTrack">
      <div id="ratioBarFill"></div>
    </div>
  </div>
</section>
```

There's no `pressed`/`neutral`-style class here — a voltage ratio doesn't have two discrete states, so there's nothing to toggle. Instead there are two elements JavaScript will reach into separately: `#ratioValue` (the number) and `#ratioBarFill` (the bar's width). `--` is a placeholder shown before we've received a real reading, matching the "Waiting for connection..." placeholder already used in the raw state panel.

## Step 3 — Add element references

In the `// Elements` block, you already have a line for the button visual:

```javascript
const buttonVisual = document.getElementById("buttonVisual");
```

Leave it, and add two new lines beneath it for the elements from Step 2:

```javascript
const ratioValue = document.getElementById("ratioValue");
const ratioBarFill = document.getElementById("ratioBarFill");
```

## Step 4 — Add a second Phidget object variable

You already have:

```javascript
let digitalInput = null;
```

Add a second `let` declaration for the new channel, right after it:

```javascript
let voltageRatioInput = null;
```

Both channels will be created, opened, and closed independently, so each gets its own variable to hold onto the object between callbacks.

## Step 5 — Add a display helper for the ratio

You already have `setButtonVisual`. Leave it untouched, and add a new function after it:

```javascript
// Voltage ratios from this sensor type range roughly 0 - 1
function setRatioVisual(ratio) {
  if (ratio === null || ratio === undefined) {
    ratioValue.textContent = "--";
    ratioBarFill.style.width = "0%";
    return;
  }

  ratioValue.textContent = ratio.toFixed(4);

  const clampedRatio = Math.min(Math.max(ratio, 0), 1);
  ratioBarFill.style.width = `${clampedRatio * 100}%`;
}
```

This follows the same "one job, no hardware talk" pattern as `setButtonVisual` — it just takes a number instead of a boolean. A few details worth understanding:

- **The `null`/`undefined` guard clause.** `setButtonVisual` never needed this because a button's state is always `true` or `false`. This function needs to handle "no reading yet" as a distinct case, since we'll call `setRatioVisual(null)` on disconnect (Step 8) to reset the display.
- **`ratio.toFixed(4)`** formats the number to 4 decimal places (e.g. `0.5731`) so the display doesn't jump around with long floating-point noise like `0.57309999997`.
- **The clamp.** `Math.min(Math.max(ratio, 0), 1)` forces the value into the 0–1 range before turning it into a percentage width. Voltage ratio sensors *typically* report 0–1, but wiring quirks or an unconnected sensor can push a reading slightly outside that band — without clamping, a bar could try to render at `-4%` or `140%` width. Note this only affects the *bar fill*; `ratioValue` still shows the true, unclamped number.

## Step 6 — Add the voltage ratio channel inside `connectToPhidgetServer`

Inside `connectToPhidgetServer`, you already open the digital input channel:

```javascript
digitalInput = new phidget22.DigitalInput();

digitalInput.isHubPortDevice = true;
digitalInput.hubPort = 0;

// Any channel on any hub connected to the server — adjust if you need
// to target a specific device/channel.
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
  updateRawStatePanel({ ... });
};

await digitalInput.open(5000);

setConnectedUI(true);
```

Leave all of that in place, and add the voltage ratio channel's setup right before the final `setConnectedUI(true);` line:

```javascript
voltageRatioInput = new phidget22.VoltageRatioInput();

voltageRatioInput.isHubPortDevice = true;
voltageRatioInput.hubPort = 0;

// Any channel on any hub connected to the server — adjust if you need
// to target a specific device/channel.
voltageRatioInput.onAttach = () => {
  updateRawStatePanel({
    status: "Attached",
    deviceName: voltageRatioInput.deviceName,
    serialNumber: voltageRatioInput.deviceSerialNumber,
    channel: voltageRatioInput.channel,
    voltageRatio: voltageRatioInput.voltageRatio
  });
  setRatioVisual(voltageRatioInput.voltageRatio);
};

voltageRatioInput.onDetach = () => {
  updateRawStatePanel({ status: "Device detached" });
  setRatioVisual(null);
};

voltageRatioInput.onVoltageRatioChange = (voltageRatio) => {
  setRatioVisual(voltageRatio);
  updateRawStatePanel({
    status: "Voltage ratio change",
    deviceName: voltageRatioInput.deviceName,
    serialNumber: voltageRatioInput.deviceSerialNumber,
    channel: voltageRatioInput.channel,
    voltageRatio: voltageRatio,
    timestamp: new Date().toISOString()
  });
};

await voltageRatioInput.open(5000);
```

So the function now opens *two* channels, one after the other, before it reports `setConnectedUI(true)`. A few things worth noticing:

- **`phidget22.VoltageRatioInput()`** is a different channel class from `phidget22.DigitalInput()` — this is the line that tells the library what kind of hardware to look for. `isHubPortDevice = true` and `hubPort = 0` mean the same thing here as they did for the digital input: "the channel plugged into port 0." If both devices are plugged into hub port 0 on *different hub port types* (a digital port vs. an analog/voltage-ratio-capable port), the library can tell them apart — you don't need to change these values to avoid a collision.
- **`voltageRatioInput.voltageRatio`** is the property this channel type exposes for its current reading, the same way `digitalInput.state` was the property for the button. It's read once in `onAttach` (in case the sensor already has a value the moment we connect) and passed along on every `onVoltageRatioChange`.
- **Note there's no `!` inversion here**, unlike `setButtonVisual(!state)` for the button. That inversion in `example1.md` was a workaround for a specific wiring quirk on that particular switch. A voltage ratio is a continuous physical measurement, not a switch, so `setRatioVisual(voltageRatio)` passes the raw value straight through.
- **Both channels' `open(5000)` calls are awaited before `setConnectedUI(true)` runs**, so the UI won't claim "Connected" until both channels are actually attached.

## Step 7 — Warm-start the ratio's raw-state message

You might notice the connection's own `onConnect` callback near the top of `connectToPhidgetServer` already exists and doesn't need any changes — it's unrelated to either channel. No action needed here; this step is just a reminder to leave that callback alone as you edit the surrounding code.

## Step 8 — Add cleanup for the voltage ratio channel on disconnect

You already have:

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

Add a matching block for the voltage ratio channel, and a call to reset its visual, without touching the existing lines:

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
  if (voltageRatioInput) {
    try {
      await voltageRatioInput.close();
    } catch (error) {
      // Channel may already be closed — nothing to do here.
    }
    voltageRatioInput = null;
  }
  setButtonVisual(false);
  setRatioVisual(null);
  setConnectedUI(false);
  updateRawStatePanel({ status: "Disconnected" });
}
```

Each channel gets its own guarded close, since either one could already be closed or never have successfully opened. Both display resets (`setButtonVisual(false)` and `setRatioVisual(null)`) run before the final status update, so the page returns to a fully neutral state regardless of which channels were active.

## Step 9 — Everything else is unchanged

The connection form's submit handler and the disconnect button's click listener at the bottom of the script don't reference either channel by name — they just call `connectToPhidgetServer` and `disconnectFromPhidgetServer`. Nothing there needs to change.

```javascript
connectionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const address = serverAddressInput.value.trim();
  const port = parseInt(serverPortInput.value, 10);

  try {
    updateRawStatePanel({ status: "Connecting..." });
    await connectToPhidgetServer(address, port);
  } catch (error) {
    updateRawStatePanel({ connectionError: String(error) });
    setConnectedUI(false);
  }
});

disconnectButton.addEventListener("click", disconnectFromPhidgetServer);
```

This is worth noticing on its own: because each channel's setup, callbacks, and cleanup are self-contained blocks, adding a second channel meant inserting new code alongside the old, not untangling it. That's the payoff of the separation described in `example1.md`'s "Why this structure overall?" section.

## Trying it yourself

1. Make sure a Phidget Network Server is running and reachable, with a digital input (a pushbutton) plugged into hub port 0, and a voltage ratio sensor (a potentiometer or flex sensor) also connected.
2. Open your updated file in a browser.
3. Enter the server's address and port (default `localhost:8989`) and click Connect.
4. Watch the raw state panel for two `"Attached"` messages as each channel comes online. Press the button — the circle should update. Move the sensor — the number and bar should update. Both should keep working independently of each other.

Since the raw state panel only ever shows the *most recent* message, pressing the button and adjusting the sensor in quick succession will make the panel's contents jump between the two — that's expected, since both channels are logging to the same panel.
