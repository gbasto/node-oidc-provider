"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getBaseModel;
var _snake_case = _interopRequireDefault(require("../helpers/_/snake_case.js"));
var _epoch_time = _interopRequireDefault(require("../helpers/epoch_time.js"));
var _pick_by = _interopRequireDefault(require("../helpers/_/pick_by.js"));
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var _type_validators = _interopRequireDefault(require("../helpers/type_validators.js"));
var _has_format = _interopRequireDefault(require("./mixins/has_format.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable max-classes-per-file */

const IN_PAYLOAD = ['iat', 'exp', 'jti', 'kind'];
const adapterCache = new WeakMap();
function getBaseModel(provider) {
  function adapter(ctx) {
    const obj = typeof ctx === 'function' ? ctx : ctx.constructor;
    if (!adapterCache.has(obj)) {
      if ((0, _type_validators.default)((0, _weak_cache.default)(provider).Adapter)) {
        adapterCache.set(obj, new ((0, _weak_cache.default)(provider).Adapter)(obj.name));
      } else {
        adapterCache.set(obj, (0, _weak_cache.default)(provider).Adapter(obj.name));
      }
    }
    return adapterCache.get(obj);
  }
  class Class {
    constructor({
      jti,
      kind,
      ...payload
    } = {}) {
      Object.assign(this, (0, _pick_by.default)(payload, (val, key) => this.constructor.IN_PAYLOAD.includes(key)));
      if (kind && kind !== this.constructor.name) {
        throw new TypeError('kind mismatch');
      }
      this.kind = kind || this.constructor.name;
      this.jti = jti;
    }
    static instantiate(payload) {
      return new this(payload);
    }
    async save(ttl) {
      if (!this.jti) {
        this.jti = this.generateTokenId();
      }

      // this is true for all BaseToken descendants
      if (typeof this.constructor.expiresIn !== 'function') {
        this.exp = (0, _epoch_time.default)() + ttl;
      }
      const {
        value,
        payload
      } = await this.getValueAndPayload();
      if (payload) {
        await this.adapter.upsert(this.jti, payload, ttl);
        this.emit('saved');
      } else {
        this.emit('issued');
      }
      return value;
    }
    async destroy() {
      await this.adapter.destroy(this.jti);
      this.emit('destroyed');
    }
    static get adapter() {
      return adapter(this);
    }
    get adapter() {
      return adapter(this);
    }
    static get IN_PAYLOAD() {
      return IN_PAYLOAD;
    }
    static async find(value, {
      ignoreExpiration = false
    } = {}) {
      if (typeof value !== 'string') {
        return undefined;
      }
      const stored = await this.adapter.find(value);
      if (!stored) {
        return undefined;
      }
      try {
        const payload = await this.verify(stored, {
          ignoreExpiration
        });
        return this.instantiate(payload);
      } catch (err) {
        return undefined;
      }
    }
    emit(eventName) {
      provider.emit(`${(0, _snake_case.default)(this.kind)}.${eventName}`, this);
    }

    /*
     * ttlPercentagePassed
     * returns a Number (0 to 100) with the value being percentage of the token's ttl already
     * passed. The higher the percentage the older the token is. At 0 the token is fresh, at a 100
     * it is expired.
     */
    ttlPercentagePassed() {
      const now = (0, _epoch_time.default)();
      const percentage = Math.floor(100 * ((now - this.iat) / (this.exp - this.iat)));
      return Math.max(Math.min(100, percentage), 0);
    }
    get isValid() {
      return !this.isExpired;
    }
    get isExpired() {
      return this.exp <= (0, _epoch_time.default)();
    }
    get remainingTTL() {
      if (!this.exp) {
        return this.expiration;
      }
      return this.exp - (0, _epoch_time.default)();
    }
  }
  class BaseModel extends (0, _has_format.default)(provider, 'base', Class) {}
  return BaseModel;
}