"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _errors = require("../../helpers/errors.js");
var _certificate_thumbprint = _interopRequireDefault(require("../../helpers/certificate_thumbprint.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const x5t = 'x5t#S256';
const jkt = 'jkt';
var _default = superclass => class extends superclass {
  static get IN_PAYLOAD() {
    return [...super.IN_PAYLOAD, x5t, jkt];
  }
  setThumbprint(prop, input) {
    switch (prop) {
      case 'x5t':
        if (this[jkt]) {
          throw new _errors.InvalidRequest('multiple proof-of-posession mechanisms are not allowed');
        }
        this[x5t] = (0, _certificate_thumbprint.default)(input);
        break;
      case 'jkt':
        if (this[x5t]) {
          throw new _errors.InvalidRequest('multiple proof-of-posession mechanisms are not allowed');
        }
        this[jkt] = input;
        break;
      default:
        throw new Error('unsupported');
    }
  }
  isSenderConstrained() {
    if (this[jkt] || this[x5t]) {
      return true;
    }
    return false;
  }
  get tokenType() {
    if (this[jkt]) {
      return 'DPoP';
    }
    return 'Bearer';
  }
};
exports.default = _default;