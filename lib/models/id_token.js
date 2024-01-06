"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getIdToken;
var _nodeUtil = require("node:util");
var _oidcTokenHash = require("oidc-token-hash");
var _merge = _interopRequireDefault(require("../helpers/_/merge.js"));
var _epoch_time = _interopRequireDefault(require("../helpers/epoch_time.js"));
var JWT = _interopRequireWildcard(require("../helpers/jwt.js"));
var _errors = require("../helpers/errors.js");
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var _is_plain_object = _interopRequireDefault(require("../helpers/_/is_plain_object.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable no-unused-expressions */

const hashes = ['at_hash', 'c_hash', 's_hash', 'urn:openid:params:jwt:claim:rt_hash'];
const messages = {
  sig: {
    idtoken: 'client secret is expired - cannot issue an ID Token (%s)',
    logout: 'client secret is expired - cannot issue a Logout Token (%s)',
    userinfo: 'client secret is expired - cannot respond with %s JWT UserInfo response',
    introspection: 'client secret is expired - cannot respond with %s JWT Introspection response'
  },
  enc: {
    idtoken: 'client secret is expired - cannot issue an encrypted ID Token (%s)',
    logout: 'client secret is expired - cannot issue an encrypted Logout Token (%s)',
    userinfo: 'client secret is expired - cannot respond with %s encrypted JWT UserInfo response',
    introspection: 'client secret is expired - cannot respond with %s encrypted JWT Introspection response'
  }
};
function getIdToken(provider) {
  return class IdToken {
    constructor(available, {
      ctx,
      client = ctx ? ctx.oidc.client : undefined
    }) {
      if (!(0, _is_plain_object.default)(available)) {
        throw new TypeError('expected claims to be an object, are you sure claims() method resolves with or returns one?');
      }
      this.extra = {};
      this.available = available;
      this.client = client;
      this.ctx = ctx;
    }
    static expiresIn(...args) {
      const ttl = (0, _weak_cache.default)(provider).configuration(`ttl.${this.name}`);
      if (typeof ttl === 'number') {
        return ttl;
      }
      return ttl(...args);
    }
    set(key, value) {
      this.extra[key] = value;
    }
    async payload() {
      const mask = new provider.Claims(this.available, {
        ctx: this.ctx,
        client: this.client
      });
      mask.scope(this.scope);
      mask.mask(this.mask);
      mask.rejected(this.rejected);
      return (0, _merge.default)({}, await mask.result(), this.extra);
    }
    async issue({
      use,
      expiresAt = null
    } = {}) {
      const {
        client
      } = this;
      const expiresIn = expiresAt ? expiresAt - (0, _epoch_time.default)() : undefined;
      let alg;
      const payload = await this.payload();
      let signOptions;
      let encryption;
      switch (use) {
        case 'idtoken':
          alg = client.idTokenSignedResponseAlg;
          signOptions = {
            audience: client.clientId,
            expiresIn: expiresIn || this.constructor.expiresIn(this.ctx, this, client),
            issuer: provider.issuer,
            subject: payload.sub
          };
          encryption = {
            alg: client.idTokenEncryptedResponseAlg,
            enc: client.idTokenEncryptedResponseEnc
          };
          break;
        case 'logout':
          alg = client.idTokenSignedResponseAlg;
          signOptions = {
            audience: client.clientId,
            issuer: provider.issuer,
            subject: payload.sub,
            typ: 'logout+jwt'
          };
          encryption = {
            alg: client.idTokenEncryptedResponseAlg,
            enc: client.idTokenEncryptedResponseEnc
          };
          break;
        case 'userinfo':
          alg = client.userinfoSignedResponseAlg;
          signOptions = {
            audience: client.clientId,
            issuer: provider.issuer,
            subject: payload.sub,
            expiresIn
          };
          encryption = {
            alg: client.userinfoEncryptedResponseAlg,
            enc: client.userinfoEncryptedResponseEnc
          };
          break;
        case 'introspection':
          alg = client.introspectionSignedResponseAlg;
          signOptions = {
            audience: client.clientId,
            issuer: provider.issuer,
            typ: 'token-introspection+jwt'
          };
          encryption = {
            alg: client.introspectionEncryptedResponseAlg,
            enc: client.introspectionEncryptedResponseEnc
          };
          break;
        case 'authorization':
          alg = client.authorizationSignedResponseAlg;
          signOptions = {
            audience: client.clientId,
            expiresIn: 120,
            issuer: provider.issuer,
            noIat: true
          };
          encryption = {
            alg: client.authorizationEncryptedResponseAlg,
            enc: client.authorizationEncryptedResponseEnc
          };
          break;
        default:
          throw new TypeError('invalid use option');
      }
      const signed = await (async () => {
        if (typeof alg !== 'string') {
          throw new Error();
        }
        let jwk;
        let key;
        if (alg.startsWith('HS')) {
          if (use !== 'authorization') {
            // handled in checkResponseMode
            client.checkClientSecretExpiration((0, _nodeUtil.format)(messages.sig[use], alg));
          }
          [jwk] = client.symmetricKeyStore.selectForSign({
            alg,
            use: 'sig'
          });
          key = await client.symmetricKeyStore.getKeyObject(jwk, alg);
        } else {
          [jwk] = (0, _weak_cache.default)(provider).keystore.selectForSign({
            alg,
            use: 'sig'
          });
          key = await (0, _weak_cache.default)(provider).keystore.getKeyObject(jwk, alg).catch(() => {
            throw new Error(`provider key (kid: ${jwk.kid}) is invalid`);
          });
        }
        if (use === 'idtoken') {
          hashes.forEach(claim => {
            if (payload[claim]) {
              payload[claim] = (0, _oidcTokenHash.generate)(payload[claim], alg, jwk.crv);
            }
          });
        }
        if (jwk) {
          signOptions.fields = {
            kid: jwk.kid
          };
        }
        return JWT.sign(payload, key, alg, signOptions);
      })();
      if (!encryption.enc) {
        return signed;
      }
      if (/^(A|dir$)/.test(encryption.alg)) {
        if (use !== 'authorization') {
          // handled in checkResponseMode
          client.checkClientSecretExpiration((0, _nodeUtil.format)(messages.enc[use], encryption.alg));
        }
      }
      let jwk;
      let encryptionKey;
      if (encryption.alg === 'dir') {
        [jwk] = client.symmetricKeyStore.selectForEncrypt({
          alg: encryption.enc,
          use: 'enc'
        });
        jwk && (encryptionKey = await client.symmetricKeyStore.getKeyObject(jwk, encryption.enc));
      } else if (encryption.alg.startsWith('A')) {
        [jwk] = client.symmetricKeyStore.selectForEncrypt({
          alg: encryption.alg,
          use: 'enc'
        });
        jwk && (encryptionKey = await client.symmetricKeyStore.getKeyObject(jwk, encryption.alg));
      } else {
        await client.asymmetricKeyStore.refresh();
        [jwk] = client.asymmetricKeyStore.selectForEncrypt({
          alg: encryption.alg,
          use: 'enc'
        });
        jwk && (encryptionKey = await client.asymmetricKeyStore.getKeyObject(jwk, encryption.alg));
      }
      if (!encryptionKey) {
        throw new _errors.InvalidClientMetadata(`no suitable encryption key found (${encryption.alg})`);
      }
      const {
        kid
      } = jwk;
      return JWT.encrypt(signed, encryptionKey, {
        enc: encryption.enc,
        alg: encryption.alg,
        fields: {
          cty: 'JWT',
          kid,
          iss: signOptions.issuer,
          aud: signOptions.audience
        }
      });
    }
    static async validate(jwt, client) {
      const alg = client.idTokenSignedResponseAlg;
      let keyOrStore;
      if (alg.startsWith('HS')) {
        client.checkClientSecretExpiration('client secret is expired - cannot validate ID Token Hint');
        keyOrStore = client.symmetricKeyStore;
      } else {
        keyOrStore = (0, _weak_cache.default)(provider).keystore;
      }
      const opts = {
        ignoreExpiration: true,
        audience: client.clientId,
        issuer: provider.issuer,
        clockTolerance: (0, _weak_cache.default)(provider).configuration('clockTolerance'),
        algorithm: alg,
        subject: true
      };
      if (keyOrStore === undefined) {
        const decoded = JWT.decode(jwt);
        JWT.assertHeader(decoded.header, opts);
        JWT.assertPayload(decoded.payload, opts);
        return decoded;
      }
      return JWT.verify(jwt, keyOrStore, opts);
    }
  };
}