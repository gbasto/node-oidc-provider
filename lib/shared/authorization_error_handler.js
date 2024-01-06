"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _debug = _interopRequireDefault(require("debug"));
var _errors = require("../helpers/errors.js");
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var _err_out = _interopRequireDefault(require("../helpers/err_out.js"));
var _resolve_response_mode = _interopRequireDefault(require("../helpers/resolve_response_mode.js"));
var _one_redirect_uri_clients = _interopRequireDefault(require("../actions/authorization/one_redirect_uri_clients.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const debug = new _debug.default('oidc-provider:authentication:error');
const serverError = new _debug.default('oidc-provider:server_error');
const serverErrorTrace = new _debug.default('oidc-provider:server_error:trace');
var _default = provider => {
  const AD_ACTA_CHECKS = Object.entries({
    redirect_uri: {
      Err: _errors.InvalidRedirectUri,
      method: 'redirectUriAllowed',
      check: 'redirectUriCheckPerformed',
      recovery: _one_redirect_uri_clients.default
    },
    web_message_uri: {
      Err: _errors.WebMessageUriMismatch,
      method: 'webMessageUriAllowed',
      check: 'webMessageUriCheckPerformed',
      flag: 'features.webMessageResponseMode.enabled'
    }
  });
  function getOutAndEmit(ctx, err, state) {
    const out = {
      ...(0, _err_out.default)(err, state),
      iss: ctx.oidc.provider.issuer
    };
    if (err.expose) {
      provider.emit('authorization.error', ctx, err);
      debug('%o', out);
    } else {
      provider.emit('server_error', ctx, err);
      serverError('path=%s method=%s error=%o', ctx.path, ctx.method, err);
      serverErrorTrace(err);
    }
    return out;
  }
  function safe(param) {
    if (param && typeof param === 'string') {
      return param;
    }
    return undefined;
  }
  return async function authorizationErrorHandler(ctx, next) {
    try {
      await next();
    } catch (caught) {
      let err = caught;
      ctx.status = err.statusCode || 500;
      const {
        oidc
      } = ctx;
      const {
        params = (ctx.method === 'POST' ? oidc.body : ctx.query) || {}
      } = oidc;
      if (!oidc.client && safe(params.client_id) && !ctx.oidc.noclient) {
        try {
          oidc.entity('Client', await provider.Client.find(safe(params.client_id)));
        } catch (e) {}
      }
      for (const [param, {
        Err,
        check,
        flag,
        method,
        recovery
      }] of AD_ACTA_CHECKS) {
        if ((!flag || (0, _weak_cache.default)(provider).configuration(flag)) && !(err instanceof Err) && oidc.client && !oidc[check]) {
          if (recovery && !safe(params[param])) {
            recovery(ctx, () => {});
          }
          if (safe(params[param]) && !oidc.client[method](params[param])) {
            getOutAndEmit(ctx, caught, safe(params.state));
            err = new Err();
            ctx.status = err.statusCode;
            break;
          }
        }
      }
      const out = getOutAndEmit(ctx, err, safe(params.state));

      // in case redirect_uri, client or web_message_uri could not be verified no successful
      // response should happen, render instead
      if (!safe(params.client_id) || safe(params.client_id) && !oidc.client || !safe(params.redirect_uri) || !err.allow_redirect) {
        const renderError = (0, _weak_cache.default)(provider).configuration('renderError');
        await renderError(ctx, out, err);
      } else {
        let mode = safe(params.response_mode);
        if (!(0, _weak_cache.default)(provider).responseModes.has(mode)) {
          mode = (0, _resolve_response_mode.default)(safe(params.response_type));
        }
        const handler = (0, _weak_cache.default)(provider).responseModes.get(mode);
        await handler(ctx, safe(params.redirect_uri), out);
      }
    }
  };
};
exports.default = _default;