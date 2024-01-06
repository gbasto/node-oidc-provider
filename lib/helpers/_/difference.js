"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = (array, values) => array.filter(value => values.indexOf(value) === -1);
exports.default = _default;