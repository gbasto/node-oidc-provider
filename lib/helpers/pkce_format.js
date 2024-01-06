"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _errors = require("./errors.js");
const check = /[^\w.\-~]/;
var _default = (input, param) => {
  if (input.length < 43) {
    throw new _errors.InvalidRequest(`${param} must be a string with a minimum length of 43 characters`);
  }
  if (input.length > 128) {
    throw new _errors.InvalidRequest(`${param} must be a string with a maximum length of 128 characters`);
  }
  if (check.test(input)) {
    throw new _errors.InvalidRequest(`${param} contains invalid characters`);
  }
};
exports.default = _default;