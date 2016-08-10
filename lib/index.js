"use strict";
const objectAssign = require('object-assign');
module.exports = objectAssign(require("./chain"), require("./ecc"), require("./serializer"));
/*var chain = require("./chain");
var ecc = require("./ecc");
var serializer = require("./serializer");
module.exports = function (app) {
	app.chain = chain;
	app.ecc = ecc;
	app.serializer = serializer;
};*/