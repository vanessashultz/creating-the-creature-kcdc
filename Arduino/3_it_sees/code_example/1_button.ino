const int BUTTON = 14; // Row 4, left
const int EXTERNAL_LED = 2; // D2

void setup() {
  pinMode(BUTTON, INPUT_PULLUP);
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  bool pressed = digitalRead(BUTTON) == HIGH;

  digitalWrite(LED_BUILTIN, pressed ? HIGH : LOW);
}
