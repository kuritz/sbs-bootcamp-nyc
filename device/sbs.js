/***************************
 * Simple Beer Service v5.0
 * Intel Edison + Johnny-Five + Node.JS
 **************************/

var five = require("johnny-five");
var LCDScreen = require("./components/grove-lcd.js");
var th02 = require("./components/grove-th02.js");
var SoundSensor = require("./components/grove-sound-sensor.js");
var FlowSensor = require("./components/grove-flow-sensor.js");
var awsIot = require("aws-iot-device-sdk");
var Edison = require("edison-io");
var os = require('os');
var rest = require('restler');
var sleep = require('sleep');
var async = require('async');
var ifaces = os.networkInterfaces();
var bus = 6;

var board = new five.Board({
  io: new Edison()
});

var PUBLISH_INTERVAL = 1020;
var ROTATE_MESSAGE_INTERVAL = 10000;

/*****************************
/** UPDATE THESE FIELDS WITH YOUR SBS DATA
/****************************/
var unitID = "SBS005"
var device = awsIot.device({
    keyPath: "cert/private.pem.key",
    certPath: "cert/certificate.pem.crt",
    caPath: "cert/root.pem.crt",
    clientId: unitID,
    region: "us-east-1"
});

var data = [];
var topic = "sbs/"+unitID;
var colors = {
  "green": [ 0, 255, 0 ],
  "red": [ 255, 0, 0 ],
  "orange": [ 150, 150, 0 ],
  "blue": [ 0, 0, 255 ],
}

var messages = [
  {"line1":"I :heart: beer!","line2":"How about you?"},
  {"line1":"Step right up...","line2":"and grab a beer!"},
  {"line1":"What a beautiful","line2":"day for a beer!"},
  {"line1":"HEY! YOU!","line2":"Want a beer?"}
]

var components = {
  "leds": {
    "blue": new five.Led(4),
    "green": new five.Led(2),
    "red": new five.Led(3)
  },
  "lcd": new LCDScreen({
    controller: "JHD1313M1"
  }, messages),
  "sensors": {
    "Sound": new SoundSensor("A0", board),
    "Temperature": new th02.TemperatureSensor(bus),
    "Humidity" : new th02.HumiditySensor(bus),
    "Flow": new FlowSensor(7)
  }
}

function generatePayload() {
  var payload = {
    "version": "5",
    "deviceId": unitID,
    "data": data
  }
  data = [];
  board.info("Payload",JSON.stringify(payload));
  return JSON.stringify(payload);
}

function initReaders() {
  async.forEach(Object.keys(components.sensors), function (key, callback){
    board.info("Init",key+" @ "+components.sensors[key].readInterval+"ms");
    board.loop(components.sensors[key].readInterval, function() {
      var val = components.sensors[key].read();
      if (val>=0) {
        data.push({
          "timestamp":new Date().getTime(),
          "value":val,
          "type":key
        })
      }
    });
    callback();
  }, function(err) {
    board.info("Init","Complete");
  });
}

function startupRoutine() {
  /* Setup the components */
  components.lcd.useChar("heart");
  board.pinMode("A0", five.Pin.INPUT);
  board.info("Board",ifaces);
  components.lcd.printRGB(colors.blue,"SBS 5.0 Starting","IP:"+ifaces.wlan0[0].address);
  sleep.sleep(5);
  components.lcd.printRGB(colors.red,"Connecting...","to AWS IoT");
  board.info("AWS IoT","Connecting to AWS IoT...");
  components.leds.red.blink(100);
  board.info("Board","Blinking Red LED's");

  try {
    device.on("connect", function() {
      board.info("AWS IoT","Connected to AWS IoT!");
      components.leds.red.stop().off();
      components.lcd.printRGB(colors.green,"Connected!","TO AWS IoT");
    });
  } catch (e) {
    board.fail("AWS IoT","Failed to connect.", e);
  }
}

board.on("ready", function() {

  startupRoutine();

  components.sensors.Flow.on("change", function() {
      board.info("Flow",this.flowCount);
      this.incrementFlowCount();
      components.leds.blue.on();
  });

  this.loop(ROTATE_MESSAGE_INTERVAL, function() {
    components.lcd.displayRandomMessage();
  });

  initReaders();

  this.loop(PUBLISH_INTERVAL, function() {
    components.leds.green.on();
    components.leds.blue.off();
    device.publish(topic, generatePayload());
    setTimeout(function() {
      components.leds.green.off();
    }, 100);
  });

});
