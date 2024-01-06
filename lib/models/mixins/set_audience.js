"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _errors = require("../../helpers/errors.js");
var _default = superclass => class extends superclass {
  setAudience(audience) {
    if (Array.isArray(audience)) {
      if (audience.length === 0) {
        return;
      }
      if (audience.length > 1) {
        throw new _errors.InvalidTarget('only a single audience value is supported');
      }

      // eslint-disable-next-line no-param-reassign
      [audience] = audience;
    } else if (typeof audience !== 'string' || !audience) {
      throw new _errors.InvalidTarget();
    }
    this.aud = audience;
  }
};
exports.default = _default;