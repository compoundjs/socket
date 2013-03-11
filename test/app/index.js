var express = require('express');
var Compound = require('compound').Compound;

module.exports = function getAppInstance() {
    var app = express();
    new Compound(app, __dirname);
    return app;
};
