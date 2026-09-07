/*
  Debugger for "It Moves"

  Same sweep, but it prints the potentiometer reading and the angle
  so you can see whether the knob is working and what the servo is
  being told to do.

  Open Tools > Serial Monitor and set the speed to 9600.
*/

#include <Servo.h>

Servo myServo;
int potPin = A0;
int pos = 90;
int direction = 1;

const int minAngle = 15;
const int maxAngle = 165;

unsigned long lastPrint = 0;

void setup() {
  Serial.begin(9600);
  myServo.attach(9);

  Serial.println("--- It Moves: debugger ---");
  Serial.println("Turn the knob. potValue should sweep between 0 and 1023.");
  Serial.println();
}

void loop() {
  int potValue = analogRead(potPin);
  float t = potValue / 1023.0;
  int stepDelay = 40 * pow(0.15, t);

  pos += direction;
  if (pos >= maxAngle || pos <= minAngle) {
    direction = -direction;
  }

  myServo.write(pos);

  // Print a few times a second rather than every step,
  // otherwise it scrolls too fast to read
  if (millis() - lastPrint > 250) {
    Serial.print("pot: ");
    Serial.print(potValue);
    Serial.print("\tdelay: ");
    Serial.print(stepDelay);
    Serial.print("ms\tangle: ");
    Serial.print(pos);
    Serial.print("\tsweeping ");
    Serial.println(direction > 0 ? "up" : "down");
    lastPrint = millis();
  }

  delay(stepDelay);

  // pot stuck at one number?
  //   The knob's middle leg is not reaching A0, or an outer leg
  //   is missing power or ground.
  //
  // Numbers look fine but the servo clicks, stutters, or stops?
  //   That is power, not code. The servo's red wire belongs in
  //   row 12, straight into the Nano's 5V pin, not the red rail.
  //
  // Servo buzzes and gets hot while holding still?
  //   Something is physically blocking the horn. Check the horn
  //   screw is not overtightened.
}
