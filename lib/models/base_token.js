"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getBaseToken;
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var _ctx_ref = _interopRequireDefault(require("./ctx_ref.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function getBaseToken(provider) {
  class BaseToken extends (0, _weak_cache.default)(provider).BaseModel {
    #client;
    #resourceServer;
    constructor({
      client,
      resourceServer,
      expiresIn,
      ...rest
    } = {}) {
      super(rest);
      if (typeof client !== 'undefined') {
        this.client = client;
      }
      if (typeof resourceServer !== 'undefined') {
        this.resourceServer = resourceServer;
      }
      if (typeof expiresIn !== 'undefined') {
        this.expiresIn = expiresIn;
      }
    }
    set client(client) {
      this.clientId = client.clientId;
      this.#client = client;
    }
    get client() {
      return this.#client;
    }
    set resourceServer(resourceServer) {
      this.setAudience(resourceServer.audience || resourceServer.identifier());
      this.#resourceServer = resourceServer;
    }
    get resourceServer() {
      return this.#resourceServer;
    }
    static expiresIn(...args) {
      const ttl = (0, _weak_cache.default)(provider).configuration(`ttl.${this.name}`);
      if (typeof ttl === 'number') {
        return ttl;
      }
      if (typeof ttl === 'function') {
        return ttl(...args);
      }
      return undefined;
    }
    async save() {
      return super.save(this.remainingTTL);
    }
    static get IN_PAYLOAD() {
      return [...super.IN_PAYLOAD, 'clientId'];
    }
    get expiration() {
      if (!this.expiresIn) {
        this.expiresIn = this.constructor.expiresIn(_ctx_ref.default.get(this), this, this.#client);
      }
      return this.expiresIn;
    }
    get scopes() {
      return new Set(this.scope && this.scope.split(' '));
    }
    get resourceIndicators() {
      return new Set(Array.isArray(this.resource) ? this.resource : [this.resource]);
    }
  }
  return BaseToken;
}