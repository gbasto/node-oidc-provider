"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getClaims;
var _weak_cache = _interopRequireDefault(require("./weak_cache.js"));
var _pick = _interopRequireDefault(require("./_/pick.js"));
var _merge = _interopRequireDefault(require("./_/merge.js"));
var _is_plain_object = _interopRequireDefault(require("./_/is_plain_object.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getClaims(provider) {
  const {
    claims: claimConfig,
    claimsSupported,
    pairwiseIdentifier
  } = (0, _weak_cache.default)(provider).configuration();
  return class Claims {
    constructor(available, {
      ctx,
      client = ctx ? ctx.oidc.client : undefined
    }) {
      if (!(0, _is_plain_object.default)(available)) {
        throw new TypeError('expected claims to be an object, are you sure claims() method resolves with or returns one?');
      }
      if (!(client instanceof provider.Client)) {
        throw new TypeError('second argument must be a Client instance');
      }
      this.available = available;
      this.client = client;
      this.ctx = ctx;
      this.filter = {};
    }
    scope(value = '') {
      if (Object.keys(this.filter).length) {
        throw new Error('scope cannot be assigned after mask has been set');
      }
      value.split(' ').forEach(scope => {
        this.mask(claimConfig[scope]);
      });
      return this;
    }
    mask(value) {
      (0, _merge.default)(this.filter, value);
    }
    rejected(value = []) {
      value.forEach(claim => {
        delete this.filter[claim];
      });
    }
    async result() {
      const {
        available
      } = this;
      const include = Object.entries(this.filter).map(([key, value]) => {
        if (value === null || (0, _is_plain_object.default)(value)) {
          return key;
        }
        return undefined;
      }).filter(key => key && claimsSupported.has(key));
      const claims = (0, _pick.default)(available, ...include);
      if (available._claim_names && available._claim_sources) {
        claims._claim_names = (0, _pick.default)(available._claim_names, ...include);
        claims._claim_sources = (0, _pick.default)(available._claim_sources, ...Object.values(claims._claim_names));
        if (!Object.keys(claims._claim_names).length) {
          delete claims._claim_names;
          delete claims._claim_sources;
        }
      }
      if (this.client.subjectType === 'pairwise' && claims.sub) {
        claims.sub = await pairwiseIdentifier(this.ctx, claims.sub, this.client);
      }
      return claims;
    }
  };
}