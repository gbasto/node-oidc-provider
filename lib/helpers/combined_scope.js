"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = (grant, requestParamScopes, resourceServers) => {
  const combinedScope = new Set();
  grant.getOIDCScopeFiltered(requestParamScopes).split(' ').forEach(Set.prototype.add.bind(combinedScope));
  for (const resourceServer of Object.values(resourceServers)) {
    grant.getResourceScopeFiltered(resourceServer.identifier(), requestParamScopes).split(' ').forEach(Set.prototype.add.bind(combinedScope));
  }
  return combinedScope;
};
exports.default = _default;