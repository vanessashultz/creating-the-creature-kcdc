# Troubleshooting

### No board appears in the dropdown

In order of likelihood:

1. **Try a different USB-C cable.** This fixes it most of the time.
2. **Try a different USB port** on your computer.
3. **Plug directly into the computer,** not through a hub or dongle.

### Windows: shows as "Unknown device" or an unnamed COM port

Open Device Manager (right-click the Start button > Device Manager) and expand **Ports (COM & LPT)**.

If you see a yellow warning triangle, right-click that entry and choose **Update driver > Search automatically for drivers**.

### macOS: nothing appears in the dropdown

Open Terminal and run this with the board plugged in:

```
ls /dev/cu.*
```

If you see something containing `usbmodem`, your Mac can see the board and the IDE just has a stale port list. Quit the IDE completely with **Cmd+Q** (closing the window isn't enough) and reopen it.

If you see no `usbmodem` entry, it's the cable. Swap it.

### Linux: permission denied, or "can't open device /dev/ttyACM0"

You're not in the `dialout` group, or you haven't logged out since adding yourself. Run:

```
groups
```

If `dialout` isn't listed, go back to the [Linux install section](Instructions.md#linux) and log out and back in afterward.

### Linux: nothing appears in the dropdown

Check whether the kernel sees the board at all:

```
ls /dev/ttyACM*
```

If `/dev/ttyACM0` exists, the board is fine and it's a permissions or IDE issue. Restart the IDE.

If nothing is there, run `dmesg | tail -20` right after plugging in. No new USB messages means it's the cable.

If you installed via Snap or Flatpak, that's likely the cause. Switch to the AppImage.

### The board list is empty, or says "No boards found"

The core didn't install. Go back to [step 2 in the installation instructions](Instructions.md#2-install-the-board-core).

### Upload fails with a red error

1. Close the Serial Monitor if it's open, then try again
2. Unplug the board, plug it back in, reselect the port, retry
3. Quit and reopen the IDE

### Upload fails with "Serial port busy" or "Resource busy"

The full error looks something like this:

```
Cannot perform port reset: 1200-bps touch: opening port at 1200bps: Serial port busy
avrdude: ser_open(): can't open device "/dev/cu.usbmodem101": Resource busy
```

The sketch compiled fine. Something on your computer is holding the connection to the board, and the IDE can't get it to send the code over. Only one program can use the port at a time.

Try these in order:

1. **Close the Serial Monitor** if it's open, including in any other window
2. **Unplug the USB cable, wait five seconds, plug it back in**
3. **Quit the IDE completely** (Cmd+Q on Mac, not just closing the window) and reopen it. A stuck process from an earlier failed upload can keep holding the port
4. **Check Tools > Port again.** The port name can change after a replug, from `usbmodem101` to `usbmodem102` for example
5. **Press the reset button** on the Nano once, then upload

If it still won't budge, find out what's holding it.

**macOS or Linux**, in Terminal:

```bash
lsof /dev/cu.usbmodem101
```

Use whatever port name your error message showed. On Linux it'll look like `/dev/ttyACM0`. That prints the program holding the port along with a number in the second column, its PID. Close that program, or:

```bash
kill <PID>
```

Common culprits are a code editor with a serial or PlatformIO extension, a terminal program like CoolTerm or PuTTY, or a forgotten `screen` session. For that last one:

```bash
screen -ls
pkill screen
```

**Windows:** open Task Manager and look for another Arduino IDE, PuTTY, or a serial terminal still running, and end it.

#### If `lsof` comes back empty but the upload still fails

This is the sneaky one, and it looks impossible: nothing is holding the port, but the upload still says it's busy.

The cause is usually **old Arduino IDE sessions that never fully exited**. You see one window, so you assume one IDE, but closing the window doesn't always stop the background helpers. On macOS or Linux, check:

```bash
ps aux | grep -iE "arduino|serial-discovery" | grep -v grep
```

Look at the **timestamps** in that output. If some processes started days ago, or hours before you opened the IDE today, you have leftovers from earlier sessions.

The usual culprit is `serial-discovery`, a helper whose whole job is polling serial ports to detect boards. A stale one grabs and releases the port over and over, which collides with your upload but is easy for a single `lsof` snapshot to miss entirely.

To clear them out:

1. Quit the IDE with **Cmd+Q** (or fully exit on Windows/Linux) and wait for the window to close
2. Then:

```bash
pkill -f "Arduino IDE"
pkill -f arduino-cli
pkill -f serial-discovery
pkill -f mdns-discovery
pkill -f teensy-discovery
```

3. Re-run the `ps aux` command above. It should come back empty
4. Unplug the board, wait ten seconds, plug it back in
5. Launch the IDE fresh, reselect the port, and upload

**Windows:** open Task Manager, sort by name, and end every `Arduino IDE`, `arduino-cli`, and `serial-discovery` process, not just the visible one.

### Something else

Ask us for help and we'll see if we can get you working!
