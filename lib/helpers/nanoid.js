"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _nanoid = require("nanoid");
var _default = (length, charset) => {
  if (charset) {
    return (0, _nanoid.customAlphabet)(charset, length)();
  }
  return (0, _nanoid.nanoid)(length);
};
exports.default = _default;