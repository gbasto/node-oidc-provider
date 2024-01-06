"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isHttpsUri = isHttpsUri;
exports.isWebUri = isWebUri;
function isHttpsUri(uri) {
  try {
    const {
      protocol
    } = new URL(uri);
    return protocol === 'https:';
  } catch (err) {
    return false;
  }
}
function isWebUri(uri) {
  try {
    const {
      protocol
    } = new URL(uri);
    return protocol === 'https:' || protocol === 'http:';
  } catch (err) {
    return false;
  }
}