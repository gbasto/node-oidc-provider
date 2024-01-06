"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkResource;
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var _errors = require("../helpers/errors.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-await-in-loop */

const filterStatics = ctx => {
  if (ctx.oidc.params.scope && !ctx.oidc.params.resource) {
    ctx.oidc.params.scope = [...ctx.oidc.requestParamOIDCScopes].join(' ');
  }
};
async function checkResource(ctx, next) {
  const {
    oidc: {
      params,
      provider,
      client,
      resourceServers
    }
  } = ctx;
  const {
    defaultResource,
    enabled,
    getResourceServerInfo
  } = (0, _weak_cache.default)(provider).configuration('features.resourceIndicators');
  if (!enabled) {
    filterStatics(ctx);
    return next();
  }
  if (params.resource === undefined) {
    params.resource = await defaultResource(ctx, client);
  }
  if (params.scope && (!params.resource || Array.isArray(params.resource) && !params.resource.length)) {
    filterStatics(ctx);
    return next();
  }
  let {
    resource
  } = params;
  if (params.resource === undefined) {
    return next();
  }
  if (!Array.isArray(params.resource)) {
    resource = [resource];
  }
  for (const identifier of resource) {
    let href;
    try {
      ({
        href
      } = new URL(resource));
    } catch (err) {
      throw new _errors.InvalidTarget('resource indicator must be an absolute URI');
    }

    // NOTE: we don't check for new URL() => search of hash because of an edge case
    // new URL('https://example.com?#') => search and hash are empty, seems like an inconsistent validation
    if (href.includes('#')) {
      throw new _errors.InvalidTarget('resource indicator must not contain a fragment component');
    }
    const resourceServer = await getResourceServerInfo(ctx, identifier, client);
    resourceServers[identifier] = new ctx.oidc.provider.ResourceServer(identifier, resourceServer);
  }
  return next();
}