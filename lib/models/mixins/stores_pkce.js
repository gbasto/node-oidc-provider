"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = superclass => class extends superclass {
  static get IN_PAYLOAD() {
    return [...super.IN_PAYLOAD, 'codeChallenge', 'codeChallengeMethod'];
  }
};
exports.default = _default;