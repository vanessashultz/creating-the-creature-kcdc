/*
  Debugger for "It Speaks"

  Reports whether the MP3 player answered, and streams the distance
  sensor readings so you can pick your own threshold numbers.

  Open Tools > Serial Monitor and set the speed to 9600.
*/

#include <DFRobotDFPlayerMini.h>

DFRobotDFPlayerMini player;

const int sensorPin = A0;
const int wakeReading  = 150;   // smaller number = closer
const int resetReading = 220;

bool creatureAwake = false;
bool playerOK = false;

int readSensor() {
  long total = 0;
  for (int i = 0; i < 5; i++) {
    total += analogRead(sensorPin);
    delay(10);
  }
  return total / 5;
}

void setup() {
  Serial.begin(9600);
  Serial1.begin(9600);
  delay(2000);

  Serial.println("--- It Speaks: debugger ---");

  Serial.print("Talking to the MP3 player... ");
  playerOK = player.begin(Serial1);

  if (playerOK) {
    Serial.println("it answered.");
    player.volume(25);
    player.playMp3Folder(1);
    creatureAwake = true;
    Serial.println("Sent a play command. Watch for the blue light.");
  } else {
    Serial.println("no answer.");
    Serial.println("Check: are D0 and D1 swapped? Is the card seated?");
    Serial.println("Still reading the sensor below so you can test that part.");
  }

  Serial.println();
  Serial.println("Wave your hand at the sensor. Numbers should DROP as you get closer.");
  Serial.println();
}

void loop() {
  int reading = readSensor();

  Serial.print("distance reading: ");
  Serial.print(reading);
  Serial.print("\tcreature is ");
  Serial.print(creatureAwake ? "AWAKE " : "asleep");

  if (reading < wakeReading && !creatureAwake) {
    Serial.print("\t<-- close enough, playing!");
    if (playerOK) player.playMp3Folder(1);
    creatureAwake = true;
  }
  if (reading > resetReading) {
    creatureAwake = false;
  }

  Serial.println();
  delay(200);

  // Numbers never change?
  //   The sensor's signal wire is not reaching the Nano, or the
  //   sensor is not powered.
  //
  // Numbers change but it never says "playing"?
  //   Your thresholds do not match your numbers. Watch the readings
  //   and set wakeReading to something you actually see.
  //
  // It says AWAKE forever?
  //   resetReading is too high. Raise it above your resting number.
}
