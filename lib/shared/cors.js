"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _cors = _interopRequireDefault(require("@koa/cors"));
var _errors = require("../helpers/errors.js");
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function checkClientCORS(ctx, client) {
  const origin = ctx.get('Origin');
  const {
    clientBasedCORS
  } = (0, _weak_cache.default)(ctx.oidc.provider).configuration();
  const allowed = clientBasedCORS(ctx, origin, client);
  if (typeof allowed !== 'boolean') {
    throw new Error('clientBasedCORS helper must be a synchronous function returning a Boolean');
  }
  if (!allowed) {
    ctx.remove('Access-Control-Allow-Origin');
    throw new _errors.InvalidRequest(`origin ${origin} not allowed for client: ${client.clientId}`);
  }
}
var _default = ({
  clientBased = false,
  ...options
}) => {
  const builtin = (0, _cors.default)({
    keepHeadersOnError: false,
    origin(ctx) {
      return ctx.get('Origin') || '*';
    },
    ...options
  });
  return async (ctx, next) => {
    const headers = Object.keys(ctx.response.headers);

    // ignore built in CORS handling since the developer wants to do it their way
    if (headers.find(x => x.toLowerCase().startsWith('access-control-'))) {
      return next();
    }
    ctx.vary('Origin');
    // preflights or generally available (e.g. discovery) -> CORS is allowed
    if (ctx.method === 'OPTIONS' || !clientBased || !ctx.get('Origin')) {
      return builtin(ctx, next);
    }
    await new Promise(resolve => {
      builtin(ctx, resolve);
    });
    ctx.oidc.once('assign.client', checkClientCORS);
    return next();
  };
};
exports.default = _default;