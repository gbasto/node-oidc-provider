"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.denormalize = denormalize;
exports.generate = generate;
exports.normalize = normalize;
var _nanoid = _interopRequireDefault(require("./nanoid.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const CHARS = {
  'base-20': 'BCDFGHJKLMNPQRSTVWXZ',
  digits: '0123456789'
};
function generate(charset, mask) {
  const length = mask.split('*').length - 1;
  const generated = (0, _nanoid.default)(length, CHARS[charset]).split('');
  return mask.split('').map(p => {
    if (p === '*') {
      return generated.shift();
    }
    return p;
  }).join('');
}
function denormalize(normalized, mask) {
  const chars = normalized.split('');
  return mask.split('').map(p => {
    if (p === '*') {
      return chars.shift();
    }
    return p;
  }).join('');
}
function normalize(input) {
  return input.replace(/[a-z]/g, char => char.toUpperCase()).replace(/\W/g, () => '');
}