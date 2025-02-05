"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initializeApp;
var _nodeAssert = require("node:assert");
var _router = _interopRequireDefault(require("@koa/router"));
var _interaction = _interopRequireDefault(require("../actions/interaction.js"));
var _cors = _interopRequireDefault(require("../shared/cors.js"));
var _index = _interopRequireDefault(require("../actions/grants/index.js"));
var responseModes = _interopRequireWildcard(require("../response_modes/index.js"));
var _error_handler = _interopRequireDefault(require("../shared/error_handler.js"));
var _authorization_error_handler = _interopRequireDefault(require("../shared/authorization_error_handler.js"));
var _context_ensure_oidc = _interopRequireDefault(require("../shared/context_ensure_oidc.js"));
var _index3 = require("../actions/index.js");
var _errors = require("./errors.js");
var _weak_cache = _interopRequireDefault(require("./weak_cache.js"));
var attention = _interopRequireWildcard(require("./attention.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const discoveryRoute = '/.well-known/openid-configuration';
function initializeApp() {
  const configuration = (0, _weak_cache.default)(this).configuration();
  const CORS_AUTHORIZATION = {
    exposeHeaders: ['WWW-Authenticate'],
    maxAge: 3600
  };
  if (configuration.features.dPoP.nonceSecret) {
    CORS_AUTHORIZATION.exposeHeaders.push('DPoP-Nonce');
  }
  const CORS = {
    open: (0, _cors.default)({
      allowMethods: 'GET',
      maxAge: 3600
    }),
    userinfo: (0, _cors.default)({
      allowMethods: 'GET,POST',
      clientBased: true,
      ...CORS_AUTHORIZATION
    }),
    client: (0, _cors.default)({
      allowMethods: 'POST',
      clientBased: true,
      ...CORS_AUTHORIZATION
    })
  };
  const router = new _router.default();
  (0, _weak_cache.default)(this).router = router;
  const ensureOIDC = (0, _context_ensure_oidc.default)(this);
  const routeMap = new Map();
  function normalizeRoute(name, route, ...stack) {
    (0, _nodeAssert.strict)(typeof name === 'string' && name.charAt(0) !== '/', `invalid route name ${name}`);
    (0, _nodeAssert.strict)(typeof route === 'string' && route.charAt(0) === '/', `invalid route ${route}`);
    route = route.replace(/\/\//g, '/'); // eslint-disable-line no-param-reassign
    stack.forEach(middleware => _nodeAssert.strict.equal(typeof middleware, 'function'), 'invalid middleware');
    routeMap.set(name, route);
    return route;
  }
  async function ensureSessionSave(ctx, next) {
    try {
      await next();
    } finally {
      if (ctx.oidc.session?.touched && !ctx.oidc.session.destroyed) {
        await ctx.oidc.session.persist();
      }
    }
  }
  const get = (name, route, ...stack) => {
    route = normalizeRoute(name, route, ...stack); // eslint-disable-line no-param-reassign
    router.get(name, route, ensureOIDC, ensureSessionSave, ...stack);
  };
  const post = (name, route, ...stack) => {
    route = normalizeRoute(name, route, ...stack); // eslint-disable-line no-param-reassign
    router.post(name, route, ensureOIDC, ensureSessionSave, ...stack);
  };
  const del = (name, route, ...stack) => {
    route = normalizeRoute(name, route, ...stack); // eslint-disable-line no-param-reassign
    router.delete(name, route, ensureOIDC, ...stack);
  };
  const put = (name, route, ...stack) => {
    route = normalizeRoute(name, route, ...stack); // eslint-disable-line no-param-reassign
    router.put(name, route, ensureOIDC, ...stack);
  };
  const options = (name, route, ...stack) => {
    route = normalizeRoute(name, route, ...stack); // eslint-disable-line no-param-reassign
    router.options(name, route, ensureOIDC, ...stack);
  };
  const {
    routes
  } = configuration;
  Object.entries(_index.default).forEach(([grantType, {
    handler,
    parameters
  }]) => {
    const {
      grantTypeHandlers
    } = (0, _weak_cache.default)(this);
    if (configuration.grantTypes.has(grantType) && !grantTypeHandlers.has(grantType)) {
      let dupes;
      if (configuration.features.resourceIndicators.enabled) {
        parameters.add('resource');
        dupes = new Set(['resource']);
      }
      this.registerGrantType(grantType, handler, parameters, dupes);
    }
  });
  ['query', 'fragment', 'form_post'].forEach(mode => {
    this.registerResponseMode(mode, responseModes[mode]);
  });
  if (configuration.features.webMessageResponseMode.enabled) {
    this.registerResponseMode('web_message', responseModes.webMessage);
  }
  if (configuration.features.jwtResponseModes.enabled) {
    this.registerResponseMode('jwt', responseModes.jwt);
    ['query', 'fragment', 'form_post'].forEach(mode => {
      this.registerResponseMode(`${mode}.jwt`, responseModes.jwt);
    });
    if (configuration.features.webMessageResponseMode.enabled) {
      this.registerResponseMode('web_message.jwt', responseModes.jwt);
    }
  }
  const authorization = (0, _index3.getAuthorization)(this, 'authorization');
  const authError = (0, _authorization_error_handler.default)(this);
  get('authorization', routes.authorization, authError, ...authorization);
  post('authorization', routes.authorization, authError, ...authorization);
  const resume = (0, _index3.getAuthorization)(this, 'resume');
  get('resume', `${routes.authorization}/:uid`, authError, ...resume);
  if (configuration.features.userinfo.enabled) {
    get('userinfo', routes.userinfo, CORS.userinfo, (0, _error_handler.default)(this, 'userinfo.error'), ..._index3.userinfo);
    post('userinfo', routes.userinfo, CORS.userinfo, (0, _error_handler.default)(this, 'userinfo.error'), ..._index3.userinfo);
    options('cors.userinfo', routes.userinfo, CORS.userinfo);
  }
  const token = (0, _index3.getToken)(this);
  post('token', routes.token, (0, _error_handler.default)(this, 'grant.error'), CORS.client, ...token);
  options('cors.token', routes.token, CORS.client);
  get('jwks', routes.jwks, CORS.open, (0, _error_handler.default)(this, 'jwks.error'), _index3.jwks);
  options('cors.jwks', routes.jwks, CORS.open);
  get('discovery', discoveryRoute, CORS.open, (0, _error_handler.default)(this, 'discovery.error'), _index3.discovery);
  options('cors.discovery', discoveryRoute, CORS.open);
  if (configuration.features.registration.enabled) {
    const clientRoute = `${routes.registration}/:clientId`;
    post('registration', routes.registration, (0, _error_handler.default)(this, 'registration_create.error'), ..._index3.registration.post);
    get('client', clientRoute, (0, _error_handler.default)(this, 'registration_read.error'), ..._index3.registration.get);
    if (configuration.features.registrationManagement.enabled) {
      put('client_update', clientRoute, (0, _error_handler.default)(this, 'registration_update.error'), ..._index3.registration.put);
      del('client_delete', clientRoute, (0, _error_handler.default)(this, 'registration_delete.error'), ..._index3.registration.del);
    }
  }
  if (configuration.features.revocation.enabled) {
    const revocation = (0, _index3.getRevocation)(this);
    post('revocation', routes.revocation, (0, _error_handler.default)(this, 'revocation.error'), CORS.client, ...revocation);
    options('cors.revocation', routes.revocation, CORS.client);
  }
  if (configuration.features.introspection.enabled) {
    const introspection = (0, _index3.getIntrospection)(this);
    post('introspection', routes.introspection, (0, _error_handler.default)(this, 'introspection.error'), CORS.client, ...introspection);
    options('cors.introspection', routes.introspection, CORS.client);
  }
  post('end_session_confirm', `${routes.end_session}/confirm`, (0, _error_handler.default)(this, 'end_session_confirm.error'), ..._index3.endSession.confirm);
  if (configuration.features.rpInitiatedLogout.enabled) {
    post('end_session', routes.end_session, (0, _error_handler.default)(this, 'end_session.error'), ..._index3.endSession.init);
    get('end_session', routes.end_session, (0, _error_handler.default)(this, 'end_session.error'), ..._index3.endSession.init);
    get('end_session_success', `${routes.end_session}/success`, (0, _error_handler.default)(this, 'end_session_success.error'), ..._index3.endSession.success);
  }
  if (configuration.features.deviceFlow.enabled) {
    const deviceAuthorization = (0, _index3.getAuthorization)(this, 'device_authorization');
    post('device_authorization', routes.device_authorization, (0, _error_handler.default)(this, 'device_authorization.error'), CORS.client, ...deviceAuthorization);
    options('cors.device_authorization', routes.device_authorization, CORS.client);
    const postCodeVerification = (0, _index3.getAuthorization)(this, 'code_verification');
    get('code_verification', routes.code_verification, (0, _error_handler.default)(this, 'code_verification.error'), ..._index3.codeVerification.get);
    post('code_verification', routes.code_verification, (0, _error_handler.default)(this, 'code_verification.error'), ..._index3.codeVerification.post, ...postCodeVerification);
    const deviceResume = (0, _index3.getAuthorization)(this, 'device_resume');
    get('device_resume', `${routes.code_verification}/:uid`, (0, _error_handler.default)(this, 'device_resume.error'), ...deviceResume);
  }
  if (configuration.features.pushedAuthorizationRequests.enabled) {
    const pushedAuthorizationRequests = (0, _index3.getAuthorization)(this, 'pushed_authorization_request');
    post('pushed_authorization_request', routes.pushed_authorization_request, (0, _error_handler.default)(this, 'pushed_authorization_request.error'), CORS.client, ...pushedAuthorizationRequests);
    options('cors.pushed_authorization_request', routes.pushed_authorization_request, CORS.client);
  }
  if (configuration.features.ciba.enabled) {
    const ciba = (0, _index3.getAuthorization)(this, 'backchannel_authentication');
    post('backchannel_authentication', routes.backchannel_authentication, (0, _error_handler.default)(this, 'backchannel_authentication.error'), ...ciba);
  }
  if (configuration.features.devInteractions.enabled) {
    const interaction = (0, _interaction.default)(this);
    get('interaction', '/interaction/:uid', (0, _error_handler.default)(this), ...interaction.render);
    post('submit', '/interaction/:uid', (0, _error_handler.default)(this), ...interaction.submit);
    get('abort', '/interaction/:uid/abort', (0, _error_handler.default)(this), ...interaction.abort);
  }
  const {
    issuer
  } = this;
  async function proxyWarning(ctx, next) {
    if (proxyWarning.pass) return next();
    if (issuer.startsWith('https:') && !ctx.secure && ctx.get('x-forwarded-proto') === 'https') {
      attention.warn('x-forwarded-proto header detected but not trusted, you must set proxy=true on the provider. See the documentation for more details.');
      proxyWarning.pass = true;
    } else if (issuer.startsWith('https:') && !ctx.secure && !ctx.get('x-forwarded-proto')) {
      attention.warn('x-forwarded-proto header not detected for an https issuer, you must configure your ssl offloading proxy and the provider. See the documentation for more details.');
      proxyWarning.pass = true;
    }
    return next();
  }
  proxyWarning.firstInternal = true;
  this.app.use(proxyWarning);
  this.app.use((0, _error_handler.default)(this));
  this.app.use(async (ctx, next) => {
    await next();
    if (ctx.status === 404 && ctx.message === 'Not Found') {
      throw new _errors.InvalidRequest(`unrecognized route or not allowed method (${ctx.method} on ${ctx.path})`, 404);
    }
  });
  this.app.use(router.routes());
}