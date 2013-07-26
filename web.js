var express = require('express'),
redis = require('redis'),
cors = require('cors'),
async = require('async'),
http = require('http');

if (process.env.REDIS_URL) {
    var redisURL = require('url').parse(process.env.REDIS_URL);
    var client = redis.createClient(redisURL.port, redisURL.hostname);
    client.auth(redisURL.auth.split(":")[1]);
} else {
    var client = redis.createClient();
}

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(cors());

app.post('/builds', function(req, res) {
    if (req.headers.authorization === process.env.TRAVIS_AUTH_TOKEN) {
        var payload = JSON.parse(req.body.payload);
        var repo = payload.repository.owner_name + '/' + payload.repository.name;
        var key = 'tashboard:builds:' + repo;
        var url = payload.build_url;
        var branch = payload.branch;
        var statusMessage = payload.status_message;
        var finishedAt = payload.finished_at;
        var status = payload.status;
        client.hmset(key, {repo:repo, branch:branch, url:url, status:status, statusMessage:statusMessage, finishedAt:finishedAt}, function (err, reply) {
            if(!err) {
                res.send(200);
            } else {
                res.send(500);
            }
        });
    } else {
        res.send(403);
    }
});

app.get('/builds', function(req, res) {
    function cb(err, reply) {
        if(!err) {
            res.json(reply);
        } else {
            res.send(500);
        }
    }
    client.keys('tashboard:builds:*', function(err, keys) {
        async.reduce(keys, {repositories:[]}, function(memo, item, callback) {
            client.hgetall(item, function(err, reply) {
                memo.repositories.push(reply);
                callback(null, memo);
            });
        }, cb);
    });
});

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
