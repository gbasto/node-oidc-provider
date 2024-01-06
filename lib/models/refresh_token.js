"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _epoch_time = _interopRequireDefault(require("../helpers/epoch_time.js"));
var _apply = _interopRequireDefault(require("./mixins/apply.js"));
var _consumable = _interopRequireDefault(require("./mixins/consumable.js"));
var _has_format = _interopRequireDefault(require("./mixins/has_format.js"));
var _has_grant_id = _interopRequireDefault(require("./mixins/has_grant_id.js"));
var _has_grant_type = _interopRequireDefault(require("./mixins/has_grant_type.js"));
var _is_sender_constrained = _interopRequireDefault(require("./mixins/is_sender_constrained.js"));
var _is_session_bound = _interopRequireDefault(require("./mixins/is_session_bound.js"));
var _stores_auth = _interopRequireDefault(require("./mixins/stores_auth.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = provider => class RefreshToken extends (0, _apply.default)([_consumable.default, _has_grant_type.default, _has_grant_id.default, _is_sender_constrained.default, (0, _is_session_bound.default)(provider), _stores_auth.default, (0, _has_format.default)(provider, 'RefreshToken', provider.BaseToken)]) {
  constructor(...args) {
    super(...args);
    if (!this.iiat) {
      this.iiat = this.iat || (0, _epoch_time.default)();
    }
  }
  static get IN_PAYLOAD() {
    return [...super.IN_PAYLOAD, 'rotations', 'iiat'];
  }

  /*
   * totalLifetime()
   * number of seconds since the very first refresh token chain iat
   */
  totalLifetime() {
    return (0, _epoch_time.default)() - this.iiat;
  }
};
exports.default = _default;