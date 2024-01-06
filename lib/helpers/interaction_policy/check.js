"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
/* eslint-disable no-param-reassign */

class Check {
  constructor(reason, description, error, check = () => {}, details = () => {}) {
    if (typeof error === 'function') {
      details = check;
      check = error;
      error = undefined;
    }
    this.reason = reason;
    this.description = description;
    this.error = error;
    this.details = details;
    this.check = check;
  }
}
Check.REQUEST_PROMPT = true;
Check.NO_NEED_TO_PROMPT = false;
var _default = exports.default = Check;