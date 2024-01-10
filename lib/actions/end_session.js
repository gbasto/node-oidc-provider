"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.success = exports.init = exports.confirm = void 0;
var crypto = _interopRequireWildcard(require("node:crypto"));
var util = _interopRequireWildcard(require("node:util"));
var _errors = require("../helpers/errors.js");
var JWT = _interopRequireWildcard(require("../helpers/jwt.js"));
var _redirect_uri = _interopRequireDefault(require("../helpers/redirect_uri.js"));
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var _reject_dupes = _interopRequireDefault(require("../shared/reject_dupes.js"));
var _conditional_body = _interopRequireDefault(require("../shared/conditional_body.js"));
var _assemble_params = _interopRequireDefault(require("../shared/assemble_params.js"));
var _session = _interopRequireDefault(require("../shared/session.js"));
var _revoke = _interopRequireDefault(require("../helpers/revoke.js"));
var _no_cache = _interopRequireDefault(require("../shared/no_cache.js"));
var ssHandler = _interopRequireWildcard(require("../helpers/samesite_handler.js"));
var _form_post = _interopRequireDefault(require("../response_modes/form_post.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const parseBody = _conditional_body.default.bind(undefined, "application/x-www-form-urlencoded");
const randomFill = util.promisify(crypto.randomFill);
const init = exports.init = [_no_cache.default, _session.default, parseBody, _assemble_params.default.bind(undefined, new Set(["id_token_hint", "post_logout_redirect_uri", "state", "ui_locales", "client_id", "logout_hint", "xsrf", "logout"])), _reject_dupes.default.bind(undefined, {}), async function endSessionChecks(ctx, next) {
  const {
    params
  } = ctx.oidc;
  let client;
  if (params.id_token_hint) {
    try {
      const idTokenHint = JWT.decode(params.id_token_hint);
      ctx.oidc.entity("IdTokenHint", idTokenHint);
    } catch (err) {
      throw new _errors.InvalidRequest("could not decode id_token_hint", undefined, err.message);
    }
    const {
      payload: {
        aud: clientId
      }
    } = ctx.oidc.entities.IdTokenHint;
    if (params.client_id && params.client_id !== clientId) {
      throw new _errors.InvalidRequest("client_id does not match the provided id_token_hint");
    }
    client = await ctx.oidc.provider.Client.find(clientId);
    if (!client) {
      throw new _errors.InvalidClient("unrecognized id_token_hint audience", "client not found");
    }
    try {
      await ctx.oidc.provider.IdToken.validate(params.id_token_hint, client);
    } catch (err) {
      if (err instanceof _errors.OIDCProviderError) {
        throw err;
      }
      throw new _errors.InvalidRequest("could not validate id_token_hint", undefined, err.message);
    }
    ctx.oidc.entity("Client", client);
  } else if (params.client_id) {
    client = await ctx.oidc.provider.Client.find(params.client_id);
    if (!client) {
      throw new _errors.InvalidClient("client is invalid", "client not found");
    }
    ctx.oidc.entity("Client", client);
  }
  if (client && params.post_logout_redirect_uri !== undefined) {
    if (!client.postLogoutRedirectUriAllowed(params.post_logout_redirect_uri)) {
      throw new _errors.InvalidRequest("post_logout_redirect_uri not registered");
    }
  } else if (params.post_logout_redirect_uri !== undefined) {
    params.post_logout_redirect_uri = undefined;
  }
  await next();
}, async function renderLogout(ctx, next) {
  // TODO: generic xsrf middleware to remove this
  let secret = Buffer.allocUnsafe(24);
  await randomFill(secret);
  secret = secret.toString("hex");
  ctx.oidc.session.state = {
    secret,
    clientId: ctx.oidc.client ? ctx.oidc.client.clientId : undefined,
    state: ctx.oidc.params.state,
    postLogoutRedirectUri: ctx.oidc.params.post_logout_redirect_uri
  };
  ctx.oidc.params.logout = true;
  await next();
}, async function checkLogoutToken(ctx, next) {
  if (!ctx.oidc.session.state) {
    throw new _errors.InvalidRequest("could not find logout details");
  }
  await next();
}, async function endSession(ctx, next) {
  const {
    oidc: {
      session,
      params
    }
  } = ctx;
  const {
    state
  } = session;
  const {
    features: {
      backchannelLogout
    },
    cookies: {
      long: opts
    }
  } = (0, _weak_cache.default)(ctx.oidc.provider).configuration();
  if (backchannelLogout.enabled) {
    const clientIds = Object.keys(session.authorizations || {});
    const back = [];
    for (const clientId of clientIds) {
      if (params.logout || clientId === state.clientId) {
        const client = await ctx.oidc.provider.Client.find(clientId); // eslint-disable-line no-await-in-loop
        if (client) {
          const sid = session.sidFor(client.clientId);
          if (client.backchannelLogoutUri) {
            const {
              accountId
            } = session;
            back.push(client.backchannelLogout(accountId, sid).then(() => {
              ctx.oidc.provider.emit("backchannel.success", ctx, client, accountId, sid);
            }, err => {
              ctx.oidc.provider.emit("backchannel.error", ctx, err, client, accountId, sid);
            }));
          }
        }
      }
    }
    await Promise.all(back);
  }
  if (state.clientId) {
    ctx.oidc.entity("Client", await ctx.oidc.provider.Client.find(state.clientId));
  }
  if (params.logout) {
    if (session.authorizations) {
      await Promise.all(Object.entries(session.authorizations).map(async ([clientId, {
        grantId
      }]) => {
        // Drop the grants without offline_access
        // Note: tokens that don't get dropped due to offline_access having being added
        // later will still not work, as such they will be orphaned until their TTL hits
        if (grantId && !session.authorizationFor(clientId).persistsLogout) {
          await (0, _revoke.default)(ctx, grantId);
        }
      }));
    }
    await session.destroy();
    ssHandler.set(ctx.oidc.cookies, ctx.oidc.provider.cookieName("session"), null, opts);
  } else if (state.clientId) {
    const grantId = session.grantIdFor(state.clientId);
    if (grantId && !session.authorizationFor(state.clientId).persistsLogout) {
      await (0, _revoke.default)(ctx, grantId);
      ctx.oidc.provider.emit("grant.revoked", ctx, grantId);
    }
    session.state = undefined;
    if (session.authorizations) {
      delete session.authorizations[state.clientId];
    }
    session.resetIdentifier();
  }
  const usePostLogoutUri = state.postLogoutRedirectUri;
  const forwardClientId = !usePostLogoutUri && !params.logout && state.clientId;
  const uri = (0, _redirect_uri.default)(usePostLogoutUri ? state.postLogoutRedirectUri : ctx.oidc.urlFor("end_session_success"), {
    ...(usePostLogoutUri && state.state != null ? {
      state: state.state
    } : undefined),
    // != intended
    ...(forwardClientId ? {
      client_id: state.clientId
    } : undefined)
  });
  ctx.oidc.provider.emit("end_session.success", ctx);
  ctx.status = 303;
  ctx.redirect(uri);
  await next();
}];
const confirm = exports.confirm = [];
const success = exports.success = [_no_cache.default, _assemble_params.default.bind(undefined, new Set(["client_id"])), async function postLogoutSuccess(ctx) {
  if (ctx.oidc.params.client_id) {
    const client = await ctx.oidc.provider.Client.find(ctx.oidc.params.client_id);
    if (!client) {
      throw new _errors.InvalidClient("client is invalid", "client not found");
    }
    ctx.oidc.entity("Client", client);
  }
  await (0, _weak_cache.default)(ctx.oidc.provider).configuration("features.rpInitiatedLogout.postLogoutSuccessSource")(ctx);
}];