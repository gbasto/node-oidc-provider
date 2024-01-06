"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getContext;
var events = _interopRequireWildcard(require("node:events"));
var url = _interopRequireWildcard(require("node:url"));
var _ctx_ref = _interopRequireDefault(require("../models/ctx_ref.js"));
var _get = _interopRequireDefault(require("./_/get.js"));
var _is_plain_object = _interopRequireDefault(require("./_/is_plain_object.js"));
var _omit_by = _interopRequireDefault(require("./_/omit_by.js"));
var _errors = require("./errors.js");
var _weak_cache = _interopRequireDefault(require("./weak_cache.js"));
var _resolve_response_mode = _interopRequireDefault(require("./resolve_response_mode.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const COOKIES = Symbol();
function getContext(provider) {
  const {
    acceptQueryParamAccessTokens,
    features: {
      dPoP: dPoPConfig,
      fapi
    },
    scopes: oidcScopes
  } = (0, _weak_cache.default)(provider).configuration();
  const {
    app
  } = provider;
  class OIDCContext extends events.EventEmitter {
    #requestParamClaims = null;
    #accessToken = null;
    #fapiProfile = null;
    constructor(ctx) {
      super();
      this.ctx = ctx;
      this.route = ctx._matchedRouteName;
      this.authorization = {};
      this.redirectUriCheckPerformed = false;
      this.webMessageUriCheckPerformed = false;
      this.entities = {};
      this.claims = {};
      this.resourceServers = {};
    }
    get cookies() {
      if (!this[COOKIES]) {
        this[COOKIES] = app.createContext(this.ctx.req, this.ctx.res).cookies;
        this[COOKIES].secure = !this[COOKIES].secure && this.ctx.secure ? true : this[COOKIES].secure;
      }
      return this[COOKIES];
    }
    get fapiProfile() {
      if (this.#fapiProfile === null) {
        this.#fapiProfile = fapi.profile(this.ctx, this.client);
      }
      return this.#fapiProfile;
    }
    isFapi(...oneOf) {
      const i = oneOf.indexOf(this.fapiProfile);
      return i !== -1 ? oneOf[i] : undefined;
    }
    get issuer() {
      // eslint-disable-line class-methods-use-this
      return provider.issuer;
    }
    get provider() {
      // eslint-disable-line class-methods-use-this
      return provider;
    }
    entity(key, value) {
      if (value instanceof provider.BaseToken) {
        _ctx_ref.default.set(value, this.ctx);
      }
      this.entities[key] = value;
      if (key === 'Client') {
        this.emit('assign.client', this.ctx, value);
      }
    }
    urlFor(name, opt) {
      const mountPath = this.ctx.req.originalUrl && this.ctx.req.originalUrl.substring(0, this.ctx.req.originalUrl.indexOf(this.ctx.request.url)) || this.ctx.mountPath // koa-mount
      || this.ctx.req.baseUrl // expressApp.use('/op', provider.callback());
      || ''; // no mount

      return url.resolve(this.ctx.href, provider.pathFor(name, {
        mountPath,
        ...opt
      }));
    }
    promptPending(name) {
      if (this.ctx.oidc.route.endsWith('resume')) {
        const should = new Set([...this.prompts]);
        Object.keys(this.result || {}).forEach(Set.prototype.delete.bind(should));
        return should.has(name);
      }

      // first pass
      return this.prompts.has(name);
    }
    get requestParamClaims() {
      if (this.#requestParamClaims) {
        return this.#requestParamClaims;
      }
      const requestParamClaims = new Set();
      if (this.params.claims) {
        const {
          userinfo,
          id_token: idToken
        } = JSON.parse(this.params.claims);
        const claims = (0, _weak_cache.default)(provider).configuration('claimsSupported');
        if (userinfo) {
          Object.entries(userinfo).forEach(([claim, value]) => {
            if (claims.has(claim) && (value === null || (0, _is_plain_object.default)(value))) {
              requestParamClaims.add(claim);
            }
          });
        }
        if (idToken) {
          Object.entries(idToken).forEach(([claim, value]) => {
            if (claims.has(claim) && (value === null || (0, _is_plain_object.default)(value))) {
              requestParamClaims.add(claim);
            }
          });
        }
      }
      this.#requestParamClaims = requestParamClaims;
      return requestParamClaims;
    }
    clientJwtAuthExpectedAudience() {
      return new Set([this.issuer, this.urlFor('token'), this.urlFor(this.route)]);
    }
    get requestParamScopes() {
      return new Set(this.params.scope ? this.params.scope.split(' ') : undefined);
    }
    get requestParamOIDCScopes() {
      if (!this.params.scope) {
        return new Set();
      }
      return new Set(this.params.scope.split(' ').filter(Set.prototype.has.bind(oidcScopes)));
    }
    resolvedClaims() {
      const rejected = this.session.rejectedClaimsFor(this.params.client_id);
      const claims = JSON.parse(JSON.stringify(this.claims));
      claims.rejected = [...rejected];
      return claims;
    }
    get responseMode() {
      if (typeof this.params.response_mode === 'string') {
        return this.params.response_mode;
      }
      if (this.params.response_type !== undefined) {
        return (0, _resolve_response_mode.default)(this.params.response_type);
      }
      return undefined;
    }
    get acr() {
      return this.session.acr;
    }
    get amr() {
      return this.session.amr;
    }
    get prompts() {
      return new Set(this.params.prompt ? this.params.prompt.split(' ') : []);
    }
    get registrationAccessToken() {
      return this.entities.RegistrationAccessToken;
    }
    get deviceCode() {
      return this.entities.DeviceCode;
    }
    get accessToken() {
      return this.entities.AccessToken;
    }
    get account() {
      return this.entities.Account;
    }
    get client() {
      return this.entities.Client;
    }
    get grant() {
      return this.entities.Grant;
    }
    getAccessToken({
      acceptDPoP = false,
      acceptQueryParam = acceptQueryParamAccessTokens && !fapi.enabled
    } = {}) {
      if (this.#accessToken) {
        return this.#accessToken;
      }
      const {
        ctx
      } = this;
      const mechanisms = (0, _omit_by.default)({
        body: ctx.is('application/x-www-form-urlencoded') && (0, _get.default)(ctx.oidc, 'body.access_token'),
        header: ctx.headers.authorization,
        query: ctx.query.access_token
      }, value => typeof value !== 'string' || !value);
      let mechanism;
      let length;
      let token;
      try {
        ({
          0: [mechanism, token],
          length
        } = Object.entries(mechanisms));
      } catch (err) {}
      if (!length) {
        throw new _errors.InvalidRequest('no access token provided');
      }
      if (length > 1) {
        throw new _errors.InvalidRequest('access token must only be provided using one mechanism');
      }
      if (!acceptQueryParam && mechanism === 'query') {
        throw new _errors.InvalidRequest('access tokens must not be provided via query parameter');
      }
      const dpop = acceptDPoP && dPoPConfig.enabled && ctx.get('DPoP');
      if (mechanism === 'header') {
        const header = token;
        const {
          0: scheme,
          1: value,
          length: parts
        } = header.split(' ');
        if (parts !== 2) {
          throw new _errors.InvalidRequest('invalid authorization header value format');
        }
        if (dpop && scheme.toLowerCase() !== 'dpop') {
          throw new _errors.InvalidRequest('authorization header scheme must be `DPoP` when DPoP is used');
        } else if (!dpop && scheme.toLowerCase() === 'dpop') {
          throw new _errors.InvalidRequest('`DPoP` header not provided');
        } else if (!dpop && scheme.toLowerCase() !== 'bearer') {
          throw new _errors.InvalidRequest('authorization header scheme must be `Bearer`');
        }
        token = value;
      }
      if (dpop && mechanism !== 'header') {
        throw new _errors.InvalidRequest('`DPoP` tokens must be provided via an authorization header');
      }
      this.#accessToken = token;
      return token;
    }
  }
  return OIDCContext;
}