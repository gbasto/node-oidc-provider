"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = cibaLoadAccount;
var _errors = require("../../helpers/errors.js");
var _omit_by = _interopRequireDefault(require("../../helpers/_/omit_by.js"));
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _check_id_token_hint = _interopRequireDefault(require("./check_id_token_hint.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
async function cibaLoadAccount(ctx, next) {
  const mechanisms = (0, _omit_by.default)({
    login_hint_token: ctx.oidc.params.login_hint_token,
    id_token_hint: ctx.oidc.params.id_token_hint,
    login_hint: ctx.oidc.params.login_hint
  }, value => typeof value !== 'string' || !value);
  let mechanism;
  let length;
  let value;
  try {
    ({
      0: [mechanism, value],
      length
    } = Object.entries(mechanisms));
  } catch (err) {}
  if (!length) {
    throw new _errors.InvalidRequest('missing one of required parameters login_hint_token, id_token_hint, or login_hint');
  } else if (length !== 1) {
    throw new _errors.InvalidRequest('only one of required parameters login_hint_token, id_token_hint, or login_hint must be provided');
  }
  const {
    features: {
      ciba
    }
  } = (0, _weak_cache.default)(ctx.oidc.provider).configuration();
  let accountId;
  // eslint-disable-next-line default-case
  switch (mechanism) {
    case 'id_token_hint':
      await (0, _check_id_token_hint.default)(ctx, () => {});
      ({
        payload: {
          sub: accountId
        }
      } = ctx.oidc.entities.IdTokenHint);
      break;
    case 'login_hint_token':
      accountId = await ciba.processLoginHintToken(ctx, value);
      break;
    case 'login_hint':
      accountId = await ciba.processLoginHint(ctx, value);
      break;
  }
  if (!accountId) {
    throw new _errors.UnknownUserId('could not identify end-user');
  }
  const account = await ctx.oidc.provider.Account.findAccount(ctx, accountId);
  if (!account) {
    throw new _errors.UnknownUserId('could not identify end-user');
  }
  ctx.oidc.entity('Account', account);
  await ciba.verifyUserCode(ctx, account, value);
  return next();
}