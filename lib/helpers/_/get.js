"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = (object, path, defaultValue) => {
  const properties = path.split('.');
  let current = object;
  let result;
  try {
    properties.forEach((property, i) => {
      if (i + 1 === properties.length) {
        result = current[property];
      }
      current = current[property];
    });
  } catch (err) {
    result = undefined;
  }
  if (typeof result === 'undefined' && typeof defaultValue !== 'undefined') {
    return defaultValue;
  }
  return result;
};
exports.default = _default;