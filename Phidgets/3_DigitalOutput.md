# Adding a Digital Output — Extending Your File Further

This guide assumes you've been through [`example1.md`](example1.md) and [`example2.md`](example2.md), and have a file that monitors both a digital input button and a voltage ratio sensor at the same time.

We're extending that file once more, additively, the same way `example2.md` did. By the end, your page will handle a *third* Phidget channel alongside the other two: a **digital output** (something like an LED or a relay wired to a Phidget hub), controlled by clicking a button in the page. Nothing you already have gets removed or rewritten — every step below only adds new HTML, CSS, or JavaScript, or inserts a line into an existing function without touching what's already there.

This is also the first channel in the series that *writes* to hardware instead of only reading from it — data will flow from a click in the browser out to the physical device, not just the other way around.

The result won't look exactly like `example3.html` — that file only handles a digital output on its own. That's fine, for the same reason it was fine in `example2.md`: the goal is to see how a third channel slots in next to the first two once you know the pattern.

Work through this top to bottom, adding to your existing file as you go.

## Step 1 — Add CSS for the output button

Your `<style>` block now has a `/* Button visual */` section and a `/* Voltage ratio visual */` section. Leave both as they are, and add a new `/* Output control button */` section after them:

```css
/* Output control button */
#outputButton {
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

#outputButton:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

#outputButton.on {
  background: #3a9d4f;
}

#outputButton.off {
  background: #8a8f98;
}

#outputButton:active:not(:disabled) {
  transform: scale(0.94);
}
```

This is the same colored-circle look as `#buttonVisual`, but this time the circle itself *is* a real `<button>` element (see Step 2), not a plain `<div>` used only for display. That's why there's more here than `#buttonVisual` had:

- **`border: none; cursor: pointer;`** strip the default browser button chrome and show a hand cursor, so it reads as clickable.
- **`:disabled`** dims it and swaps to a "not allowed" cursor. We disable this button until we're connected — clicking it before there's a device to control wouldn't do anything useful, and now the button's own appearance says so.
- **`:active:not(:disabled)`** gives a little "press" animation (the same `scale(0.94)` used for `.pressed` on the button visual) but only while enabled.
- **`.on` / `.off`** are the same idea as `.pressed` / `.neutral` — two mutually exclusive classes toggled from JavaScript to show which state we're in.

## Step 2 — Add markup for the output button

You now have a `Button State` section and a `Voltage Ratio` section in the body. Leave both in place, and add a new section after them:

```html
<section>
  <h2>Digital Output</h2>
  <button id="outputButton" class="off" type="button" disabled>OFF</button>
</section>
```

A few things to notice here that differ from the elements added in `example2.md`:

- **It's a `<button>`, not a `<div>`.** Every visual element added so far has been for *display only* — JavaScript wrote to them, but the user never interacted with them directly. This one is the opposite: it's the thing the user clicks to change the hardware's state.
- **`type="button"`.** This element lives in the body alongside `<form id="connectionForm">` but is not part of that form. Without `type="button"`, a `<button>` would need to be outside any `<form>` to avoid accidentally triggering a submit — being explicit here avoids any ambiguity if the markup ever gets rearranged.
- **`disabled` by default.** It starts unusable, matching `disconnectButton` in the connection form — both only make sense once we're connected. You'll wire up *why* in Step 5.

## Step 3 — Add an element reference

In the `// Elements` block, you already have references for the button visual and the ratio visual elements. Add one more line after them, for the button from Step 2:

```javascript
const outputButton = document.getElementById("outputButton");
```

## Step 4 — Add a third Phidget object variable

You already have:

```javascript
let digitalInput = null;
let voltageRatioInput = null;
```

Add a third declaration after them:

```javascript
let digitalOutput = null;
```

## Step 5 — Add a line to `setConnectedUI`

Find `setConnectedUI`:

```javascript
function setConnectedUI(isConnected) {
  statusText.textContent = isConnected ? "Connected" : "Disconnected";
  statusText.className = isConnected ? "connected" : "disconnected";
  connectButton.disabled = isConnected;
  disconnectButton.disabled = !isConnected;
  serverAddressInput.disabled = isConnected;
  serverPortInput.disabled = isConnected;
}
```

Add one new line at the end, leaving everything else exactly as it is:

```javascript
function setConnectedUI(isConnected) {
  statusText.textContent = isConnected ? "Connected" : "Disconnected";
  statusText.className = isConnected ? "connected" : "disconnected";
  connectButton.disabled = isConnected;
  disconnectButton.disabled = !isConnected;
  serverAddressInput.disabled = isConnected;
  serverPortInput.disabled = isConnected;
  outputButton.disabled = !isConnected;
}
```

This is what makes the `disabled` attribute from Step 2 actually turn on and off — `outputButton.disabled = !isConnected` means "disabled while *not* connected," the same rule already used for `disconnectButton`.

## Step 6 — Add a display helper for the output button

You already have `setButtonVisual` and `setRatioVisual`. Leave both untouched, and add a new function after them:

```javascript
function setOutputButtonVisual(isOn) {
  outputButton.classList.toggle("on", isOn);
  outputButton.classList.toggle("off", !isOn);
  outputButton.textContent = isOn ? "ON" : "OFF";
}
```

Notice this is simpler than `setRatioVisual` — no clamping, no number formatting, no `null` case. A digital output only ever has two states, `true` or `false`, so this function is really the same shape as `setButtonVisual`, with `PRESSED`/`NEUTRAL` renamed to `ON`/`OFF` and `pressed`/`neutral` renamed to `on`/`off`. Same shape, different vocabulary — because the thing it's describing (an on/off circuit) is the same shape as the thing `setButtonVisual` describes (an on/off button), even though one is an input and the other is an output.

