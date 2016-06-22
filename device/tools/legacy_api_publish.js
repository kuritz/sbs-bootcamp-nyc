var SBS_ENDPOINT = "https://8e0z2fmak5.execute-api.us-west-2.amazonaws.com/v1dev/SBS001/"
var API_KEY = "tKlULDNdDs3ASNMr8BUsU5nIPFfOWb503HXzf4aW";

function convert(title) {
    var map = { "Temperature": "temp", "Sound": "sound", "Flow": "flow", "Humidity": "humidity" };
    return map[title];
}

function publish() {
  var _data = {"sensors":{"temp":"","sound":"","flow":""}};
  for (var i = 0; i < data.length; i++) {
    _data.sensors[convert(data[i].type)] = data[i].value;
  }
  board.info("LEGACY", JSON.stringify(_data));
  rest.post(SBS_ENDPOINT+"data", {
    data: JSON.stringify(_data),
    headers: { "Content-Type": "application/json",
               "x-api-key": API_KEY }
    }).on('complete', function(data, response) {
      board.info("BOARD",data);
    });
  }

  exports = module.exports = publish;
