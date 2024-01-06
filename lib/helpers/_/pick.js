"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = (object = {}, ...properties) => {
  const result = {};
  properties.forEach(property => {
    if (Object.prototype.hasOwnProperty.call(object, property)) {
      result[property] = object[property];
    }
  });
  return result;
};
exports.default = _default;