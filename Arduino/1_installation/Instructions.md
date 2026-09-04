# Workshop Setup: Arduino Nano Every

Please complete this **before** the workshop. It takes about 15 minutes, most of which is downloading.

If you get stuck, skip to [Troubleshooting](#troubleshooting) at the bottom, or reach out ahead of time so we can sort it out before the session starts.

## What you need

- A computer running Windows, macOS, or Linux
- The Arduino Nano Every board
- The a microUSB cable and any adapters needed to connect to your laptop

## 1. Install and Open the Arduino IDE

If you haven't already, download **Arduino IDE 2.x** from [arduino.cc/en/software](https://www.arduino.cc/en/software).

Get the 2.x version, not Legacy 1.8.x.

### Windows

Run the `.exe` installer and accept the defaults. If Windows prompts you to approve driver installation, say yes.

### macOS

Open the `.dmg` and drag **Arduino IDE** into your Applications folder. Launch it from Applications, not from the mounted disk image.

On first launch macOS may warn that the app can't be verified. Go to **System Settings > Privacy & Security**, scroll down, and click **Open Anyway**.

### Linux

Download the **AppImage** from the Arduino site. Then make it executable and run it:

```
chmod +x arduino-ide_*.AppImage
./arduino-ide_*.AppImage
```

> Avoid the Snap and Flatpak builds. They're sandboxed and often can't reach the serial port, which produces confusing failures later. The AppImage is the reliable option.

**You also need serial port access.** Run this once:

```
sudo usermod -a -G dialout $USER
```

Then **log out and log back in**. A new terminal window is not enough, the group change only applies to a fresh login session. Skipping this is the most common Linux problem, and it shows up as a permission error at upload time rather than anything obvious now.

Verify it worked:

```
groups
```

You should see `dialout` in the list.

## 2. Install the board core

This is the step people skip. Nothing works without it.

1. Open the Arduino IDE
2. Click the **circuit board icon** (second icon down in the left sidebar), or go to **Tools > Board > Boards Manager**
    ![alt text](images/board_manager.png)

3. Search for `megaAVR`. Find **Arduino megaAVR Boards** and click **Install**
    ![alt text](images/megaAVR_install.png)

4. Wait for it to finish. It's a few hundred MB and can take several minutes.

> You do **not** need "Arduino AVR Boards." That's a different core for a different board.

## 3. Connect the Board to Laptop
Connect the microUSB cable to your laptop. You may need to "allow" this accessory to be connected.

**Must be a data transfer cable.** Many cables are charge-only and carry no data. They look identical to good ones. If you're having issues with your laptop recognizing the board, this is the most likely reason.

You should see a green power LED come on. Other orange LED lights (solid or blinking) are also normal.
![alt text](images/blinking_green_light.png)

You may also see a popup that requests that you "allow this accessory". Select "allow".
![alt text](<Screenshot 2026-09-04 at 1.22.03 PM.png>)

---

## 4. Select the board

Open the dropdown at the top of the IDE window (it says "Select Board").

You should see **Arduino Nano Every** listed with a port beside it:

| Platform | Port looks like |
|---|---|
| Windows | `COM3`, `COM7`, etc. |
| macOS | `/dev/cu.usbmodem101` |
| Linux | `/dev/ttyACM0` |

Click it.

*If the IDE offers to install the megaAVR core (should have installed before), click **Yes**.*
![alt text](images/megaAVR_prompt.png)

That's it. The IDE is ready!

## 5. Setting up Ground Rail

> If you are attending the KCDC workhop, this has already been done for you.

Multiple components need to share a common ground connection. The blue rails on each side of the breadboard are designed for this as they run the full length of the board so anything can tap into them.

> Note: the left and right rails are usually **not connected to each other**. If you have components on both sides, each side needs its own ground jumper. This workshop will have inputs on the left and outputs on the right, so we will need to do this for both sides.

1. Plug one of a male-to-male jumper wire into into **row 14** on the breadboard (Notice that the connecting "row" on the Arduino Nano has a white circle around it that helps identify your ground)

2. Plug the other end into any pin on the **left blue rail** (I would suggest you choose pins at the bottom of the breadboard in order to have enough space for our connections up top)

3. Repeat with a second jumper: one end into row 14 (or any row already connected to it), the other end into any pin on the **right blue rail**

> Each blue rail is a ground rail. Once connected, any component near that rail can tap into it instead of running its own wire all the way back to the Arduino.

## 6. Setting up Power Rail

> If you are attending the KCDC workhop, this has already been done for you.

Just like ground, components need to share a power connection. The red rail on the side of the breadboard works the same way as the blue rail, but for power.

1. Plug one end of a male-to-male jumper wire into **row 12** on the breadboard (12a, 12b, or 12c). *Remember that the entire row of **row 12** is connected to the 5V pin.*

2. Plug the other end of the jumper wire into any pin on the **red rail** (the long strip running alongside the blue rail)

---

> Having issues? See the [Troubleshooting guide](Troubleshooting.md).
