# Socket.IO bindings for CompoundJS

## Installation

    npm install co-socket --save

then add `co-socket` to `config/autoload.js`

## Usage

### Add routes to `config/routes.js`

    map.socket('some-event', 'controller#action');

When client emit event `some-event`, then `action` action of controller `controller` will gain control.
Data passed to the event will be available as `params` variable.
Calling `send` will call the callback to the current socket.

### `socket()` method is available in any controller
    action('some-action', function () {
        socket().emit('event', {some: 'data'}); // send 'event' to all clients in current session
        socket(anotherSessionID).emit('hello'); // send 'hello' to another user
                                                // identified by anotherSessionID

        var clients = socket().connected;       // list of current session clients
        clients.forEach(function (client) {
            client.join('room');                // all current session clients join a room
        });
    });

Any controller action (both socket and non-socket) can emit some event with any client.

### Responding to the current request
#### Server side:
`app/controllers/some-controller.js`

    action('join', function () {
        send({ foo: 'bar' });
    });
#### Client side:
    socket.emit('join', {}, function (data) {
        console.log(data.foo); // bar
    });

## Inner structure
All socket.io connections automatically join a room named after the compound sessionID.
If you want to communicate with another user you can specify their sessionID as param for the `socket` method.

## License

   MIT
