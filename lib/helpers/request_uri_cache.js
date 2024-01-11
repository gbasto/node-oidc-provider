"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var crypto = _interopRequireWildcard(require("node:crypto"));
var _nodeHttp = require("node:http");
var _lruCache = require("lru-cache");
var _request = _interopRequireDefault(require("./request.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
class RequestUriCache {
  constructor(provider) {
    this.cache = new _lruCache.LRUCache({
      max: 100
    });
    this.provider = provider;
  }
  async resolve(requestUri) {
    const {
      cache
    } = this;
    const cacheKey = crypto.createHash("sha256").update(requestUri).digest("hex");
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const {
      statusCode,
      body
    } = await _request.default.call(this.provider, {
      method: "GET",
      url: requestUri,
      headers: {
        Accept: "application/oauth-authz-req+jwt, application/jwt"
      }
    });
    if (statusCode !== 200) {
      throw new Error(`unexpected request_uri response status code, expected 200 OK, got ${statusCode} ${_nodeHttp.STATUS_CODES[statusCode]}`);
    }
    cache.set(cacheKey, body);
    return body;
  }
}
var _default = exports.default = RequestUriCache;