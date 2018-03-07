// var http = require('http');
var http = require('follow-redirects').http;

var url = "http://localhost:4000/gateway";

var size = 100;
var statusCode;

for (var i=0; i<size; i++) {
	http.get(url, function(response) {
		statusCode = response.statusCode;
		console.log(statusCode, response.statusMessage);
	}).on('error', function(err) {
		console.log(err);
	});
}

