"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = processRequestObject;
var JWT = _interopRequireWildcard(require("../../helpers/jwt.js"));
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _errors = require("../../helpers/errors.js");
var _is_plain_object = _interopRequireDefault(require("../../helpers/_/is_plain_object.js"));
var _check_response_mode = _interopRequireDefault(require("./check_response_mode.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/*
 * Decrypts and validates the content of provided request parameter and replaces the parameters
 * provided via OAuth2.0 authorization request with these
 *
 * @throws: invalid_request_object
 */
async function processRequestObject(PARAM_LIST, rejectDupesMiddleware, ctx, next) {
  const {
    params,
    client,
    route
  } = ctx.oidc;
  const pushedRequestObject = ('PushedAuthorizationRequest' in ctx.oidc.entities);
  if (client.requirePushedAuthorizationRequests && route !== 'pushed_authorization_request' && !pushedRequestObject) {
    throw new _errors.InvalidRequest('Pushed Authorization Request must be used');
  }
  const isBackchannelAuthentication = route === 'backchannel_authentication';
  const conf = (0, _weak_cache.default)(ctx.oidc.provider).configuration();
  const {
    features
  } = conf;
  if (params.request === undefined && (client.requireSignedRequestObject || client.backchannelAuthenticationRequestSigningAlg && isBackchannelAuthentication)) {
    throw new _errors.InvalidRequest('Request Object must be used by this client');
  }
  if (params.request === undefined) {
    return next();
  }
  let trusted = false; // signed or encrypted by client confidential material

  if (features.encryption.enabled && params.request.split('.').length === 5) {
    if (isBackchannelAuthentication) {
      throw new _errors.InvalidRequest('Encrypted Request Objects are not supported by CIBA');
    }
    try {
      const header = JWT.header(params.request);
      if (!conf.requestObjectEncryptionAlgValues.includes(header.alg)) {
        throw new TypeError('unsupported encrypted request alg');
      }
      if (!conf.requestObjectEncryptionEncValues.includes(header.enc)) {
        throw new TypeError('unsupported encrypted request enc');
      }
      let decrypted;
      if (/^(A|dir$)/.test(header.alg)) {
        client.checkClientSecretExpiration('could not decrypt the Request Object - the client secret used for its encryption is expired', 'invalid_request_object');
        decrypted = await JWT.decrypt(params.request, client.symmetricKeyStore);
        trusted = true;
      } else {
        decrypted = await JWT.decrypt(params.request, (0, _weak_cache.default)(ctx.oidc.provider).keystore);
      }
      params.request = decrypted.toString('utf8');
      if (ctx.oidc.body) {
        ctx.oidc.body.request = params.request;
      }
    } catch (err) {
      if (err instanceof _errors.OIDCProviderError) {
        throw err;
      }
      throw new _errors.InvalidRequestObject('could not decrypt request object', err.message);
    }
  }
  let decoded;
  try {
    decoded = JWT.decode(params.request);
  } catch (err) {
    throw new _errors.InvalidRequestObject('could not parse Request Object', err.message);
  }
  const {
    payload,
    header: {
      alg
    }
  } = decoded;
  const request = Object.entries(payload).reduce((acc, [key, value]) => {
    if (PARAM_LIST.has(key)) {
      if (key === 'claims' && (0, _is_plain_object.default)(value)) {
        acc[key] = JSON.stringify(value);
      } else if (Array.isArray(value)) {
        acc[key] = value;
      } else if (typeof value !== 'string') {
        acc[key] = String(value);
      } else {
        acc[key] = value;
      }
    }
    return acc;
  }, {});
  rejectDupesMiddleware({
    oidc: {
      params: request
    }
  }, () => {});
  if (request.state !== undefined) {
    params.state = request.state;
  }
  const isFapi1 = ctx.oidc.isFapi('1.0 Final', '1.0 ID2');
  if (request.response_mode !== undefined || isFapi1) {
    if (request.response_mode !== undefined) {
      params.response_mode = request.response_mode;
    }
    if (request.response_type !== undefined) {
      params.response_type = request.response_type;
    }
    (0, _check_response_mode.default)(ctx, () => {}, isFapi1);
  }
  if (request.request !== undefined || request.request_uri !== undefined) {
    throw new _errors.InvalidRequestObject('Request Object must not contain request or request_uri properties');
  }
  if (params.response_type && request.response_type !== undefined && request.response_type !== params.response_type) {
    throw new _errors.InvalidRequestObject('request response_type must equal the one in request parameters');
  }
  if (params.client_id && request.client_id !== undefined && request.client_id !== params.client_id) {
    throw new _errors.InvalidRequestObject('request client_id must equal the one in request parameters');
  }
  if (route === 'pushed_authorization_request') {
    if (request.client_id !== ctx.oidc.client.clientId) {
      throw new _errors.InvalidRequestObject('request client_id must equal the authenticated client\'s client_id');
    }
  }
  if (request.client_id !== undefined && request.client_id !== client.clientId) {
    throw new _errors.InvalidRequestObject('request client_id mismatch');
  }
  if (!pushedRequestObject && !conf.requestObjectSigningAlgValues.includes(alg)) {
    throw new _errors.InvalidRequestObject('unsupported signed request alg');
  }
  const prop = isBackchannelAuthentication ? 'backchannelAuthenticationRequestSigningAlg' : 'requestObjectSigningAlg';
  if (!pushedRequestObject && client[prop] && alg !== client[prop]) {
    throw new _errors.InvalidRequestObject('the preregistered alg must be used in request or request_uri');
  }
  const opts = {
    issuer: client.clientId,
    audience: ctx.oidc.issuer,
    clockTolerance: conf.clockTolerance,
    ignoreAzp: true
  };
  const fapiProfile = ctx.oidc.isFapi('1.0 Final', '1.0 ID2');
  if (fapiProfile) {
    if (!('exp' in payload)) {
      throw new _errors.InvalidRequestObject("Request Object is missing the 'exp' claim");
    }
    if (fapiProfile === '1.0 Final') {
      if (!('aud' in payload)) {
        throw new _errors.InvalidRequestObject("Request Object is missing the 'aud' claim");
      }
      if (!('nbf' in payload)) {
        throw new _errors.InvalidRequestObject("Request Object is missing the 'nbf' claim");
      }
      const diff = payload.exp - payload.nbf;
      if (Math.sign(diff) !== 1 || diff > 3600) {
        throw new _errors.InvalidRequestObject("Request Object 'exp' claim too far from 'nbf' claim");
      }
    }
  }
  if (isBackchannelAuthentication) {
    for (const claim of ['exp', 'iat', 'nbf', 'jti']) {
      if (!(claim in payload)) {
        throw new _errors.InvalidRequestObject(`Request Object is missing the '${claim}' claim`);
      }
    }
    if (fapiProfile) {
      const diff = payload.exp - payload.nbf;
      if (Math.sign(diff) !== 1 || diff > 3600) {
        throw new _errors.InvalidRequestObject("Request Object 'exp' claim too far from 'nbf' claim");
      }
    }
  }
  try {
    JWT.assertPayload(payload, opts);
  } catch (err) {
    throw new _errors.InvalidRequestObject('Request Object claims are invalid', err.message);
  }
  if (pushedRequestObject) {
    ({
      trusted
    } = pushedRequestObject);
  } else {
    try {
      if (alg.startsWith('HS')) {
        client.checkClientSecretExpiration('could not validate the Request Object - the client secret used for its signature is expired', 'invalid_request_object');
        await JWT.verify(params.request, client.symmetricKeyStore, opts);
      } else {
        await JWT.verify(params.request, client.asymmetricKeyStore, opts);
      }
      trusted = true;
    } catch (err) {
      if (err instanceof _errors.OIDCProviderError) {
        throw err;
      }
      throw new _errors.InvalidRequestObject('could not validate Request Object', err.message);
    }
  }
  if (!pushedRequestObject && payload.jti && payload.exp && payload.iss) {
    const unique = await ctx.oidc.provider.ReplayDetection.unique(payload.iss, payload.jti, payload.exp + conf.clockTolerance);
    if (!unique) {
      throw new _errors.InvalidRequestObject('request object replay detected');
    }
  }
  if (trusted) {
    ctx.oidc.trusted = Object.keys(request);
  } else if (ctx.oidc.insecureRequestUri) {
    throw new _errors.InvalidRequestObject('Request Object from insecure request_uri must be signed and/or symmetrically encrypted');
  }
  params.request = undefined;
  const mode = isBackchannelAuthentication || fapiProfile ? 'strict' : features.requestObjects.mode;
  switch (mode) {
    case 'lax':
      // use all values from OAuth 2.0 unless they're in the Request Object
      Object.assign(params, request);
      break;
    case 'strict':
      Object.keys(params).forEach(key => {
        if (key in request) {
          // use value from Request Object
          params[key] = request[key];
        } else {
          // ignore all OAuth 2.0 parameters outside of Request Object
          params[key] = undefined;
        }
      });
      break;
    default:
  }
  if (pushedRequestObject && ctx.oidc.entities.PushedAuthorizationRequest.dpopJkt) {
    params.dpop_jkt = ctx.oidc.entities.PushedAuthorizationRequest.dpopJkt;
  }
  return next();
}