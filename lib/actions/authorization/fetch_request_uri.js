"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = fetchRequestUri;
var _errors = require("../../helpers/errors.js");
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _index = require("../../consts/index.js");
var _load_pushed_authorization_request = _interopRequireDefault(require("./load_pushed_authorization_request.js"));
var _reject_request_and_uri = _interopRequireDefault(require("./reject_request_and_uri.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const allowedSchemes = new Set(['http:', 'https:', 'urn:']);

/*
 * Validates request_uri length, protocol and its presence in client allow list and either uses
 * previously cached response or loads a fresh state. Removes request_uri form the parameters and
 * uses the response body as a value for the request parameter to be validated by a downstream
 * middleware
 *
 * @throws: invalid_request_uri
 * @throws: request_uri_not_allowed
 */
async function fetchRequestUri(ctx, next) {
  const {
    pushedAuthorizationRequests,
    requestObjects
  } = (0, _weak_cache.default)(ctx.oidc.provider).configuration('features');
  const {
    params
  } = ctx.oidc;
  (0, _reject_request_and_uri.default)(ctx, () => {});
  if (params.request_uri !== undefined) {
    let protocol;
    try {
      ({
        protocol
      } = new URL(params.request_uri));
      if (!allowedSchemes.has(protocol)) throw new Error();
    } catch (err) {
      throw new _errors.InvalidRequestUri('invalid request_uri scheme');
    }
    let loadedRequestObject = ctx.oidc.entities.PushedAuthorizationRequest;
    if (!loadedRequestObject && pushedAuthorizationRequests.enabled && params.request_uri.startsWith(_index.PUSHED_REQUEST_URN)) {
      loadedRequestObject = await (0, _load_pushed_authorization_request.default)(ctx);
    } else if (!loadedRequestObject && !requestObjects.requestUri) {
      throw new _errors.RequestUriNotSupported();
    } else if (!loadedRequestObject && ctx.oidc.client.requestUris) {
      if (!ctx.oidc.client.requestUriAllowed(params.request_uri)) {
        throw new _errors.InvalidRequestUri('provided request_uri is not allowed');
      }
    }
    if (protocol === 'http:') {
      ctx.oidc.insecureRequestUri = true;
    }
    try {
      if (loadedRequestObject) {
        params.request = loadedRequestObject.request;
      } else {
        const cache = (0, _weak_cache.default)(ctx.oidc.provider).requestUriCache;
        params.request = await cache.resolve(params.request_uri);
      }
      if (!params.request) throw new Error();
      params.request_uri = undefined;
    } catch (err) {
      throw new _errors.InvalidRequestUri('could not load or parse request_uri', err.message);
    }
  }
  return next();
}