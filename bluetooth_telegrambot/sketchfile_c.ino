#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <UniversalTelegramBot.h>
#include <ArduinoJson.h>
#include <BluetoothSerial.h>
#include "DHT.h"

// ------------ DHT Setup ------------
#define DHTPIN 15
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// ------------ Wi-Fi Credentials ------------
const char* ssid = "twogsimp";
const char* password = "ami2G#sImPeR";

// ------------ Telegram Bot Info ------------
#define botToken "8050439108:AAEXlV9xp2qI5HW-oisJUHrsrE5Rv2MvBv0"
#define chatID "1360445792"

// ------------ Telegram Setup ------------
WiFiClientSecure client;
UniversalTelegramBot bot(botToken, client);

// ------------ Bluetooth Setup ------------
BluetoothSerial SerialBT;

// ------------ Timing Settings ------------
unsigned long lastBTTime = 0;
const unsigned long btInterval = 7000;  // Every 7 seconds

unsigned long lastTelegramTime = 0;
const unsigned long telegramInterval = 60000; // Every 60 seconds

bool wifiOn = false;
bool btOn = true;

void setup() {
  Serial.begin(115200);
  dht.begin();

  startBluetooth();  // Start with Bluetooth
}

void loop() {
  unsigned long currentTime = millis();

  // Bluetooth output every 7 sec if Bluetooth is ON
  if (btOn && currentTime - lastBTTime >= btInterval) {
    sendBluetoothData();
    lastBTTime = currentTime;
  }

  // At 58 sec, switch to Wi-Fi (before Telegram send)
  if (currentTime - lastTelegramTime >= telegramInterval - 2000 && btOn) {
    stopBluetooth();
    startWiFi();
  }

  // At 60 sec, send Telegram message
  if (wifiOn && currentTime - lastTelegramTime >= telegramInterval) {
    sendTelegramData();
    lastTelegramTime = currentTime;

    stopWiFi();
    startBluetooth();
  }
}

void sendBluetoothData() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  if (!isnan(temp) && !isnan(hum)) {
    int t = round(temp);
    int h = round(hum);
    String message = "T: " + String(t) + ", H: " + String(h);
    SerialBT.println(message);
    Serial.println("[Bluetooth] " + message);
  } else {
    SerialBT.println("DHT Read Error");
    Serial.println("[Bluetooth] DHT Read Error");
  }
}

void sendTelegramData() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  String message;

  if (!isnan(temp) && !isnan(hum)) {
    int t = round(temp);
    int h = round(hum);
    message = "T: " + String(t) + ", H: " + String(h);
  } else {
    message = "Failed to read from DHT22 sensor.";
  }

  bot.sendMessage(chatID, message, "");
  Serial.println("[Telegram] " + message);
}

void startWiFi() {
  Serial.println("Starting WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  client.setCACert(TELEGRAM_CERTIFICATE_ROOT);

  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 10000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected. IP: " + WiFi.localIP().toString());
    wifiOn = true;
  } else {
    Serial.println("\nWiFi connection failed.");
    wifiOn = false;
  }
}

void stopWiFi() {
  Serial.println("Stopping WiFi...");
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  wifiOn = false;
}

void startBluetooth() {
  Serial.println("Starting Bluetooth...");
  SerialBT.begin("fzESP");
  btOn = true;
}

void stopBluetooth() {
  Serial.println("Stopping Bluetooth...");
  SerialBT.end();
  btOn = false;
}
