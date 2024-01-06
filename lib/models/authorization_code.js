"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _apply = _interopRequireDefault(require("./mixins/apply.js"));
var _consumable = _interopRequireDefault(require("./mixins/consumable.js"));
var _has_format = _interopRequireDefault(require("./mixins/has_format.js"));
var _has_grant_id = _interopRequireDefault(require("./mixins/has_grant_id.js"));
var _is_session_bound = _interopRequireDefault(require("./mixins/is_session_bound.js"));
var _stores_auth = _interopRequireDefault(require("./mixins/stores_auth.js"));
var _stores_pkce = _interopRequireDefault(require("./mixins/stores_pkce.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = provider => class AuthorizationCode extends (0, _apply.default)([_consumable.default, (0, _is_session_bound.default)(provider), _has_grant_id.default, _stores_auth.default, _stores_pkce.default, (0, _has_format.default)(provider, 'AuthorizationCode', provider.BaseToken)]) {
  static get IN_PAYLOAD() {
    return [...super.IN_PAYLOAD, 'redirectUri', 'dpopJkt'];
  }
};
exports.default = _default;