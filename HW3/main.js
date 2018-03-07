var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var app = express()
// REDIS
var client = redis.createClient(6379, '127.0.0.1', {})
var flagCacheFeature = true;

///////////// WEB ROUTES

// Add hook to make it easier to get all visited URLS.
app.use(function(req, res, next) 
{
  console.log(req.method, req.url);

  client.lpush("recent", req.url);
  client.ltrim("recent", 0, 4);

  next(); // Passing the request to the next handler in the stack.
});


app.get('/test', function(req, res) {
	{
		res.writeHead(200, {'content-type':'text/html'});
		res.write("<h3>test</h3>");
   		res.end();
	}
});

app.get('/get', function(req, res) {
  client.get("key", function(err, value) {
    res.writeHead(200, {'content-type':'text/html'});
    res.write(String(value));
      res.end();
  })
})

app.get('/set', function(req, res) {
  client.set("key", "this message will self-destruct in 10 seconds");
  client.expire("key", 10);
  res.writeHead(200, {'content-type':'text/html'});
  res.write("<h3>Done!</h3>");
    res.end();
})

app.get('/recent', function(req, res) {
  client.lrange("recent", 0, 4, function(err, value) {
    res.writeHead(200, {'content-type':'text/html'});
    res.write(String(value));
      res.end();
  })
})

app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
   console.log(req.body) // form fields
   console.log(req.files) // form files

   if( req.files.image )
   {
     fs.readFile( req.files.image.path, function (err, data) {
        if (err) throw err;
        var img = new Buffer(data).toString('base64');
        client.rpush("img_list", img);
        // console.log(img);
    });
  }

   res.status(204).end()
}]);

app.get('/meow', function(req, res) {
  {
    // if (err) throw err
    res.writeHead(200, {'content-type':'text/html'});

    // items.forEach(function (imagedata) 
    // {
    //   res.write("<h1>\n<img src='data:my_pic.jpg;base64,"+imagedata+"'/>");
    // });
    // res.end();

    client.lpop("img_list", function(err, imagedata) {
      if (err || !imagedata) {
        res.write("<h3>Queue Empty!</h3>");
        res.end();
      } else {
        res.write("<h1>\n<img src='data:my_pic.jpg;base64,"+imagedata+"'/>");
        res.end();
      }
    })
  }
})

app.get('/toggleCacheFeature', function(req, res) {
  flagCacheFeature = !flagCacheFeature;
  res.writeHead(200, {'content-type':'text/html'});
  if (flagCacheFeature) {
    res.write("<h3>Cache Feature Enabled!</h3>");
  } else {
    res.write("<h3>Cache Feature Disabled!</h3>");
  }
  res.end();
});

app.get('/catfact/:num', function(req, res) {
  var start = +new Date();
  var end;
  var delta;

  res.writeHead(200, {'content-type':'text/html'});
  var num = req.params['num'];
  var key = "catfact:"+num;

  if(flagCacheFeature) {
    client.get(key, function(error, value) {
      if (error || !value) {
        get_line("catfacts.txt", num, function(err, line) {
          if (err) {
            res.write(err);  
            end = +new Date();
            delta = end - start;
            res.write("<p> Total Time : " + String(delta) + " milli-seconds </p>");
            res.write("<p> Cache Feature is on! </p>");
            res.end();
          } else {
            client.set(key, line);
            client.expire(key, 10);
            res.write(line);
            end = +new Date();
            delta = end - start;
            res.write("<p> Total Time : " + String(delta) + " milli-seconds </p>");
            res.write("<p> Cache Feature is on! Key ADDED on Redis! </p>");
            res.end();
          }
        });  
      } else {
        res.write(String(value));
        end = +new Date();
        delta = end - start;
        res.write("<p> Total Time : " + String(delta) + " milli-seconds </p>");
        res.write("<p> Cache Feature is on! Key FOUND on Redis! </p>");
        res.end();
      }
    });
  } else {
    get_line("catfacts.txt", num, function(err, line) {
      if (err) {
        res.write(err);  
        end = +new Date();
        delta = end - start;
        res.write("<p> Total Time : " + String(delta) + " milli-seconds </p>");
        res.write("<p> Cache Feature is off! </p>");
        res.end();
      } else {
        res.write(line);
        end = +new Date();
        delta = end - start;
        res.write("<p> Total Time : " + String(delta) + " milli-seconds </p>");
        res.write("<p> Cache Feature is off! </p>");
        res.end();
      }
    });  
  }
});

function get_line(filename, line_no, callback) {
    var data = fs.readFileSync(filename, 'utf8');
    var lines = data.split("\n");

    if(+line_no > lines.length || +line_no < 0){
      // throw new Error('File end reached without finding line');
      callback('File end reached without finding line', null);
      return;
    }

    callback(null, lines[+line_no]);
}


// HTTP SERVER
var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)
})
