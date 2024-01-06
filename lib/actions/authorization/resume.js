"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = resumeAction;
var url = _interopRequireWildcard(require("node:url"));
var _upper_first = _interopRequireDefault(require("../../helpers/_/upper_first.js"));
var _camel_case = _interopRequireDefault(require("../../helpers/_/camel_case.js"));
var _nanoid = _interopRequireDefault(require("../../helpers/nanoid.js"));
var errors = _interopRequireWildcard(require("../../helpers/errors.js"));
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _params = _interopRequireDefault(require("../../helpers/params.js"));
var _form_post = _interopRequireDefault(require("../../response_modes/form_post.js"));
var ssHandler = _interopRequireWildcard(require("../../helpers/samesite_handler.js"));
var _epoch_time = _interopRequireDefault(require("../../helpers/epoch_time.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
async function resumeAction(allowList, resumeRouteName, ctx, next) {
  const cookieOptions = (0, _weak_cache.default)(ctx.oidc.provider).configuration('cookies.short');
  const cookieId = ssHandler.get(ctx.oidc.cookies, ctx.oidc.provider.cookieName('resume'), cookieOptions);
  if (!cookieId) {
    throw new errors.SessionNotFound('authorization request has expired');
  }
  const interactionSession = await ctx.oidc.provider.Interaction.find(cookieId);
  if (!interactionSession) {
    throw new errors.SessionNotFound('interaction session not found');
  }
  ctx.oidc.entity('Interaction', interactionSession);
  if (cookieId !== interactionSession.uid) {
    throw new errors.SessionNotFound('authorization session and cookie identifier mismatch');
  }
  const {
    result,
    params: storedParams = {},
    trusted = [],
    session: originSession
  } = interactionSession;
  const {
    session
  } = ctx.oidc;
  if (originSession?.uid && originSession.uid !== session.uid) {
    throw new errors.SessionNotFound('interaction session and authentication session mismatch');
  }
  if (result?.login && session.accountId && session.accountId !== result.login.accountId) {
    if (interactionSession.session?.uid) {
      delete interactionSession.session.uid;
      await interactionSession.save(interactionSession.exp - (0, _epoch_time.default)());
    }
    session.state = {
      secret: (0, _nanoid.default)(),
      clientId: storedParams.client_id,
      postLogoutRedirectUri: ctx.oidc.urlFor(ctx.oidc.route, ctx.params)
    };
    (0, _form_post.default)(ctx, ctx.oidc.urlFor('end_session_confirm'), {
      xsrf: session.state.secret,
      logout: 'yes'
    });
    return;
  }
  await interactionSession.destroy();
  const params = new ((0, _params.default)(allowList))(storedParams);
  ctx.oidc.params = params;
  ctx.oidc.trusted = trusted;
  ctx.oidc.redirectUriCheckPerformed = true;
  const clearOpts = {
    ...cookieOptions,
    path: url.parse(ctx.oidc.urlFor(resumeRouteName, {
      uid: interactionSession.uid
    })).pathname
  };
  ssHandler.set(ctx.oidc.cookies, ctx.oidc.provider.cookieName('resume'), null, clearOpts);
  if (result?.error) {
    const className = (0, _upper_first.default)((0, _camel_case.default)(result.error));
    if (errors[className]) {
      throw new errors[className](result.error_description);
    }
    throw new errors.CustomOIDCProviderError(result.error, result.error_description);
  }
  if (result?.login) {
    const {
      remember = true,
      accountId,
      ts: loginTs,
      amr,
      acr
    } = result.login;
    session.loginAccount({
      accountId,
      loginTs,
      amr,
      acr,
      transient: !remember
    });
  }
  ctx.oidc.result = result;
  if (!session.new) {
    session.resetIdentifier();
  }
  await next();
}