"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.urlencoded = exports.json = exports.default = void 0;
var querystring = _interopRequireWildcard(require("node:querystring"));
var _rawBody = _interopRequireDefault(require("raw-body"));
var attention = _interopRequireWildcard(require("../helpers/attention.js"));
var _errors = require("../helpers/errors.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
let warned;
async function selectiveBody(cty, ctx, next) {
  if (ctx.is(cty)) {
    try {
      let usedFallback;
      const body = await (() => {
        if (ctx.req.readable) {
          return (0, _rawBody.default)(ctx.req, {
            length: ctx.request.length,
            limit: '56kb',
            encoding: ctx.charset
          });
        }
        if (!warned) {
          warned = true;
          /* eslint-disable no-multi-str */
          attention.warn('already parsed request body detected, having upstream middleware parser \
is not recommended, resolving to use req.body or request.body instead');
          /* eslint-enable */
        }
        usedFallback = true;
        return ctx.req.body || ctx.request.body;
      })();
      if (body instanceof Buffer || typeof body === 'string') {
        if (cty === 'application/json') {
          ctx.oidc.body = JSON.parse(body);
        } else {
          ctx.oidc.body = querystring.parse(body.toString());
        }
      } else if (usedFallback && cty === 'application/x-www-form-urlencoded') {
        // get rid of possible upstream parsers that parse querystring with objects, arrays, etc
        ctx.oidc.body = querystring.parse(querystring.stringify(body));
      } else {
        ctx.oidc.body = body;
      }
    } catch (err) {
      throw new _errors.InvalidRequest('failed to parse the request body');
    }
    await next();
  } else if (ctx.get('content-type')) {
    throw new _errors.InvalidRequest(`only ${cty} content-type bodies are supported on ${ctx.method} ${ctx.path}`);
  } else {
    ctx.oidc.body = {};
    await next();
  }
}
var _default = exports.default = selectiveBody;
const json = exports.json = selectiveBody.bind(undefined, 'application/json');
const urlencoded = exports.urlencoded = selectiveBody.bind(undefined, 'application/x-www-form-urlencoded');