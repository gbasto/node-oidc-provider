"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _constant_equals = _interopRequireDefault(require("../helpers/constant_equals.js"));
var _apply = _interopRequireDefault(require("./mixins/apply.js"));
var _consumable = _interopRequireDefault(require("./mixins/consumable.js"));
var _has_format = _interopRequireDefault(require("./mixins/has_format.js"));
var _has_grant_id = _interopRequireDefault(require("./mixins/has_grant_id.js"));
var _is_session_bound = _interopRequireDefault(require("./mixins/is_session_bound.js"));
var _stores_auth = _interopRequireDefault(require("./mixins/stores_auth.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = provider => class DeviceCode extends (0, _apply.default)([_consumable.default, _has_grant_id.default, (0, _is_session_bound.default)(provider), _stores_auth.default, (0, _has_format.default)(provider, 'DeviceCode', provider.BaseToken)]) {
  static async findByUserCode(userCode, {
    ignoreExpiration = false
  } = {}) {
    const stored = await this.adapter.findByUserCode(userCode);
    if (!stored) return undefined;
    try {
      const payload = await this.verify(stored, {
        ignoreExpiration
      });
      if (!(0, _constant_equals.default)(userCode, payload.userCode)) {
        return undefined;
      }
      return this.instantiate(payload);
    } catch (err) {
      return undefined;
    }
  }
  static get IN_PAYLOAD() {
    return [...super.IN_PAYLOAD, 'error', 'errorDescription', 'params', 'userCode', 'inFlight', 'deviceInfo'];
  }
};
exports.default = _default;