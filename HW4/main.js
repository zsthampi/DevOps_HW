var random = require('random-js')();
var express = require('express');
var http = require('http');
var app = express();

// Port 4000 - Main Script (Gateway and API)
// Port 5000 - Ratings Service 
// Port 5000 /error - No Service (Error 500)

app.get('/gateway', function(req, res) {
	// Generate a random number between 0 and 199 (both inclusive)
	// Redirect to api_control/api_exp with probability 0.5% 
	// Redirect to api with the rest 

	var chance = random.integer(0,199);
	console.log(chance);

	if (chance == 100) {
		res.redirect('/api_control');
	} else if (chance == 101) {
		res.redirect('/api_exp');
	} else {
		res.redirect('/api');
	}

	// if (chance < 25) {
	// 	res.redirect('/api_control');
	// } else if (chance >= 175) {
	// 	res.redirect('/api_exp');
	// } else {
	// 	res.redirect('/api');
	// }
});

app.get('/api', function(req, res) {
	console.log('api');
	res.redirect('http://localhost:5000/ratings');
});

app.get('/api_control', function(req, res) {
	console.log('api_control');
	res.redirect('http://localhost:5000/ratings');
});

app.get('/api_exp', function(req, res) {
	// Intentionally hit a URL which is down
	console.log('api_exp');

	// If the URL is down, respond with status 500 (Internal Server Error)
	// As per use case, we can modify this code to return any status code
	// based on the policy to follow, to handle the error gracefully
	http.get('http://localhost:6000/', function(response) {
		res.redirect('http://localhost:6000/');
	}).on('error', function(err) {
		res.status(500).send('ratings service down');
	});

});

app.listen(4000);