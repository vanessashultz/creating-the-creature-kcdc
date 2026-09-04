# Prerequisites

Before working through any of these guides, get the following installed and configured. None of it is Phidgets-specific code — it's the plumbing that lets your computer talk to the hardware and lets you comfortably write and run the examples.

## 1. A code editor — VS Code

Any text editor can open a `.html` file, but [Visual Studio Code](https://code.visualstudio.com/) is the recommended editor for these guides. It's free, has great built-in support for HTML/JavaScript, and its integrated terminal makes running the later Node-based examples straightforward.

Download and install it from [code.visualstudio.com](https://code.visualstudio.com/). No extra extensions are required to get started.

## 2. A browser — Chrome

These guides open `.html` files directly in a browser and rely on the browser's developer console for debugging. [Google Chrome](https://www.google.com/chrome/) is recommended — its DevTools (accessed with `F12` or `Ctrl+Shift+I`) are what we'll reference when talking about the console.

Any modern browser will technically run the examples, but if something looks different than what a guide describes, try Chrome before troubleshooting further.

## 3. The Phidget hardware and drivers

Before your computer can see any Phidget device, you need the Phidgets drivers installed. Pick the guide for your OS:

- **Windows**: [Phidgets Downloads for Windows](https://www.phidgets.com/docs/OS_-_Windows)
- **macOS**: [Phidgets Downloads for macOS](https://www.phidgets.com/docs/OS_-_macOS)
- **Linux**: [Phidgets Downloads for Linux](https://www.phidgets.com/docs/OS_-_Linux)

1. Follow your OS's page above and download the latest **Phidget22 installer** (Linux installs via a script instead of a graphical installer — the page walks through it).
2. Run the installer. This installs the low-level drivers your OS needs to recognize a Phidget hub or device when it's plugged in over USB.
3. Plug in your Phidget hub (VINT hub, or similar) and confirm it's recognized — on Windows, check Device Manager for any "unknown device" warnings; on macOS and Linux, the OS-specific page above shows how to verify the device is seen.

## 4. The Phidget Network Server

These guides connect to Phidgets over the network (via `NetworkConnection`) rather than talking to USB directly from the browser. That requires the **Phidget Network Server** to be installed and running on the machine the hardware is plugged into.

### Installing the server

The Phidget Network Server is included as part of the Phidget22 installer from the step above, on all three operating systems.

### Starting the server

**Windows**

1. Open the **Phidget Control Panel** (installed alongside the drivers) from the Start menu.
2. Find the **Network Server** section and make sure it's toggled **on**. It defaults to listening on port `8989`.
3. You should see a Phidget22 icon appear in the Windows system tray, indicating the server is running.

Once running, the server stays active in the background — you don't need to relaunch it every time, only confirm it's still running (check the system tray icon) before starting an example.

**macOS**

1. Open the **Phidget Control Panel** app (installed alongside the drivers).
2. Find the **Network Server** section and toggle it **on**. It defaults to listening on port `8989`.
3. A Phidget22 icon should appear in the menu bar, indicating the server is running.

**Linux**

Linux doesn't have a graphical Control Panel by default — the Network Server runs as a service instead.

1. Follow the [Phidgets Downloads for Linux](https://www.phidgets.com/docs/OS_-_Linux) page to install `phidget22networkserver`.
2. Start (and enable, so it survives reboots) the service:
   ```
   sudo systemctl enable --now phidget22networkserver
   ```
3. Confirm it's running with:
   ```
   sudo systemctl status phidget22networkserver
   ```
   It defaults to listening on port `8989`, same as Windows and macOS.

Once running on any OS, the server stays active in the background — you don't need to relaunch it every time, only confirm it's still running before starting an example.

### Confirming it's working

With the server running and a device plugged in, open the Phidget Control Panel again — it should list your attached device(s) under its own view. If your device shows up there, the examples in this repo will be able to see it too, using `localhost` and port `8989` as the connection address.

## 5. Node.js (only needed for Example 4)

Examples 1 through 3 are single `.html` files — no installation beyond the above is required to run them. [`4_SPA.md`](4_SPA.md) and its framework examples (`4a_Vue`, `4b_React`, `4c_Angular`), however, use build tools that require [Node.js](https://nodejs.org/).

1. Download and install the **LTS** version from [nodejs.org](https://nodejs.org/).
2. Confirm it installed correctly by opening a terminal (VS Code's integrated terminal works fine) and running:
   ```
   node --version
   npm --version
   ```
   Both should print a version number rather than an error.

You won't need to touch Node directly — each framework example's own README will walk you through `npm install` and starting its dev server.

## You're ready

At this point you should have:

- VS Code installed, for editing the example files.
- Chrome installed, for running the examples and reading console output.
- Phidget22 drivers installed, with your hardware recognized by Windows.
- The Phidget Network Server running, listening on `localhost:8989`.
- Node.js installed, if you plan to work through Example 4's framework versions.

From here, move on to [`1_DigitalInput.md`](1_DigitalInput.md).
