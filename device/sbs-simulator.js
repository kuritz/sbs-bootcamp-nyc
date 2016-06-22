/**
* SIMPLE BEER SERVICE | DEVICE CODE
Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://aws.amazon.com/apache2.0/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Note: Other license terms may apply to certain, identified software files contained within or
distributed with the accompanying software if such terms are included in the directory containing
the accompanying software. Such other license terms will then apply in lieu of the terms of the
software license above.
*/
var awsIot = require("aws-iot-device-sdk");
var data = [];

try {

var unitID = "sbsdemo"
var device = awsIot.device({
    keyPath: "cert/private.pem.key",
    certPath: "cert/certificate.pem.crt",
    caPath: "cert/root.pem.crt",
    clientId: unitID,
    region: "us-east-1"
});

var topic = "sbs/"+unitID;

var messages = [
  {"line1":"I :heart: beer!","line2":"How about you?"},
  {"line1":"Step right up...","line2":"and grab a beer!"},
  {"line1":"What a beautiful","line2":"day for a beer!"},
  {"line1":"HEY! YOU!","line2":"Want a beer?"}
]

var temp = Math.floor((Math.random() * 8)+14);
var humidity = Math.floor((Math.random() * 20)+40);
var sound = Math.floor((Math.random() * 100)+100);

function generatePayload() {
  var payload = {
    "version": "5",
    "deviceId": unitID,
    "data": data
  }
  data = [];
  console.log("Payload: ", JSON.stringify(payload));
  return JSON.stringify(payload);
}

var delay = 0;
function getRandomFlowCount() {
  delay++;
  if (delay<20 && delay>10) {
    return 10 + Math.floor(Math.random() * 30);
  } else if (delay>20) {
    delay = 0;
  }
  return 0;
}

function getRandomIncrement(val, low, high, increment) {
  var rand = Math.random()*2;
  if (val>high|| rand>1 && !(val<low)) {
    val -= Math.random() * increment;
  } else if (val<low||rand<1) {
    val += Math.random() * increment;
  }
  return Math.floor(val);
}

function populateData(sensor, value) {
  data.push({
    "timestamp":new Date().getTime(),
    "value":value,
    "type":sensor
  })
}

function run(callback) {
  temp = getRandomIncrement(temp, 14, 24, 2);
  humidity = getRandomIncrement(humidity, 40, 70, 5);
  sound = getRandomIncrement(sound, 100, 200, 15);
  populateData('Flow', getRandomFlowCount());
  populateData('Temperature', temp);
  populateData('Humidity', humidity);
  populateData('Sound', sound);
  device.publish(topic, generatePayload());
}

  console.log("Connecting to AWS IoT...");
  device.on("connect", function() {
    console.log("Connected to AWS IoT.");
    setInterval(run, 1000);
    setInterval(function() {
      console.log("Message: ",messages[Math.floor(Math.random()*4)]);
    },10000);
  });

} catch (e) {
  //console.log(e);
  process.exit();
}
