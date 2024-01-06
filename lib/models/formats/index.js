"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _opaque = _interopRequireDefault(require("./opaque.js"));
var _jwt = _interopRequireDefault(require("./jwt.js"));
var _dynamic = _interopRequireDefault(require("./dynamic.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = provider => {
  const result = {
    opaque: (0, _opaque.default)(provider) // no dependencies
  };
  result.jwt = (0, _jwt.default)(provider, result); // depends on opaque
  result.dynamic = (0, _dynamic.default)(provider, result); // depends on all

  return result;
};
exports.default = _default;