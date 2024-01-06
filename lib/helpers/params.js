"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getParams;
var _nodeAssert = require("node:assert");
var _omit_by = _interopRequireDefault(require("./_/omit_by.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const cache = new WeakMap();
function getParams(allowList) {
  if (!cache.has(allowList)) {
    (0, _nodeAssert.strict)(allowList, 'allowList must be present');
    const klass = class Params {
      constructor(params) {
        allowList.forEach(prop => {
          this[prop] = params[prop] || undefined;
        });
      }
      toPlainObject() {
        return (0, _omit_by.default)({
          ...this
        }, val => typeof val === 'undefined');
      }
    };
    cache.set(allowList, klass);
  }
  return cache.get(allowList);
}