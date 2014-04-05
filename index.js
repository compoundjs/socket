var sio = require('socket.io');
var fn = function () {};
var ControllerBridge = require('compound/lib/controller-bridge');

exports.init = function (compound) {

    var app = compound.app;
    var io = sio.listen(compound.server);

    compound.controllerExtensions.socket = function (id) {
        return io.sockets.in(id || this.req.sessionID);
    };

    compound.controllerExtensions.socketClients = function (id) {
        return io.sockets.clients(id || this.req.sessionID);
    }

    var map = [];

    compound.map.socket = function(msg, handle) {
        map.push({
            event: msg,
            controller: handle.split('#')[0],
            action: handle.split('#')[1]
        });
    };

    var cookieParser, session;

    app.stack.forEach(function(m) {
        switch (m.handle.name) {
            case 'cookieParser':
            cookieParser = m.handle;
            break;
            case 'session':
            session = m.handle;
            break;
        }
    });

    io.set('authorization', function (req, accept) {
        console.log(req.headers);
        // check if there's a cookie header
        if (!req.headers.cookie) {
            // if there isn't, turn down the connection with a message
            // and leave the function.
            return accept('No cookie transmitted.', false);
        }

        req.on = fn;
        req.removeListener = function () {
            delete req.on;
        };
        req.app = app;

        req.originalUrl = '/';

        cookieParser(req, null, function (err) {
            if (err) return accept('Error in cookie parser', false);
            session(req, {on: fn, end: fn}, function (err) {
                if (err) return accept('Error while reading session', false);
                accept(null, true);
            });
        });
    });

    io.sockets.on('connection', function (socket) {
        console.log(socket.handshake.sessionID);
        var hs = socket.handshake;
        console.log('A socket with userId ' + hs.sessionID + ' connected!');

        socket.on('disconnect', function () {
            console.log('A socket with sessionID ' + hs.sessionID
                + ' disconnected!');
            // clear the socket interval to stop refreshing the session
        });

        var groupId;

        socket.join(hs.sessionID);

        var bridge = new ControllerBridge(compound);
        map.forEach(function (r) {
            socket.on(r.event, function (data, callback) {
                var ctl = bridge.loadController(r.controller);
                delete hs.session.csrfToken;
                ctl.perform(r.action, {
                    method: 'SOCKET',
                    url: r.action,
                    app: app,
                    param: function(key) {
                        return data[key];
                    },
                    header: function() {
                        return null;
                    },
                    session: hs.session,
                    sessionID: hs.sessionID,
                    params: data,
                    socket: socket
                }, { send: callback }, fn);
            });
        });

    });

    // You can configure socket.io at this point.
    compound.emit('socket.io', io);
};

