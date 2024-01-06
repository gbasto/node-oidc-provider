"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function validate(provider, policies) {
  if (!Array.isArray(policies)) {
    throw new TypeError('policies must be an array');
  }
  if (!policies.length) {
    throw new TypeError('policies must not be empty');
  }
  policies.forEach(policy => {
    if (typeof policy !== 'string') {
      throw new TypeError('policies must be strings');
    }
    if (!(0, _weak_cache.default)(provider).configuration(`features.registration.policies.${policy}`)) {
      throw new TypeError(`policy ${policy} not configured`);
    }
  });
}
var _default = provider => superclass => class extends superclass {
  async save() {
    if (typeof this.policies !== 'undefined') validate(provider, this.policies);
    return super.save();
  }
  static async find(...args) {
    const result = await super.find(...args);
    if (result && typeof result.policies !== 'undefined') validate(provider, result.policies);
    return result;
  }
  static get IN_PAYLOAD() {
    return [...super.IN_PAYLOAD, 'policies'];
  }
};
exports.default = _default;