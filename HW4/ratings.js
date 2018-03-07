var express = require('express');
var app = express();

app.get('/ratings', function(req, res) {
	res.write('rating');
	res.end();
});

// app.get('/error', function(req, res) {
// 	res.status(500).send('ratings service down');
// });

app.listen(5000);