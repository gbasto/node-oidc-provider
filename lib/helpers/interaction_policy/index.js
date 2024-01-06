"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Check", {
  enumerable: true,
  get: function () {
    return _check.default;
  }
});
Object.defineProperty(exports, "Prompt", {
  enumerable: true,
  get: function () {
    return _prompt.default;
  }
});
exports.base = void 0;
var _check = _interopRequireDefault(require("./check.js"));
var _prompt = _interopRequireDefault(require("./prompt.js"));
var _login = _interopRequireDefault(require("./prompts/login.js"));
var _consent = _interopRequireDefault(require("./prompts/consent.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const base = () => {
  const DEFAULT = [];
  DEFAULT.get = function getPrompt(name) {
    if (typeof name !== 'string') {
      throw new TypeError('name must be a string');
    }
    return this.find(p => p.name === name);
  };
  DEFAULT.remove = function removePrompt(name) {
    if (typeof name !== 'string') {
      throw new TypeError('name must be a string');
    }
    const i = this.findIndex(p => p.name === name);
    this.splice(i, 1);
  };
  DEFAULT.clear = function clearAll() {
    while (this.length) {
      this.splice(0, 1);
    }
  };
  DEFAULT.add = function addPrompt(prompt, i = this.length) {
    if (!(prompt instanceof _prompt.default)) {
      throw new TypeError('argument must be an instance of Prompt');
    }
    this.splice(i, 0, prompt);
  };
  DEFAULT.add((0, _login.default)());
  DEFAULT.add((0, _consent.default)());
  return DEFAULT;
};
exports.base = base;