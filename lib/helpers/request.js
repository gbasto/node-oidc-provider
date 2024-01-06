"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = request;
var dns = _interopRequireWildcard(require("node:dns"));
var http = _interopRequireWildcard(require("node:http"));
var https = _interopRequireWildcard(require("node:https"));
var _got = _interopRequireDefault(require("got"));
var _pick_by = _interopRequireDefault(require("./_/pick_by.js"));
var _weak_cache = _interopRequireDefault(require("./weak_cache.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
// eslint-disable-line import/no-unresolved

async function request(options) {
  Object.assign(options, {
    url: new URL(options.url),
    headers: options.headers || {},
    https: {
      rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0'
    }
  });
  const {
    signal = AbortSignal.timeout(2500),
    agent = options.url.protocol === 'http:' ? http.globalAgent : https.globalAgent,
    dnsLookup = dns.lookup
  } = (0, _weak_cache.default)(this).configuration('httpOptions')(new URL(options.url));
  const helperOptions = (0, _pick_by.default)({
    signal,
    agent,
    dnsLookup
  }, Boolean);
  if (helperOptions.signal !== undefined && !(helperOptions.signal instanceof AbortSignal)) {
    throw new TypeError('"signal" http request option must be an AbortSignal');
  }
  if (helperOptions.agent !== undefined) {
    helperOptions.agent = {
      [options.url.protocol.slice(0, -1)]: helperOptions.agent
    };
  }
  if (helperOptions.dnsLookup !== undefined && typeof helperOptions.dnsLookup !== 'function') {
    throw new TypeError('"dnsLookup" http request option must be a function');
  }
  if (helperOptions['user-agent'] !== undefined && typeof helperOptions['user-agent'] !== 'string') {
    throw new TypeError('"user-agent" http request option must be a string');
  }

  // eslint-disable-next-line no-param-reassign
  options.headers['user-agent'] = helperOptions['user-agent'];
  return (0, _got.default)({
    ...options,
    followRedirect: false,
    retry: {
      limit: 0
    },
    throwHttpErrors: false,
    ...helperOptions
  });
}