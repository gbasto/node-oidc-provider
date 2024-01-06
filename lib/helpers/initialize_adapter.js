"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initializeAdapter;
var util = _interopRequireWildcard(require("node:util"));
var _memory_adapter = _interopRequireDefault(require("../adapters/memory_adapter.js"));
var _weak_cache = _interopRequireDefault(require("./weak_cache.js"));
var attention = _interopRequireWildcard(require("./attention.js"));
var _type_validators = _interopRequireDefault(require("./type_validators.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function initializeAdapter(adapter = _memory_adapter.default) {
  if (adapter === _memory_adapter.default) {
    attention.warn('a quick start development-only in-memory adapter is used, you MUST change it in' + ' order to not lose all stateful provider data upon restart and to be able to share these' + ' between processes');
  }
  const constructable = (0, _type_validators.default)(adapter);
  const executable = typeof adapter === 'function' && !util.types.isAsyncFunction(adapter);
  const valid = constructable || executable;
  if (!valid) {
    throw new Error('Expected "adapter" to be a constructor or a factory function, provide a valid adapter in Provider config.');
  }
  (0, _weak_cache.default)(this).Adapter = adapter;
}