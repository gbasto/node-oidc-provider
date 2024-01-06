"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = sessionHandler;
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var ssHandler = _interopRequireWildcard(require("../helpers/samesite_handler.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
async function sessionHandler(ctx, next) {
  ctx.oidc.session = new Proxy(await ctx.oidc.provider.Session.get(ctx), {
    set(obj, prop, value) {
      switch (prop) {
        case 'touched':
          Reflect.defineProperty(obj, 'touched', {
            writable: true,
            value
          });
          break;
        case 'destroyed':
          Reflect.defineProperty(obj, 'destroyed', {
            configurable: false,
            writable: true,
            value
          });
          Reflect.defineProperty(obj, 'touched', {
            configurable: false,
            writable: false,
            value: false
          });
          break;
        case 'accountId':
          if (typeof value !== 'string' || !value) {
            throw new TypeError(`accountId must be a non-empty string, got: ${typeof value}`);
          }
        default:
          // eslint-disable-line no-fallthrough
          Reflect.set(obj, prop, value);
          Reflect.defineProperty(obj, 'touched', {
            writable: true,
            value: true
          });
      }
      return true;
    }
  });
  try {
    await next();
  } finally {
    const sessionCookieName = ctx.oidc.provider.cookieName('session');
    const longRegExp = new RegExp(`^${sessionCookieName}(?:\\.legacy)?(?:\\.sig)?=`);

    // refresh the session duration
    if ((!ctx.oidc.session.new || ctx.oidc.session.touched) && !ctx.oidc.session.destroyed) {
      let ttl = (0, _weak_cache.default)(ctx.oidc.provider).configuration('ttl.Session');
      if (typeof ttl === 'function') {
        ttl = ttl(ctx, ctx.oidc.session);
      }
      ssHandler.set(ctx.oidc.cookies, sessionCookieName, ctx.oidc.session.id, (0, _weak_cache.default)(ctx.oidc.provider).configuration('cookies.long'));
      await ctx.oidc.session.save(ttl);
    }
    if (ctx.response.get('set-cookie')) {
      ctx.response.get('set-cookie').forEach((cookie, index, ary) => {
        /* eslint-disable no-param-reassign */
        if (!cookie.includes('expires=Thu, 01 Jan 1970') && cookie.match(longRegExp) && !ctx.oidc.session.transient && ctx.oidc.session.exp) {
          ary[index] += `; expires=${new Date(ctx.oidc.session.exp * 1000).toUTCString()}`;
        }
        /* eslint-enable */
      });
    }
  }
}