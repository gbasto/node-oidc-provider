"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _set_audience = _interopRequireDefault(require("./mixins/set_audience.js"));
var _has_format = _interopRequireDefault(require("./mixins/has_format.js"));
var _is_sender_constrained = _interopRequireDefault(require("./mixins/is_sender_constrained.js"));
var _apply = _interopRequireDefault(require("./mixins/apply.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = provider => class ClientCredentials extends (0, _apply.default)([_set_audience.default, _is_sender_constrained.default, (0, _has_format.default)(provider, 'ClientCredentials', provider.BaseToken)]) {
  static get IN_PAYLOAD() {
    return [...super.IN_PAYLOAD, 'aud', 'extra', 'scope'];
  }
};
exports.default = _default;