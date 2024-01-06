"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.interactionPolicy = exports.errors = exports.default = void 0;
var attention = _interopRequireWildcard(require("./helpers/attention.js"));
var _provider = _interopRequireDefault(require("./provider.js"));
var errors = _interopRequireWildcard(require("./helpers/errors.js"));
exports.errors = errors;
var interactionPolicy = _interopRequireWildcard(require("./helpers/interaction_policy/index.js"));
exports.interactionPolicy = interactionPolicy;
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/* eslint-disable import/first */
// eslint-disable-next-line import/order

const minimal = 'Hydrogen';
const {
  lts: codename
} = process.release || {};
if (!codename || codename.charCodeAt(0) < minimal.charCodeAt(0) || typeof Bun !== 'undefined') {
  attention.warn('Unsupported runtime. Use Node.js v18.x LTS, or a later LTS release.');
}
var _default = exports.default = _provider.default;