const int BUTTON = 14;       // Row 4, left
const int EXTERNAL_LED = 2;  // D2

void setup() {
  // INPUT means this pin receives a signal.
  // The external 10k pull-down holds it LOW until the button is pressed.
  pinMode(BUTTON, INPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(EXTERNAL_LED, OUTPUT);
}

void loop() {
  // With our pull-down wiring using the resistor, HIGH means pressed.
  bool pressed = digitalRead(BUTTON) == HIGH;

  // Make both LEDs mirror the button state.
  digitalWrite(LED_BUILTIN, pressed ? HIGH : LOW);
  digitalWrite(EXTERNAL_LED, pressed ? HIGH : LOW);
}
