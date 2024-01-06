"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = superclass => class extends superclass {
  static async revokeByGrantId(grantId) {
    await this.adapter.revokeByGrantId(grantId);
  }
  static get IN_PAYLOAD() {
    return [...super.IN_PAYLOAD, 'grantId'];
  }
};
exports.default = _default;