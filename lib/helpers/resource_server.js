"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
/* eslint-disable no-underscore-dangle */

class ResourceServer {
  constructor(identifier, data) {
    this._identifier = identifier;
    this.audience = data.audience;
    this.scope = data.scope;
    this.accessTokenTTL = data.accessTokenTTL;
    this.accessTokenFormat = data.accessTokenFormat;
    this.jwt = data.jwt;
  }
  get scopes() {
    return new Set(this.scope && this.scope.split(' '));
  }
  identifier() {
    return this._identifier;
  }
}
exports.default = ResourceServer;