"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = resolve;
exports.isFrontChannel = isFrontChannel;
function resolve(responseType) {
  return typeof responseType === 'string' && responseType.includes('token') ? 'fragment' : 'query';
}
function isFrontChannel(responseType) {
  return resolve(responseType) === 'fragment';
}