"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _apply = _interopRequireDefault(require("./mixins/apply.js"));
var _has_format = _interopRequireDefault(require("./mixins/has_format.js"));
var _has_grant_type = _interopRequireDefault(require("./mixins/has_grant_type.js"));
var _has_grant_id = _interopRequireDefault(require("./mixins/has_grant_id.js"));
var _is_sender_constrained = _interopRequireDefault(require("./mixins/is_sender_constrained.js"));
var _is_session_bound = _interopRequireDefault(require("./mixins/is_session_bound.js"));
var _set_audience = _interopRequireDefault(require("./mixins/set_audience.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = provider => class AccessToken extends (0, _apply.default)([_has_grant_type.default, _has_grant_id.default, _is_sender_constrained.default, (0, _is_session_bound.default)(provider), _set_audience.default, (0, _has_format.default)(provider, 'AccessToken', provider.BaseToken)]) {
  static get IN_PAYLOAD() {
    return [...super.IN_PAYLOAD, 'accountId', 'aud', 'claims', 'extra', 'grantId', 'scope', 'sid'];
  }
};
exports.default = _default;