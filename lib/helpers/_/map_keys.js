"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = (object, iteratee) => {
  const result = {};
  Object.entries(object).forEach(([key, value]) => {
    result[iteratee(value, key, object)] = value;
  });
  return result;
};
exports.default = _default;