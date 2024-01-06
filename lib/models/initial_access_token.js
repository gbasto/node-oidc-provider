"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _apply = _interopRequireDefault(require("./mixins/apply.js"));
var _has_format = _interopRequireDefault(require("./mixins/has_format.js"));
var _has_policies = _interopRequireDefault(require("./mixins/has_policies.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = provider => class InitialAccessToken extends (0, _apply.default)([(0, _has_policies.default)(provider), (0, _has_format.default)(provider, 'InitialAccessToken', provider.BaseToken)]) {
  static get IN_PAYLOAD() {
    return super.IN_PAYLOAD.filter(v => v !== 'clientId');
  }
};
exports.default = _default;