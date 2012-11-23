var sio = require('socket.io');
var fn = function () {};

exports.init = function () {

    var io = sio.listen(app);

    railway.controller.Controller.prototype.socket = function (id) {
        return io.sockets.in(id || this.req.sessionID);
    };

    var map = [];

    railway.routeMapper.socket = function (msg, handle) {
        map.push({
            event: msg,
            controller: handle.split('#')[0],
            action: handle.split('#')[1]
        });
    };

    var cookieParser, session;

    app.stack.forEach(function (m) {
        switch (m.handle.name) {
            case 'cookieParser':
            cookieParser = m.handle;
            break
            case 'session':
            session = m.handle;
            break;
        }
    });


    io.set('authorization', function (req, accept) {
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

        cookieParser(req, null, function (err) {
            if (err) return accept('Error in cookie parser', false);
            session(req, {on: fn, end: fn}, function (err) {
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

        var bridge = new railway.ControllerBridge(app.root);
        map.forEach(function (r) {
            socket.on(r.event, function (data) {
                var ctl = bridge.loadController(r.controller);
                ctl.perform(r.action, {
                    session: hs.session,
                    sessionID: hs.sessionID,
                    params: data
                }, {}, fn);
            });
        });

    });

};

