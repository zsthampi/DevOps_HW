var cmd = require('node-cmd');
var http = require('follow-redirects').http;
var sleep = require('system-sleep');

// Function to check the HTML status code for a URL, with the corresponding status for ratings server 
function check_url(url, ratings_server_status) {
	if (ratings_server_status) {
		// Bring up ratings server 
		cmd.get('forever start ratings.js', function(err, data, stderr) {
			sleep(3000);
			check(url);
		});
	} else {
		// Bring down ratings server 
		cmd.get('forever stop ratings.js', function(err, data, stderr) {
			sleep(3000);
			check(url);
		});
	}
}

function check(url) { 
	http.get(url, function(response) {
		// console.log(response.statusCode, response.statusMessage);
		if ([200,500].indexOf(response.statusCode)!=-1) {
			// Status 200, 500 are acceptable HTML statuses
			console.log("PASSED - API endpoint ", url);
		} else {
			// Else, return false 
			console.log("FAILED - API endpoint ", url, " returned unexpected status code");
		}
	}).on('error', function(err) {
		// console.log(err);
		// Return false if there was an error in the request
		console.log("FAILED - API endpoint ", url, " returned unexpected status code");
	});
}

sleep(3000);
check_url("http://localhost:4000/api", true);
sleep(3000);
check_url("http://localhost:4000/api_control", true);
sleep(3000);
check_url("http://localhost:4000/api_exp", true);
// sleep(3000);
// check_url("http://localhost:4000/api", false);
// sleep(3000);
// check_url("http://localhost:4000/api_control", false);
sleep(3000);
check_url("http://localhost:4000/api_exp", false)