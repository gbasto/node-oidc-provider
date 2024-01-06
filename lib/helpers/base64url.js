"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decode = decode;
exports.decodeToBuffer = decodeToBuffer;
exports.encode = encode;
exports.encodeBuffer = encodeBuffer;
function encode(input, encoding = 'utf8') {
  return Buffer.from(input, encoding).toString('base64url');
}
function encodeBuffer(buf) {
  return buf.toString('base64url');
}
function decode(input) {
  return Buffer.from(input, 'base64').toString('utf8');
}
function decodeToBuffer(input) {
  return Buffer.from(input, 'base64');
}