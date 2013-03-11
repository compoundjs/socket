var express = require('express');

module.exports = getAppInstance() {
    var app = express();
    new Compound(app, __dirname);
    return app;
};
