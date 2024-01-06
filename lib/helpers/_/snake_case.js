"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = (str = '') => str.replace(/([A-Z][a-z])/g, x => `_${x}`.toLowerCase()).replace(/^_+/, '');
exports.default = _default;