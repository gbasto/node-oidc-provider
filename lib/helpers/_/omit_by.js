"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
/* eslint-disable no-param-reassign */
var _default = (object, predicate) => {
  Object.entries(object).forEach(([key, value]) => {
    if (predicate(value, key)) {
      delete object[key];
    }
  });
  return object;
};
exports.default = _default;