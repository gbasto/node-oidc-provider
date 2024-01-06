"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var _has_format = _interopRequireDefault(require("./mixins/has_format.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = provider => class PushedAuthorizationRequest extends (0, _has_format.default)(provider, 'PushedAuthorizationRequest', (0, _weak_cache.default)(provider).BaseModel) {
  static get IN_PAYLOAD() {
    return [...super.IN_PAYLOAD, 'request', 'dpopJkt', 'trusted'];
  }
};
exports.default = _default;