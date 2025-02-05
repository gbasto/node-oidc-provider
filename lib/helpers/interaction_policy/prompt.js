"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _check = _interopRequireDefault(require("./check.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable no-param-reassign */

class Prompt {
  // eslint-disable-next-line default-param-last
  constructor({
    name,
    requestable = false
  } = {}, details, ...checks) {
    if (typeof requestable !== 'boolean') {
      throw new Error('requestable argument must be provided as Boolean');
    }
    if (details instanceof _check.default) {
      checks.unshift(details);
      details = () => {};
    }
    if (typeof details === 'undefined') {
      details = () => {};
    }
    let error;
    switch (name) {
      case 'none':
        throw new Error('prompt none is special, cannot be registered like this');
      case 'login':
      case 'consent':
        error = `${name}_required`;
        break;
      case 'select_account':
        error = 'account_selection_required';
        break;
      default:
        error = 'interaction_required';
    }
    checks.forEach(check => {
      if (check.error === undefined) {
        check.error = error;
      }
    });
    if (requestable) {
      checks.unshift(new _check.default(`${name}_prompt`, `${name} prompt was not resolved`, error, ctx => {
        const {
          oidc
        } = ctx;
        if (oidc.prompts.has(name) && oidc.promptPending(name)) {
          return true;
        }
        return false;
      }));
    }
    this.name = name;
    this.requestable = requestable;
    this.details = details;
    this.checks = checks;
    Object.defineProperties(this.checks, {
      get: {
        value(reason) {
          if (typeof reason !== 'string') {
            throw new TypeError('reason must be a string');
          }
          return this.find(p => p.reason === reason);
        }
      },
      remove: {
        value(reason) {
          if (typeof reason !== 'string') {
            throw new TypeError('reason must be a string');
          }
          const i = this.findIndex(p => p.reason === reason);
          this.splice(i, 1);
        }
      },
      clear: {
        value() {
          while (this.length) {
            this.splice(0, 1);
          }
        }
      },
      add: {
        value(check, i = this.length) {
          if (!(check instanceof _check.default)) {
            throw new TypeError('argument must be an instance of Check');
          }
          this.splice(i, 0, check);
        }
      }
    });
  }
}
var _default = exports.default = Prompt;