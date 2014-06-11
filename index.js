var sio = require('socket.io');
var fn = function () {};
var ControllerBridge = require('compound/lib/controller-bridge');

exports.init = function (compound) {
    var app = compound.app;
    var io = sio(compound.server);

    compound.controllerExtensions.socket = function (id) {
        return io.to(id || this.req.sessionID);
    };

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

    io.use(function (socket, next) {
        var req = socket.request;

        if (!req.headers.cookie) {
            return next(new Error('No cookie transmitted.'));
        }

        req.originalUrl = '/';

        cookieParser(req, null, function (err) {
            if (err) return next(new Error('Error in cookie parser'));

            session(req, { on: fn, end: fn }, function (err) {
                if (err) return next(new Error('Error while reading session'));

                next();
            });
        });
    });

    io.on('connection', function (socket) {
        var req = socket.request;

        socket.join(req.sessionID);

        var bridge = new ControllerBridge(compound);
        map.forEach(function (r) {
            socket.on(r.event, function (data, callback) {
                var ctl = bridge.loadController(r.controller);
                delete req.session.csrfToken;
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
                    session: req.session,
                    sessionID: req.sessionID,
                    params: data,
                    socket: socket
                }, { send: callback }, fn);
            });
        });
    });

    // You can configure socket.io at this point.
    compound.emit('socket.io', io);
};
