"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _nanoid = _interopRequireDefault(require("../helpers/nanoid.js"));
var _epoch_time = _interopRequireDefault(require("../helpers/epoch_time.js"));
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var ssHandler = _interopRequireWildcard(require("../helpers/samesite_handler.js"));
var _has_format = _interopRequireDefault(require("./mixins/has_format.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable prefer-rest-params */
var _default = provider => class Session extends (0, _has_format.default)(provider, 'Session', (0, _weak_cache.default)(provider).BaseModel) {
  constructor(payload) {
    super(payload);
    if (!payload) {
      Object.defineProperty(this, 'new', {
        value: true
      });
    }
    this.uid = this.uid || (0, _nanoid.default)();
    this.jti = this.jti || (0, _nanoid.default)();
  }
  get id() {
    return this.jti;
  }
  set id(value) {
    this.jti = value;
  }
  static get IN_PAYLOAD() {
    return [...super.IN_PAYLOAD, 'uid', 'acr', 'amr', 'accountId', 'loginTs', 'transient', 'state', 'authorizations'];
  }
  static async findByUid(uid) {
    const stored = await this.adapter.findByUid(uid);
    if (!stored) {
      return undefined;
    }
    try {
      const payload = await this.verify(stored);
      return this.instantiate(payload);
    } catch (err) {
      return undefined;
    }
  }
  static async get(ctx) {
    const cookies = ctx.oidc ? ctx.oidc.cookies : provider.app.createContext(ctx.req, ctx.res).cookies;
    cookies.secure = !cookies.secure && ctx.secure ? true : cookies.secure;

    // is there supposed to be a session bound? generate if not
    const cookieSessionId = ssHandler.get(cookies, provider.cookieName('session'), (0, _weak_cache.default)(provider).configuration('cookies.long'));
    let session;
    if (cookieSessionId) {
      session = await this.find(cookieSessionId);
    }
    if (!session) {
      if (cookieSessionId) {
        // underlying session was removed since we have a session id in cookie, let's assign an
        // empty data so that session.new is not true and cookie will get written even if nothing
        // gets written to it
        session = this.instantiate({});
      } else {
        session = this.instantiate();
      }
    }
    if (ctx.oidc instanceof provider.OIDCContext) {
      ctx.oidc.entity('Session', session);
    }
    return session;
  }
  async save(ttl) {
    if (typeof ttl !== 'number') {
      throw new TypeError('"ttl" argument must be a number');
    }
    // one by one adapter ops to allow for uid to have a unique index
    if (this.oldId) {
      await this.adapter.destroy(this.oldId);
    }
    const result = await super.save(ttl);
    this.touched = false;
    return result;
  }
  async persist() {
    if (typeof this.exp !== 'number') {
      throw new TypeError('persist can only be called on previously persisted Sessions');
    }
    return this.save(this.exp - (0, _epoch_time.default)());
  }
  async destroy() {
    await super.destroy();
    this.destroyed = true;
  }
  resetIdentifier() {
    this.oldId = this.id;
    this.id = (0, _nanoid.default)();
    this.touched = true;
  }
  authTime() {
    return this.loginTs;
  }
  past(age) {
    const maxAge = +age;
    if (this.loginTs) {
      return (0, _epoch_time.default)() - this.loginTs > maxAge;
    }
    return true;
  }
  authorizationFor(clientId) {
    // the call will not set, let's not modify the session object
    if (arguments.length === 1 && !this.authorizations) {
      return {};
    }
    this.authorizations = this.authorizations || {};
    if (!this.authorizations[clientId]) {
      this.authorizations[clientId] = {};
    }
    return this.authorizations[clientId];
  }
  sidFor(clientId, value) {
    const authorization = this.authorizationFor(...arguments);
    if (value) {
      authorization.sid = value;
      return undefined;
    }
    return authorization.sid;
  }
  grantIdFor(clientId, value) {
    const authorization = this.authorizationFor(...arguments);
    if (value) {
      authorization.grantId = value;
      return undefined;
    }
    return authorization.grantId;
  }
  ensureClientContainer(clientId) {
    if (!this.sidFor(clientId)) {
      this.sidFor(clientId, (0, _nanoid.default)());
    }
  }
  loginAccount(details) {
    const {
      transient = false,
      accountId,
      loginTs = (0, _epoch_time.default)(),
      amr,
      acr
    } = details;
    Object.assign(this, {
      accountId,
      loginTs,
      amr,
      acr
    }, transient ? {
      transient: true
    } : undefined);
  }
};
exports.default = _default;