"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _errors = require("./errors.js");
var _default = async (ctx, model, config, scopes = model.scopes) => {
  let resource;
  if (config.resourceIndicators.enabled) {
    // eslint-disable-next-line default-case
    switch (true) {
      case !!ctx.oidc.params.resource:
        resource = ctx.oidc.params.resource;
        break;
      case !model.resource:
      case Array.isArray(model.resource) && model.resource.length === 0:
        break;
      case model.resource && !!(await config.resourceIndicators.useGrantedResource(ctx, model)):
      case !ctx.oidc.params.resource && (!config.userinfo.enabled || !scopes.has('openid')):
        resource = model.resource;
        break;
    }
    if (Array.isArray(resource)) {
      resource = await config.resourceIndicators.defaultResource(ctx, ctx.oidc.client, resource);
    }
    if (Array.isArray(resource)) {
      throw new _errors.InvalidTarget('only a single resource indicator value must be requested/resolved during Access Token Request');
    }
    if (resource && !model.resourceIndicators.has(resource)) {
      throw new _errors.InvalidTarget();
    }
  }
  return resource;
};
exports.default = _default;