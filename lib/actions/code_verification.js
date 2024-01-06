"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.post = exports.get = void 0;
var crypto = _interopRequireWildcard(require("node:crypto"));
var util = _interopRequireWildcard(require("node:util"));
var _session = _interopRequireDefault(require("../shared/session.js"));
var _assemble_params = _interopRequireDefault(require("../shared/assemble_params.js"));
var _conditional_body = _interopRequireDefault(require("../shared/conditional_body.js"));
var _reject_dupes = _interopRequireDefault(require("../shared/reject_dupes.js"));
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var _errors = require("../helpers/errors.js");
var formHtml = _interopRequireWildcard(require("../helpers/user_code_form.js"));
var _form_post = _interopRequireDefault(require("../response_modes/form_post.js"));
var _user_codes = require("../helpers/user_codes.js");
var _re_render_errors = require("../helpers/re_render_errors.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const parseBody = _conditional_body.default.bind(undefined, 'application/x-www-form-urlencoded');
const randomFill = util.promisify(crypto.randomFill);
const get = exports.get = [_session.default, _assemble_params.default.bind(undefined, new Set(['user_code'])), async function renderCodeVerification(ctx, next) {
  const {
    features: {
      deviceFlow: {
        charset,
        userCodeInputSource
      }
    }
  } = (0, _weak_cache.default)(ctx.oidc.provider).configuration();

  // TODO: generic xsrf middleware to remove this
  let secret = Buffer.allocUnsafe(24);
  await randomFill(secret);
  secret = secret.toString('hex');
  ctx.oidc.session.state = {
    secret
  };
  const action = ctx.oidc.urlFor('code_verification');
  if (ctx.oidc.params.user_code) {
    (0, _form_post.default)(ctx, action, {
      xsrf: secret,
      user_code: ctx.oidc.params.user_code
    });
  } else {
    await userCodeInputSource(ctx, formHtml.input(action, secret, undefined, charset));
  }
  await next();
}];
const post = exports.post = [_session.default, parseBody, _assemble_params.default.bind(undefined, new Set(['xsrf', 'user_code', 'confirm', 'abort'])), _reject_dupes.default.bind(undefined, {}), async function codeVerificationCSRF(ctx, next) {
  if (!ctx.oidc.session.state) {
    throw new _errors.InvalidRequest('could not find device form details');
  }
  if (ctx.oidc.session.state.secret !== ctx.oidc.params.xsrf) {
    throw new _errors.InvalidRequest('xsrf token invalid');
  }
  await next();
}, async function loadDeviceCodeByUserInput(ctx, next) {
  const {
    userCodeConfirmSource,
    mask
  } = (0, _weak_cache.default)(ctx.oidc.provider).configuration('features.deviceFlow');
  const {
    user_code: userCode,
    confirm,
    abort
  } = ctx.oidc.params;
  if (!userCode) {
    throw new _re_render_errors.NoCodeError();
  }
  const normalized = (0, _user_codes.normalize)(userCode);
  const code = await ctx.oidc.provider.DeviceCode.findByUserCode(normalized, {
    ignoreExpiration: true
  });
  if (!code) {
    throw new _re_render_errors.NotFoundError(userCode);
  }
  if (code.isExpired) {
    throw new _re_render_errors.ExpiredError(userCode);
  }
  if (code.error || code.accountId || code.inFlight) {
    throw new _re_render_errors.AlreadyUsedError(userCode);
  }
  ctx.oidc.entity('DeviceCode', code);
  if (abort) {
    Object.assign(code, {
      error: 'access_denied',
      errorDescription: 'End-User aborted interaction'
    });
    await code.save();
    throw new _re_render_errors.AbortedError();
  }
  if (!confirm) {
    const client = await ctx.oidc.provider.Client.find(code.clientId);
    if (!client) {
      throw new _errors.InvalidClient('client is invalid', 'client not found');
    }
    ctx.oidc.entity('Client', client);
    const action = ctx.oidc.urlFor('code_verification');
    await userCodeConfirmSource(ctx, formHtml.confirm(action, ctx.oidc.session.state.secret, userCode), client, code.deviceInfo, (0, _user_codes.denormalize)(normalized, mask));
    return;
  }
  code.inFlight = true;
  await code.save();
  await next();
}, function cleanup(ctx, next) {
  ctx.oidc.session.state = undefined;
  return next();
}];