"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getErrorHandler;
var crypto = _interopRequireWildcard(require("node:crypto"));
var util = _interopRequireWildcard(require("node:util"));
var _debug = _interopRequireDefault(require("debug"));
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var formHtml = _interopRequireWildcard(require("../helpers/user_code_form.js"));
var _re_render_errors = require("../helpers/re_render_errors.js");
var _err_out = _interopRequireDefault(require("../helpers/err_out.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const debug = new _debug.default('oidc-provider:error');
const serverError = new _debug.default('oidc-provider:server_error');
const serverErrorTrace = new _debug.default('oidc-provider:server_error:trace');
const userInputRoutes = new Set(['code_verification', 'device_resume']);
const randomFill = util.promisify(crypto.randomFill);
function getErrorHandler(provider, eventName) {
  return async function errorHandler(ctx, next) {
    const {
      features: {
        deviceFlow: {
          charset,
          userCodeInputSource
        }
      }
    } = (0, _weak_cache.default)(provider).configuration();
    try {
      await next();
    } catch (err) {
      const out = (0, _err_out.default)(err);
      ctx.status = err.statusCode || 500;
      if (err.expose && !(err instanceof _re_render_errors.ReRenderError)) {
        debug('path=%s method=%s error=%o detail=%s', ctx.path, ctx.method, out, err.error_detail);
      } else if (!(err instanceof _re_render_errors.ReRenderError)) {
        serverError('path=%s method=%s error=%o', ctx.path, ctx.method, err);
        serverErrorTrace(err);
      }
      if (ctx.oidc?.session && userInputRoutes.has(ctx.oidc.route)) {
        let secret = Buffer.allocUnsafe(24);
        await randomFill(secret);
        secret = secret.toString('hex');
        ctx.oidc.session.state = {
          secret
        };
        await userCodeInputSource(ctx, formHtml.input(ctx.oidc.urlFor('code_verification'), secret, err.userCode, charset), out, err);
        if (err instanceof _re_render_errors.ReRenderError) {
          // render without emit
          return;
        }
      } else if (ctx.accepts('json', 'html') === 'html') {
        // this ^^ makes */* requests respond with json (curl, xhr, request libraries), while in
        // browser requests end up rendering the html error instead
        const renderError = (0, _weak_cache.default)(provider).configuration('renderError');
        await renderError(ctx, out, err);
      } else {
        ctx.body = out;
      }
      if (out.error === 'server_error') {
        provider.emit('server_error', ctx, err);
      } else if (eventName) {
        provider.emit(eventName, ctx, err);
      }
    }
  };
}