#include <DFRobotDFPlayerMini.h>

DFRobotDFPlayerMini player;

const int sensorPin = A0;
const int wakeReading  = 150;   // smaller number = closer
const int resetReading = 220;

bool creatureAwake = false;

// Read the sensor five times and average, so a single
// noisy reading can't set the creature off by accident
int readSensor() {
  long total = 0;
  for (int i = 0; i < 5; i++) {
    total += analogRead(sensorPin);
    delay(10);
  }
  return total / 5;
}

void setup() {
  Serial.begin(9600);    // the USB connection to your computer
  Serial1.begin(9600);   // the D0/D1 pins, where the DFPlayer is wired
  delay(2000);           // give the module time to wake up and read the card

  player.begin(Serial1);
  player.volume(25);     // 0 to 30

  Serial.println("Creature ready.");

  player.playMp3Folder(1);   // say hello as soon as it powers up
  creatureAwake = true;      // it just spoke, so wait for them to back away
}

void loop() {
  int reading = readSensor();
  Serial.println(reading);       // send the number to your computer

  // Wake up when something gets close
  if (reading < wakeReading && !creatureAwake) {
    player.playMp3Folder(1);
    creatureAwake = true;
  }

  // Re-arm only after they back away, so it doesn't
  // retrigger over and over at the boundary
  if (reading > resetReading) {
    creatureAwake = false;
  }

  delay(50);
}