## Step 7 — Add the digital output channel inside `connectToPhidgetServer`

Inside `connectToPhidgetServer`, you already open the digital input and voltage ratio channels, ending with something like:

```javascript
  // ...voltageRatioInput setup from example2.md...

  await voltageRatioInput.open(5000);

  setConnectedUI(true);
}
```

Leave all of that in place, and insert the digital output channel's setup right before the final `setConnectedUI(true);` line:

```javascript
digitalOutput = new phidget22.DigitalOutput();

digitalOutput.isHubPortDevice = true;
digitalOutput.hubPort = 0;

// Any channel on any hub connected to the server — adjust if you need
// to target a specific device/channel.
digitalOutput.onAttach = () => {
  updateRawStatePanel({
    status: "Attached",
    deviceName: digitalOutput.deviceName,
    serialNumber: digitalOutput.deviceSerialNumber,
    channel: digitalOutput.channel,
    state: digitalOutput.state
  });
  setOutputButtonVisual(digitalOutput.state === true);
};

digitalOutput.onDetach = () => {
  updateRawStatePanel({ status: "Device detached" });
  setOutputButtonVisual(false);
};

await digitalOutput.open(5000);
```

So the function now opens *three* channels before it reports `setConnectedUI(true)`. The most important thing to notice here is what's **missing** compared to the other two channels: there's no third callback like `onStateChange` or `onVoltageRatioChange`. Those existed because those channels are *inputs* — something in the physical world changes them, and the library needs a way to tell us "hey, that just happened." A `DigitalOutput` doesn't work that way: nothing changes its state except *us*, by calling a method on it (Step 9). There's no external event to listen for, so there's no change callback to write. `onAttach` and `onDetach` are still here because "did we successfully connect to the device" is still something that happens to us, regardless of direction — and `onAttach` reads `digitalOutput.state` to sync the visual, useful in case the output was already on from a previous session.

## Step 8 — Add cleanup for the digital output channel on disconnect

You already have something like:

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

Add a matching block for the digital output channel, and a call to reset its visual, without touching the existing lines:

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
  if (digitalOutput) {
    try {
      await digitalOutput.close();
    } catch (error) {
      // Channel may already be closed — nothing to do here.
    }
    digitalOutput = null;
  }
  setButtonVisual(false);
  setRatioVisual(null);
  setOutputButtonVisual(false);
  setConnectedUI(false);
  updateRawStatePanel({ status: "Disconnected" });
}
```

Each channel gets its own guarded close block, since any of them could already be closed or never have successfully opened. `setOutputButtonVisual(false)` resets the button to `OFF` on disconnect — and `setConnectedUI(false)` disables it again at the same time, so the page can't be left showing a clickable button with nothing behind it.

## Step 9 — Add a click handler that actually controls the hardware

The submit handler and `disconnectButton` listener at the bottom of the script stay exactly as they are — they don't need any changes. But now we add something genuinely new at the very end: a listener that writes *to* a Phidget channel instead of only reading from one.

Add this after the existing `disconnectButton.addEventListener(...)` line:

```javascript
// Toggle the digital output each time the button is pressed
outputButton.addEventListener("click", async () => {
  if (!digitalOutput) {
    return;
  }

  const nextState = !(digitalOutput.state === true);

  try {
    await digitalOutput.setState(nextState);
    setOutputButtonVisual(nextState);
    updateRawStatePanel({
      status: "State change",
      deviceName: digitalOutput.deviceName,
      serialNumber: digitalOutput.deviceSerialNumber,
      channel: digitalOutput.channel,
      state: nextState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    updateRawStatePanel({ setStateError: String(error) });
  }
});
```

Walking through it:

- **The guard clause.** `if (!digitalOutput) { return; }` protects against a click landing before `digitalOutput` has been created, or after it's been set back to `null` on disconnect. In practice `outputButton.disabled` (Step 5) already prevents clicks in those states, but a disabled button can occasionally still receive a click in edge cases (e.g. a click that started before the button was disabled), so the check inside the handler is the real safety net.
- **`const nextState = !(digitalOutput.state === true);`** flips whatever the output's *current* state is. This reads the channel's own `.state` property — the same property `onAttach` read in Step 7 — rather than tracking a separate "is it on" variable ourselves. That matters: if the button's own tracked idea of the state ever drifted from the hardware's actual state, reading `.state` directly keeps them in sync instead of compounding an error.
- **`await digitalOutput.setState(nextState);`** is the new part conceptually: it's the first time in this series that we call a method that *changes* something on the physical device, rather than only reading a property or registering a callback. Like `connection.connect()` and `digitalOutput.open()`, it's `async` because sending a command to hardware over the network takes time and can fail.
- **We only update the visual and raw state panel *after* `setState` succeeds** (not before it, and not optimistically). If the command fails — the device was unplugged mid-click, say — the `catch` block logs the error instead, and the button's visual stays at whatever it last confirmed, rather than showing "ON" for an output that's actually still off. This is a deliberate choice: it's slightly slower-feeling than updating the display immediately, but it means the page never lies about the hardware's real state.

## Trying it yourself

1. Make sure a Phidget Network Server is running and reachable, with a digital input (a pushbutton), a voltage ratio sensor, and a digital output device (an LED or relay) all connected to their respective hub ports.
2. Open your updated file in a browser.
3. Enter the server's address and port (default `localhost:8989`) and click Connect.
4. Watch the raw state panel for three `"Attached"` messages as each channel comes online. Press the button, move the sensor, and click the output button — all three should keep working independently of each other, and the physical output device should switch on and off along with the on-screen button.

If the on-screen output button changes but the physical device doesn't, double-check the wiring and hub port — `digitalOutput.hubPort = 0` is only correct if your output device is actually plugged into port 0.
