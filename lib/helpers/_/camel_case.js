"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = (str = '') => str.replace(/(_\w)/g, x => x.replace('_', '').toUpperCase());
exports.default = _default;