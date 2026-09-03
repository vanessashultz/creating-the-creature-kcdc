# It Moves

Now that the creature can see, let's give it the ability to move! We'll use a potentiometer (a dial) to control how fast a servo motor sweeps back and forth — turning the knob speeds up or slows down the sweep.

## Step 1: Wiring the Servo and Potentiometer

**Unplug the Nano before changing the breadboard.**

### Components

- One servo motor (in a baggie labeled **"SERVO"**)
- One potentiometer (in a baggie labeled **"POT"**)
- Jumper wires

### Wiring

First, set up the power rails so both the servo and potentiometer can share 5V and GND cleanly:

1. Run a jumper wire from the Nano's **5V** pin to the **red (+) power rail**
2. Run a jumper wire from the Nano's **GND** pin to the **blue (–) ground rail**

Now connect the servo. It has three wires — plug them into rows on the **A–E side** of the breadboard near pin D9:

3. **Signal** (usually orange or white) → the row aligned with **pin D9**
4. **VCC** (usually red) → use a jumper wire from its row to the **red (+) power rail**
5. **GND** (usually brown or black) → use a jumper wire from its row to the **blue (–) ground rail**

Next, place the potentiometer a few rows down on the **A–E side**, with each of its three legs in a separate row:

6. **One outer leg** → use a jumper wire from its row to the **red (+) power rail**
7. **Other outer leg** → use a jumper wire from its row to the **blue (–) ground rail**
8. **Middle leg** (the wiper) → use a jumper wire from its row to **A0** on the Nano

> The two outer legs of the potentiometer can be swapped — it just reverses which direction the knob turns.

### Code changes

7. Open a new sketch: **File > New Sketch**

8. At the very top, include the Servo library and define your variables:

```cpp
#include <Servo.h>

Servo myServo;      // servo object to control the shaft
int potPin = A0;    // potentiometer wiper connected here
int pos = 90;       // current servo angle, starts at center
int direction = 1;  // +1 = sweeping up, -1 = sweeping down
```

`#include <Servo.h>` pulls in Arduino's built-in Servo library, which handles all the timing signals the servo needs. `Servo myServo` creates a servo object we can control. `pos` tracks the current angle, and `direction` controls whether the servo is sweeping up or down.

Notice that `potPin` is set to `A0` — in *It Sees*, we used the same physical pin but called it `14`, its digital pin number. That's because the button only needed **digital** input: on or off, HIGH or LOW. The potentiometer is an **analog** input — it outputs a variable voltage, and `analogRead()` converts that to a value from 0 to 1023, giving us a full range instead of just on/off. When you want to read analog values, use the `A0`–`A7` names. Note that `A0` here refers to the pin labeled **A0 on the Nano itself** — it does not mean the A0 spot on the breadboard.

9. In `setup()`, attach the servo to its pin:

```cpp
void setup() {
  myServo.attach(9); // servo signal wire on pin 9
}
```

10. In `loop()`, read the potentiometer, calculate a speed, and sweep the servo:

```cpp
void loop() {
  int potValue = analogRead(potPin);   // read pot, 0-1023

  // Convert pot reading to a 0.0-1.0 range
  float t = potValue / 1023.0;

  // Exponential curve: at t=0, delay = 40ms (slow sweep)
  // at t=1, delay = 40 * 0.05 = 2ms (fast sweep)
  // This feels more even across the knob's full turn than a linear map
  int stepDelay = 40 * pow(0.05, t);

  // Move one degree in the current direction
  pos += direction;

  // Hit an end stop? Reverse direction so it bounces back
  if (pos >= 180 || pos <= 0) {
    direction = -direction;
  }

  myServo.write(pos);   // send the new angle to the servo
  delay(stepDelay);     // wait before the next step (controls speed)
}
```

Instead of mapping the potentiometer directly to an angle, this code makes the servo sweep back and forth on its own. The potentiometer controls how fast it sweeps — all the way down is a slow sweep, all the way up is very fast. The exponential curve (`pow(0.05, t)`) makes the speed feel more even across the knob's full turn than a simple linear map would.

11. Upload the sketch to the board

The servo should start sweeping back and forth. Turn the potentiometer knob to control the speed!

### Complete code

```cpp
#include <Servo.h>

Servo myServo;      // servo object to control the shaft
int potPin = A0;    // potentiometer wiper connected here
int pos = 90;       // current servo angle, starts at center
int direction = 1;  // +1 = sweeping up, -1 = sweeping down

void setup() {
  myServo.attach(9); // servo signal wire on pin 9
}

void loop() {
  int potValue = analogRead(potPin);   // read pot, 0-1023

  // Convert pot reading to a 0.0-1.0 range
  float t = potValue / 1023.0;

  // Exponential curve: at t=0, delay = 40ms (slow sweep)
  // at t=1, delay = 40 * 0.05 = 2ms (fast sweep)
  // This feels more even across the knob's full turn than a linear map
  int stepDelay = 40 * pow(0.05, t);

  // Move one degree in the current direction
  pos += direction;

  // Hit an end stop? Reverse direction so it bounces back
  if (pos >= 180 || pos <= 0) {
    direction = -direction;
  }

  myServo.write(pos);   // send the new angle to the servo
  delay(stepDelay);     // wait before the next step (controls speed)
}
```
