/*
  Debugger for "It Sees"

  Same button and LED, but it prints what the button pin is actually
  reading so you can tell wiring problems from code problems.

  Open Tools > Serial Monitor and set the speed to 9600.
*/

const int BUTTON = 14;        // Row 4, left
const int EXTERNAL_LED = 2;   // D2

int lastRaw = -1;

void setup() {
  Serial.begin(9600);
  pinMode(BUTTON, INPUT_PULLUP);
  pinMode(LED_BUILTIN, OUTPUT);

  Serial.println("--- It Sees: debugger ---");
  Serial.println("Press and release the button. The raw value should change.");
  Serial.println();
}

void loop() {
  int raw = digitalRead(BUTTON);        // 1 = HIGH, 0 = LOW
  bool pressed = (raw == HIGH);         // what the real sketch treats as pressed

  digitalWrite(LED_BUILTIN, pressed ? HIGH : LOW);

  // Only print when something changes, so the monitor stays readable
  if (raw != lastRaw) {
    Serial.print("pin reads ");
    Serial.print(raw == HIGH ? "HIGH" : "LOW ");
    Serial.print("  ->  sketch thinks: ");
    Serial.println(pressed ? "PRESSED" : "not pressed");
    lastRaw = raw;
  }

  delay(20);

  // Nothing ever prints after the first line?
  //   The pin is not changing. Check the button's wiring.
  //
  // It prints, but PRESSED shows when you are NOT touching it?
  //   The logic is inverted for how yours is wired. Flip the == HIGH
  //   above to == LOW.
  //
  // It prints many lines from one press?
  //   That is switch bounce. See the Debouncing notes.
}
