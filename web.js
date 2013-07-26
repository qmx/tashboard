var express = require('express'),
http = require('http');

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());

app.post('/status', function(req, res) {
    if (req.headers.authorization === process.env.TRAVIS_AUTH_TOKEN) {
        console.log(req.body);
        console.log(JSON.parse(req.body.payload));
        res.send(200);
    } else {
        res.send(403);
    }
});

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
