var http = require('http');
var should = require('should');

var cookies = {'connect.sid': 'hello'};

describe('socket', function() {
    var app, compound, io;

    it('should be loaded on application startup', function(done) {
        app = getApp();
        compound = app.compound;
        compound.on('routes', function(map) {
            map.should.have.ownProperty('socket');
            map.socket('hello', 'socket#hello');
        });
        compound.on('socket.io', function(socket) {
            io = socket;
        });
        compound.on('structure', function(s) {
            compound.controllerExtensions.should.have.ownProperty('socket');
            should.exist(io);
            s.controllers.socket = function SocketController() {
                this.__missingAction = function(c) {
                    c.send('haha');
                };
            };

            app.listen(3000, '0.0.0.0', function() {
                done();
            });
        });
    });

    var id;
    it('should handle socket auth request', function(done) {
        request('', 'GET', null, function(data) {
            id = data.split(':')[0];
            done();
        });
    });

    it('should handle socket action request', function(done) {
        request('xhr-polling/' + id, 'GET', null, function() {
            request('xhr-polling/' + id, 'POST', '5:::{"name":"hello"}', function() {
                done();
            });
        });
    });

});

function request(path, method, payload, cb) {
    method = method || 'GET';
    var req = http.request({
        host: '0.0.0.0',
        port: 3000,
        path: '/socket.io/1/' + path,
        method: method,
        headers: {
            host: 'localhost',
            cookie: cookieString(cookies)
        }
    }, function (res) {
        var data = '';
        res.on('data', function(chunk) {
            data += chunk.toString();
        });
        res.on('end', function() {
            cb(data);
        });
    });
    req.on('error', function () {
        console.log(arguments);
    });
    if (method === 'POST') {
        req.write(payload);
    }
    req.end();
}

function cookieString(obj) {
    var s = [];
    Object.keys(obj).forEach(function (val) {
        s.push(val + '=' + obj[val]);
    });
    return s.join('; ');
}
