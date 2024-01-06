"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _apply = _interopRequireDefault(require("./mixins/apply.js"));
var _has_format = _interopRequireDefault(require("./mixins/has_format.js"));
var _has_policies = _interopRequireDefault(require("./mixins/has_policies.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = provider => class RegistrationAccessToken extends (0, _apply.default)([(0, _has_policies.default)(provider), (0, _has_format.default)(provider, 'RegistrationAccessToken', provider.BaseToken)]) {};
exports.default = _default;