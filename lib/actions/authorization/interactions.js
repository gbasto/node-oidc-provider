"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = interactions;
var url = _interopRequireWildcard(require("node:url"));
var _upper_first = _interopRequireDefault(require("../../helpers/_/upper_first.js"));
var _camel_case = _interopRequireDefault(require("../../helpers/_/camel_case.js"));
var ssHandler = _interopRequireWildcard(require("../../helpers/samesite_handler.js"));
var errors = _interopRequireWildcard(require("../../helpers/errors.js"));
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _nanoid = _interopRequireDefault(require("../../helpers/nanoid.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/* eslint-disable no-await-in-loop */

async function interactions(resumeRouteName, ctx, next) {
  const {
    oidc
  } = ctx;
  let failedCheck;
  let prompt;
  const {
    policy,
    url: interactionUrl
  } = (0, _weak_cache.default)(oidc.provider).configuration("interactions");
  for (const {
    name,
    checks,
    details: promptDetails
  } of policy) {
    let results = (await Promise.all([...checks].map(async ({
      reason,
      description,
      error,
      details,
      check
    }) => {
      if (await check(ctx)) {
        return {
          [reason]: {
            error,
            description,
            details: await details(ctx)
          }
        };
      }
      return undefined;
    }))).filter(Boolean);
    if (results.length) {
      results = Object.assign({}, ...results);
      prompt = {
        name,
        reasons: Object.keys(results),
        details: Object.assign({}, await promptDetails(ctx), ...Object.values(results).map(r => r.details))
      };
      const [[, {
        error,
        description
      }]] = Object.entries(results);
      failedCheck = {
        error: error || "interaction_required",
        error_description: description || "interaction is required from the end-user"
      };
      break;
    }
  }

  // no interaction requested
  if (!prompt) {
    // check there's an accountId to continue
    if (!oidc.session.accountId) {
      throw new errors.AccessDenied(undefined, "authorization request resolved without requesting interactions but no account id was resolved");
    }

    // check there's something granted to continue
    // if only claims parameter is used then it must be combined with openid scope anyway
    // when no scope parameter was provided and none is injected by the AS policy access is
    // denied rather then issuing a code/token without scopes
    if (!oidc.grant.getOIDCScopeFiltered(oidc.requestParamOIDCScopes) && Object.keys(ctx.oidc.resourceServers).every(resource => !oidc.grant.getResourceScopeFiltered(resource, oidc.requestParamScopes))) {
      throw new errors.AccessDenied(undefined, "authorization request resolved without requesting interactions but no scope was granted");
    }
    oidc.provider.emit("authorization.accepted", ctx);
    await next();
    return;
  }

  // if interaction needed but prompt=none => throw;
  try {
    if (oidc.promptPending("none")) {
      const className = (0, _upper_first.default)((0, _camel_case.default)(failedCheck.error));
      if (errors[className]) {
        throw new errors[className](failedCheck.error_description);
      }
      throw new errors.CustomOIDCProviderError(failedCheck.error, failedCheck.error_description);
    }
  } catch (err) {
    const code = /^(code|device)_/.test(oidc.route) ? 400 : 303;
    err.status = code;
    err.statusCode = code;
    err.expose = true;
    throw err;
  }
  const uid = (0, _nanoid.default)();
  const cookieOptions = (0, _weak_cache.default)(oidc.provider).configuration("cookies.short");
  const returnTo = oidc.urlFor(resumeRouteName, {
    uid
  });
  const interactionSession = new oidc.provider.Interaction(uid, {
    returnTo,
    prompt,
    lastSubmission: oidc.result,
    accountId: oidc.session.accountId,
    params: oidc.params.toPlainObject(),
    trusted: oidc.trusted,
    session: oidc.session,
    grant: oidc.grant,
    cid: oidc.entities.Interaction?.cid || (0, _nanoid.default)(),
    ...(oidc.deviceCode ? {
      deviceCode: oidc.deviceCode.jti
    } : undefined)
  });
  let ttl = (0, _weak_cache.default)(ctx.oidc.provider).configuration("ttl.Interaction");
  if (typeof ttl === "function") {
    ttl = ttl(ctx, interactionSession);
  }
  await interactionSession.save(ttl);
  ctx.oidc.entity("Interaction", interactionSession);
  const destination = await interactionUrl(ctx, interactionSession);
  ssHandler.set(ctx.oidc.cookies, oidc.provider.cookieName("interaction"), uid, {
    path: url.parse(destination).pathname,
    ...cookieOptions,
    maxAge: ttl * 1000
  });
  ssHandler.set(ctx.oidc.cookies, oidc.provider.cookieName("resume"), uid, {
    path: url.parse(returnTo).pathname,
    ...cookieOptions,
    domain: undefined,
    httpOnly: true,
    maxAge: ttl * 1000
  });
  oidc.provider.emit("interaction.started", ctx, prompt);
  ctx.status = 303;
  ctx.redirect(destination);
}