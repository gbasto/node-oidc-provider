"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = tokenAuth;
var _errors = require("../helpers/errors.js");
var _set_www_authenticate = _interopRequireDefault(require("../helpers/set_www_authenticate.js"));
var JWT = _interopRequireWildcard(require("../helpers/jwt.js"));
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var _certificate_thumbprint = _interopRequireDefault(require("../helpers/certificate_thumbprint.js"));
var _client_attributes = require("../consts/client_attributes.js");
var _reject_dupes = _interopRequireDefault(require("./reject_dupes.js"));
var _token_jwt_auth = _interopRequireDefault(require("./token_jwt_auth.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const assertionType = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';

// see https://tools.ietf.org/html/rfc6749#appendix-B
function decodeAuthToken(token) {
  // TODO: in v9.x consider enabling stricter encoding check
  // if (token.match(/[^a-zA-Z0-9%+]/)) {
  //   throw new Error();
  // }
  const authToken = decodeURIComponent(token.replace(/\+/g, '%20'));
  if (_client_attributes.noVSCHAR.test(authToken)) {
    throw new Error('invalid character found');
  }
  return authToken;
}
function tokenAuth(provider) {
  const tokenJwtAuth = (0, _token_jwt_auth.default)(provider);
  const authParams = new Set(['client_id']);
  (0, _weak_cache.default)(provider).configuration('clientAuthMethods').forEach(method => {
    switch (method) {
      case 'client_secret_post':
        authParams.add('client_secret');
        break;
      case 'client_secret_jwt':
      case 'private_key_jwt':
        authParams.add('client_assertion');
        authParams.add('client_assertion_type');
        break;
      default:
    }
  });
  authParams.forEach(Set.prototype.add.bind((0, _weak_cache.default)(provider).grantTypeParams.get(undefined)));
  return {
    params: authParams,
    middleware: [_reject_dupes.default.bind(undefined, {
      only: authParams
    }), async function setWWWAuthenticateHeader(ctx, next) {
      try {
        await next();
      } catch (err) {
        if (err.statusCode === 401 && ctx.header.authorization !== undefined) {
          (0, _set_www_authenticate.default)(ctx, 'Basic', {
            realm: provider.issuer,
            error: err.message,
            error_description: err.error_description
          });
        }
        throw err;
      }
    }, async function findClientId(ctx, next) {
      const {
        params: {
          client_id: clientId,
          client_assertion: clientAssertion,
          client_assertion_type: clientAssertionType,
          client_secret: clientSecret
        }
      } = ctx.oidc;
      if (ctx.headers.authorization !== undefined) {
        const parts = ctx.headers.authorization.split(' ');
        if (parts.length !== 2 || parts[0].toLowerCase() !== 'basic') {
          throw new _errors.InvalidRequest('invalid authorization header value format');
        }
        const basic = Buffer.from(parts[1], 'base64').toString('utf8');
        const i = basic.indexOf(':');
        if (i === -1) {
          throw new _errors.InvalidRequest('invalid authorization header value format');
        }
        try {
          ctx.oidc.authorization.clientId = decodeAuthToken(basic.slice(0, i));
          ctx.oidc.authorization.clientSecret = decodeAuthToken(basic.slice(i + 1));
        } catch (err) {
          throw new _errors.InvalidRequest('client_id and client_secret in the authorization header are not properly encoded');
        }
        if (clientId !== undefined && ctx.oidc.authorization.clientId !== clientId) {
          throw new _errors.InvalidRequest('mismatch in body and authorization client ids');
        }
        if (!ctx.oidc.authorization.clientSecret) {
          throw new _errors.InvalidRequest('client_secret must be provided in the Authorization header');
        }
        if (clientSecret !== undefined) {
          throw new _errors.InvalidRequest('client authentication must only be provided using one mechanism');
        }
        ctx.oidc.authorization.methods = ['client_secret_basic', 'client_secret_post'];
      } else if (clientId !== undefined) {
        ctx.oidc.authorization.clientId = clientId;
        ctx.oidc.authorization.methods = clientSecret ? ['client_secret_basic', 'client_secret_post'] : ['none', 'tls_client_auth', 'self_signed_tls_client_auth'];
      }
      if (clientAssertion !== undefined) {
        if (clientSecret !== undefined || ctx.headers.authorization !== undefined) {
          throw new _errors.InvalidRequest('client authentication must only be provided using one mechanism');
        }
        let sub;
        try {
          ({
            payload: {
              sub
            }
          } = JWT.decode(clientAssertion));
        } catch (err) {
          throw new _errors.InvalidRequest('invalid client_assertion format');
        }
        if (!sub) {
          throw new _errors.InvalidClientAuth('sub (JWT subject) must be provided in the client_assertion JWT');
        }
        if (clientId && sub !== clientId) {
          throw new _errors.InvalidRequest('subject of client_assertion must be the same as client_id provided in the body');
        }
        if (clientAssertionType === undefined) {
          throw new _errors.InvalidRequest('client_assertion_type must be provided');
        }
        if (clientAssertionType !== assertionType) {
          throw new _errors.InvalidRequest(`client_assertion_type must have value ${assertionType}`);
        }
        ctx.oidc.authorization.clientId = sub;
        ctx.oidc.authorization.methods = ['client_secret_jwt', 'private_key_jwt'];
      }
      if (!ctx.oidc.authorization.clientId) {
        throw new _errors.InvalidRequest('no client authentication mechanism provided');
      }
      return next();
    }, async function loadClient(ctx, next) {
      const client = await provider.Client.find(ctx.oidc.authorization.clientId);
      if (!client) {
        throw new _errors.InvalidClientAuth('client not found');
      }
      ctx.oidc.entity('Client', client);
      await next();
    }, async function auth(ctx, next) {
      const {
        params,
        client: {
          clientAuthMethod,
          clientAuthSigningAlg
        },
        authorization: {
          methods,
          clientSecret
        }
      } = ctx.oidc;
      if (!methods.includes(clientAuthMethod)) {
        throw new _errors.InvalidClientAuth('the provided authentication mechanism does not match the registered client authentication method');
      }
      switch (clientAuthMethod) {
        // eslint-disable-line default-case
        case 'none':
          break;
        case 'client_secret_basic':
        case 'client_secret_post':
          {
            ctx.oidc.client.checkClientSecretExpiration('could not authenticate the client - its client secret is expired');
            const actual = params.client_secret || clientSecret;
            const matches = await ctx.oidc.client.compareClientSecret(actual);
            if (!matches) {
              throw new _errors.InvalidClientAuth('invalid secret provided');
            }
            break;
          }
        case 'client_secret_jwt':
          ctx.oidc.client.checkClientSecretExpiration('could not authenticate the client - its client secret used for the client_assertion is expired');
          await tokenJwtAuth(ctx, ctx.oidc.client.symmetricKeyStore, clientAuthSigningAlg ? [clientAuthSigningAlg] : (0, _weak_cache.default)(provider).configuration('clientAuthSigningAlgValues').filter(alg => alg.startsWith('HS')));
          break;
        case 'private_key_jwt':
          await tokenJwtAuth(ctx, ctx.oidc.client.asymmetricKeyStore, clientAuthSigningAlg ? [clientAuthSigningAlg] : (0, _weak_cache.default)(provider).configuration('clientAuthSigningAlgValues').filter(alg => !alg.startsWith('HS')));
          break;
        case 'tls_client_auth':
          {
            const {
              mTLS: {
                getCertificate,
                certificateAuthorized,
                certificateSubjectMatches
              }
            } = (0, _weak_cache.default)(provider).configuration('features');
            const cert = getCertificate(ctx);
            if (!cert) {
              throw new _errors.InvalidClientAuth('client certificate was not provided');
            }
            if (!certificateAuthorized(ctx)) {
              throw new _errors.InvalidClientAuth('client certificate was not verified');
            }
            for (const [prop, key] of Object.entries({
              tlsClientAuthSubjectDn: 'tls_client_auth_subject_dn',
              tlsClientAuthSanDns: 'tls_client_auth_san_dns',
              tlsClientAuthSanIp: 'tls_client_auth_san_ip',
              tlsClientAuthSanEmail: 'tls_client_auth_san_email',
              tlsClientAuthSanUri: 'tls_client_auth_san_uri'
            })) {
              const value = ctx.oidc.client[prop];
              if (value) {
                if (!certificateSubjectMatches(ctx, key, value)) {
                  throw new _errors.InvalidClientAuth('certificate subject value does not match the registered one');
                }
                break;
              }
            }
            break;
          }
        case 'self_signed_tls_client_auth':
          {
            const {
              mTLS: {
                getCertificate
              }
            } = (0, _weak_cache.default)(provider).configuration('features');
            const cert = getCertificate(ctx);
            if (!cert) {
              throw new _errors.InvalidClientAuth('client certificate was not provided');
            }
            await ctx.oidc.client.asymmetricKeyStore.refresh();
            const expected = (0, _certificate_thumbprint.default)(cert);
            const match = [...ctx.oidc.client.asymmetricKeyStore].find(({
              'x5t#S256': actual
            }) => actual === expected);
            if (!match) {
              throw new _errors.InvalidClientAuth('unregistered client certificate provided');
            }
            break;
          }
      }
      await next();
    }]
  };
}