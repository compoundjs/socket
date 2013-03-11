var express = require('express');

if (!process.env.TRAVIS) {
    if (typeof __cov === 'undefined') {
        process.on('exit', function () {
            require('semicov').report();
        });
    }

    require('semicov').init('index.js');
}

global.getApp = function() {
    var app = require('./app')();
    app.configure(function() {
        app.use(express.cookieParser());
        app.use(express.session({secret: 'ptss'}));
    });
    return app;
};
