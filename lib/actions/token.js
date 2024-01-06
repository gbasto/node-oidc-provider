"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = tokenAction;
var _validate_presence = _interopRequireDefault(require("../helpers/validate_presence.js"));
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var _errors = require("../helpers/errors.js");
var _no_cache = _interopRequireDefault(require("../shared/no_cache.js"));
var _token_auth = _interopRequireDefault(require("../shared/token_auth.js"));
var _selective_body = require("../shared/selective_body.js");
var _reject_dupes = _interopRequireDefault(require("../shared/reject_dupes.js"));
var _assemble_params = _interopRequireDefault(require("../shared/assemble_params.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const grantTypeSet = new Set(['grant_type']);
function tokenAction(provider) {
  const {
    params: authParams,
    middleware: tokenAuth
  } = (0, _token_auth.default)(provider);
  const {
    grantTypeParams
  } = (0, _weak_cache.default)(provider);
  return [_no_cache.default, _selective_body.urlencoded, _assemble_params.default.bind(undefined, grantTypeParams.get(undefined)), ...tokenAuth, _reject_dupes.default.bind(undefined, {
    only: grantTypeSet
  }), async function stripGrantIrrelevantParams(ctx, next) {
    const grantParams = grantTypeParams.get(ctx.oidc.params.grant_type);
    if (grantParams) {
      Object.keys(ctx.oidc.params).forEach(key => {
        if (!(authParams.has(key) || grantParams.has(key))) {
          delete ctx.oidc.params[key];
        }
      });
    }
    await next();
  }, async function supportedGrantTypeCheck(ctx, next) {
    (0, _validate_presence.default)(ctx, 'grant_type');
    const supported = (0, _weak_cache.default)(provider).configuration('grantTypes');
    if (!supported.has(ctx.oidc.params.grant_type) || ctx.oidc.params.grant_type === 'implicit') {
      throw new _errors.UnsupportedGrantType();
    }
    await next();
  }, async function allowedGrantTypeCheck(ctx, next) {
    if (!ctx.oidc.client.grantTypeAllowed(ctx.oidc.params.grant_type)) {
      throw new _errors.UnauthorizedClient('requested grant type is not allowed for this client');
    }
    await next();
  }, async function rejectDupesOptionalExcept(ctx, next) {
    const {
      grantTypeDupes
    } = (0, _weak_cache.default)(provider);
    const grantType = ctx.oidc.params.grant_type;
    if (grantTypeDupes.has(grantType)) {
      return (0, _reject_dupes.default)({
        except: grantTypeDupes.get(grantType)
      }, ctx, next);
    }
    return (0, _reject_dupes.default)({}, ctx, next);
  }, async function callTokenHandler(ctx, next) {
    const grantType = ctx.oidc.params.grant_type;
    const {
      grantTypeHandlers
    } = (0, _weak_cache.default)(provider);
    await grantTypeHandlers.get(grantType)(ctx, next);
    provider.emit('grant.success', ctx);
  }];
}