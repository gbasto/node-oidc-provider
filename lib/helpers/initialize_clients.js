"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initializeClients;
var _weak_cache = _interopRequireDefault(require("./weak_cache.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function addClient(properties) {
  (0, _weak_cache.default)(this).clientAddStatic(properties);
}
function initializeClients(clients = []) {
  clients.map(addClient, this);
}