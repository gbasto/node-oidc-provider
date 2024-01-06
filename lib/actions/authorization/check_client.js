"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkClient;
var _validate_presence = _interopRequireDefault(require("../../helpers/validate_presence.js"));
var base64url = _interopRequireWildcard(require("../../helpers/base64url.js"));
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _index = require("../../consts/index.js");
var _errors = require("../../helpers/errors.js");
var _reject_request_and_uri = _interopRequireDefault(require("./reject_request_and_uri.js"));
var _load_pushed_authorization_request = _interopRequireDefault(require("./load_pushed_authorization_request.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/*
 * Checks client_id
 * - value presence in provided params
 * - value being resolved as a client
 *
 * @throws: invalid_request
 * @throws: invalid_client
 */
async function checkClient(ctx, next) {
  const {
    oidc: {
      params
    }
  } = ctx;
  const {
    pushedAuthorizationRequests
  } = (0, _weak_cache.default)(ctx.oidc.provider).configuration('features');
  try {
    (0, _validate_presence.default)(ctx, 'client_id');
  } catch (err) {
    const {
      request_uri: requestUri
    } = params;
    let {
      request
    } = params;
    if (!(pushedAuthorizationRequests.enabled && requestUri && requestUri.startsWith(_index.PUSHED_REQUEST_URN)) && request === undefined) {
      throw err;
    }
    (0, _reject_request_and_uri.default)(ctx, () => {});
    if (requestUri) {
      const loadedRequestObject = await (0, _load_pushed_authorization_request.default)(ctx);
      ({
        request
      } = loadedRequestObject);
    }
    const parts = request.split('.');
    let decoded;
    let clientId;
    try {
      if (parts.length !== 3 && parts.length !== 5) {
        throw new Error();
      }
      parts.forEach((part, i, {
        length
      }) => {
        if (length === 3 && i === 1) {
          // JWT Payload
          decoded = JSON.parse(base64url.decodeToBuffer(part));
        } else if (length === 5 && i === 0) {
          // JWE Header
          decoded = JSON.parse(base64url.decodeToBuffer(part));
        }
      });
    } catch (error) {
      throw new _errors.InvalidRequestObject(`Request Object is not a valid ${parts.length === 5 ? 'JWE' : 'JWT'}`);
    }
    if (decoded) {
      clientId = decoded.iss;
    }
    if (typeof clientId !== 'string' || !clientId) {
      throw err;
    }
    params.client_id = clientId;
  }
  const client = await ctx.oidc.provider.Client.find(ctx.oidc.params.client_id);
  if (!client) {
    // there's no point in checking again in authorization error handler
    ctx.oidc.noclient = true;
    throw new _errors.InvalidClient('client is invalid', 'client not found');
  }
  ctx.oidc.entity('Client', client);
  return next();
}