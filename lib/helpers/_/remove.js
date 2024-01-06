"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = (array, predicate) => {
  const remove = [];
  array.forEach((value, index) => {
    if (predicate(value, index, array)) {
      remove.unshift(index);
    }
  });
  remove.forEach(i => array.splice(i, 1));
};
exports.default = _default;