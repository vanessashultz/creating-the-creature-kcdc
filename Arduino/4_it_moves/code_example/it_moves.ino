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
  // at t=1, delay = 40 * 0.095 = ~4ms (fast sweep)
  // This feels more even across the knob's full turn than a linear map
  int stepDelay = 40 * pow(0.095, t);

  // Move one degree in the current direction
  pos += direction;

  // Hit an end stop? Reverse direction so it bounces back
  if (pos >= 180 || pos <= 0) {
    direction = -direction;
  }

  myServo.write(pos);   // send the new angle to the servo
  delay(stepDelay);     // wait before the next step (controls speed)
}
