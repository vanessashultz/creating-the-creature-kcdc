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

### Something else

Ask us for help and we'll see if we can get you working!
