/*
  Debugger for "It Has a Pulse"

  Same blink, but it also reports to the Serial Monitor so you can see
  the board is alive and running your code.

  Open Tools > Serial Monitor and set the speed to 9600.
*/

int blinkCount = 0;

void setup() {
  Serial.begin(9600);
  pinMode(LED_BUILTIN, OUTPUT);

  Serial.println("--- It Has a Pulse: debugger ---");
  Serial.println("If you can read this, the board is running your code.");
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  Serial.print("LED ON   blink #");
  Serial.print(blinkCount);
  Serial.print("   running for ");
  Serial.print(millis() / 1000);
  Serial.println(" seconds");
  delay(1000);

  digitalWrite(LED_BUILTIN, LOW);
  Serial.println("LED OFF");
  delay(1000);

  blinkCount++;

  // If the blink count ever jumps back to 0, the board restarted.
  // That usually means it lost power for a moment.
}
