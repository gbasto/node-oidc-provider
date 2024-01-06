"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var _epoch_time = _interopRequireDefault(require("../helpers/epoch_time.js"));
var _has_format = _interopRequireDefault(require("./mixins/has_format.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = provider => class Interaction extends (0, _has_format.default)(provider, 'Interaction', (0, _weak_cache.default)(provider).BaseModel) {
  constructor(jti, payload) {
    if (arguments.length === 2) {
      if (payload.session instanceof (0, _weak_cache.default)(provider).BaseModel) {
        const {
          session
        } = payload;
        Object.assign(payload, session.accountId ? {
          session: {
            accountId: session.accountId,
            ...(session.uid ? {
              uid: session.uid
            } : undefined),
            ...(session.jti ? {
              cookie: session.jti
            } : undefined),
            ...(session.acr ? {
              acr: session.acr
            } : undefined),
            ...(session.amr ? {
              amr: session.amr
            } : undefined)
          }
        } : {
          session: undefined
        });
      }
      if (payload.grant instanceof (0, _weak_cache.default)(provider).BaseModel) {
        const {
          grant
        } = payload;
        if (grant.jti) {
          Object.assign(payload, {
            grantId: grant.jti
          });
        }
      }
      super({
        jti,
        ...payload
      });
    } else {
      super(jti);
    }
  }
  get uid() {
    return this.jti;
  }
  set uid(value) {
    this.jti = value;
  }
  async save(ttl) {
    if (typeof ttl !== 'number') {
      throw new TypeError('"ttl" argument must be a number');
    }
    return super.save(ttl);
  }
  async persist() {
    if (typeof this.exp !== 'number') {
      throw new TypeError('persist can only be called on previously persisted Interactions');
    }
    return this.save(this.exp - (0, _epoch_time.default)());
  }
  static get IN_PAYLOAD() {
    return [...super.IN_PAYLOAD, 'session', 'params', 'prompt', 'result', 'returnTo', 'trusted', 'grantId', 'lastSubmission', 'deviceCode', 'cid'];
  }
};
exports.default = _default;