"use strict";
const objectAssign = require('object-assign');
module.exports = objectAssign(require("./chain"), require("./ecc"), require("./serializer"));
