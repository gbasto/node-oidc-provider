"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _nodeCrypto = require("node:crypto");
function paddedBuffer(string, length) {
  const buffer = Buffer.alloc(length, undefined, 'utf8');
  buffer.write(string);
  return buffer;
}
function constantEquals(a, b, minComp = 0) {
  if (!Number.isSafeInteger(minComp)) {
    throw new TypeError('minComp must be an Integer');
  }
  if (typeof a !== 'string' || typeof b !== 'string') {
    throw new TypeError('arguments must be strings');
  }
  const length = Math.max(a.length, b.length, minComp);
  return (0, _nodeCrypto.timingSafeEqual)(paddedBuffer(a, length), paddedBuffer(b, length));
}
var _default = exports.default = constantEquals;