"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _index = _interopRequireDefault(require("../formats/index.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const DEFAULT = 'opaque';
function AccessTokenFormat(ctx, token) {
  return token.resourceServer?.accessTokenFormat ?? 'opaque';
}
var _default = (provider, type, superclass) => {
  const formats = (0, _index.default)(provider);
  let FORMAT;
  if (type === 'AccessToken' || type === 'ClientCredentials') {
    FORMAT = AccessTokenFormat;
  } else {
    FORMAT = DEFAULT;
  }
  if (FORMAT !== DEFAULT || type === 'base') {
    const dynamic = typeof FORMAT === 'function';
    if (!dynamic) {
      if (!formats[FORMAT]) throw new TypeError(`unsupported format specified (${FORMAT})`);
      if (FORMAT === 'dynamic') throw new TypeError('dynamic format must be configured as a function');
    }
    const {
      generateTokenId,
      getValueAndPayload
    } = formats[dynamic ? 'dynamic' : FORMAT];
    const klass = class extends superclass {};
    klass.prototype.generateTokenId = generateTokenId;
    klass.prototype.getValueAndPayload = getValueAndPayload;
    klass.prototype.constructor.verify = formats.opaque.verify;
    if (dynamic) {
      (0, _weak_cache.default)(provider).dynamic = (0, _weak_cache.default)(provider).dynamic || {};
      (0, _weak_cache.default)(provider).dynamic[type] = FORMAT;
    }
    return klass;
  }
  return superclass;
};
exports.default = _default;