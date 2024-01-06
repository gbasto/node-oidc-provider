"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _ctx_ref = _interopRequireDefault(require("../ctx_ref.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = (provider, formats) => ({
  generateTokenId(...args) {
    const resolver = (0, _weak_cache.default)(provider).dynamic[this.constructor.name];
    const format = resolver(_ctx_ref.default.get(this), this);
    if (!formats[format] || format === 'dynamic') {
      throw new Error('invalid format resolved');
    }
    this.format = format;
    return formats[format].generateTokenId.apply(this, args);
  },
  async getValueAndPayload(...args) {
    const {
      format
    } = this;
    if (!formats[format] || format === 'dynamic') {
      throw new Error('invalid format resolved');
    }
    return formats[format].getValueAndPayload.apply(this, args);
  }
});
exports.default = _default;