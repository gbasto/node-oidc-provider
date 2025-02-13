"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = superclass => class extends superclass {
  static get IN_PAYLOAD() {
    return [...super.IN_PAYLOAD, 'consumed'];
  }
  async consume() {
    await this.adapter.consume(this.jti);
    this.emit('consumed');
  }
  get isValid() {
    return !this.consumed && !this.isExpired;
  }
};
exports.default = _default;