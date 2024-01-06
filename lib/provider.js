"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var attention = _interopRequireWildcard(require("./helpers/attention.js"));
var url = _interopRequireWildcard(require("node:url"));
var _nodeAssert = require("node:assert");
var events = _interopRequireWildcard(require("node:events"));
var _koa = _interopRequireDefault(require("koa"));
var _configuration = _interopRequireDefault(require("./helpers/configuration.js"));
var _weak_cache = _interopRequireDefault(require("./helpers/weak_cache.js"));
var _initialize_keystore = _interopRequireDefault(require("./helpers/initialize_keystore.js"));
var _initialize_adapter = _interopRequireDefault(require("./helpers/initialize_adapter.js"));
var _initialize_app = _interopRequireDefault(require("./helpers/initialize_app.js"));
var _initialize_clients = _interopRequireDefault(require("./helpers/initialize_clients.js"));
var _request_uri_cache = _interopRequireDefault(require("./helpers/request_uri_cache.js"));
var _resource_server = _interopRequireDefault(require("./helpers/resource_server.js"));
var _valid_url = require("./helpers/valid_url.js");
var _epoch_time = _interopRequireDefault(require("./helpers/epoch_time.js"));
var _claims = _interopRequireDefault(require("./helpers/claims.js"));
var _oidc_context = _interopRequireDefault(require("./helpers/oidc_context.js"));
var _errors = require("./helpers/errors.js");
var models = _interopRequireWildcard(require("./models/index.js"));
var ssHandler = _interopRequireWildcard(require("./helpers/samesite_handler.js"));
var _get = _interopRequireDefault(require("./helpers/_/get.js"));
var _dpop_nonces = _interopRequireDefault(require("./helpers/dpop_nonces.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
// eslint-disable-next-line import/order

async function getInteraction(req, res) {
  const ctx = this.app.createContext(req, res);
  const id = ssHandler.get(ctx.cookies, this.cookieName('interaction'), (0, _weak_cache.default)(this).configuration('cookies.short'));
  if (!id) {
    throw new _errors.SessionNotFound('interaction session id cookie not found');
  }
  const interaction = await this.Interaction.find(id);
  if (!interaction) {
    throw new _errors.SessionNotFound('interaction session not found');
  }
  if (interaction.session?.uid) {
    const session = await this.Session.findByUid(interaction.session.uid);
    if (!session) {
      throw new _errors.SessionNotFound('session not found');
    }
    if (interaction.session.accountId !== session.accountId) {
      throw new _errors.SessionNotFound('session principal changed');
    }
  }
  return interaction;
}
class Provider extends events.EventEmitter {
  #AccessToken;
  #Account;
  #app = new _koa.default();
  #AuthorizationCode;
  #BaseToken;
  #Claims;
  #Client;
  #ClientCredentials;
  #DeviceCode;
  #BackchannelAuthenticationRequest;
  #Grant;
  #IdToken;
  #InitialAccessToken;
  #Interaction;
  #mountPath;
  #OIDCContext;
  #PushedAuthorizationRequest;
  #RefreshToken;
  #RegistrationAccessToken;
  #ReplayDetection;
  #Session;
  constructor(issuer, setup) {
    (0, _nodeAssert.strict)(issuer, 'first argument must be the Issuer Identifier, i.e. https://op.example.com');
    _nodeAssert.strict.equal(typeof issuer, 'string', 'Issuer Identifier must be a string');
    (0, _nodeAssert.strict)((0, _valid_url.isWebUri)(issuer), 'Issuer Identifier must be a valid web uri');
    const components = url.parse(issuer);
    (0, _nodeAssert.strict)(components.host, 'Issuer Identifier must have a host component');
    (0, _nodeAssert.strict)(components.protocol, 'Issuer Identifier must have an URI scheme component');
    (0, _nodeAssert.strict)(!components.search, 'Issuer Identifier must not have a query component');
    (0, _nodeAssert.strict)(!components.hash, 'Issuer Identifier must not have a fragment component');
    super();
    this.issuer = issuer;
    const configuration = new _configuration.default(setup);
    (0, _weak_cache.default)(this).configuration = path => {
      if (path) return (0, _get.default)(configuration, path);
      return configuration;
    };
    if (Array.isArray(configuration.cookies.keys) && configuration.cookies.keys.length) {
      this.#app.keys = configuration.cookies.keys;
    } else {
      attention.warn('configuration cookies.keys is missing, this option is critical to detect and ignore tampered cookies');
    }
    if (configuration.features.dPoP.nonceSecret !== undefined) {
      (0, _weak_cache.default)(this).DPoPNonces = new _dpop_nonces.default(configuration.features.dPoP.nonceSecret);
    }
    (0, _weak_cache.default)(this).responseModes = new Map();
    (0, _weak_cache.default)(this).grantTypeHandlers = new Map();
    (0, _weak_cache.default)(this).grantTypeDupes = new Map();
    (0, _weak_cache.default)(this).grantTypeParams = new Map([[undefined, new Set()]]);
    this.#Account = {
      findAccount: configuration.findAccount
    };
    this.#Claims = (0, _claims.default)(this);
    (0, _weak_cache.default)(this).BaseModel = models.getBaseModel(this);
    this.#BaseToken = models.getBaseToken(this);
    this.#IdToken = models.getIdToken(this);
    this.#Client = models.getClient(this);
    this.#Grant = models.getGrant(this);
    this.#Session = models.getSession(this);
    this.#Interaction = models.getInteraction(this);
    this.#AccessToken = models.getAccessToken(this);
    this.#AuthorizationCode = models.getAuthorizationCode(this);
    this.#RefreshToken = models.getRefreshToken(this);
    this.#ClientCredentials = models.getClientCredentials(this);
    this.#InitialAccessToken = models.getInitialAccessToken(this);
    this.#RegistrationAccessToken = models.getRegistrationAccessToken(this);
    this.#ReplayDetection = models.getReplayDetection(this);
    this.#DeviceCode = models.getDeviceCode(this);
    this.#BackchannelAuthenticationRequest = models.getBackchannelAuthenticationRequest(this);
    this.#PushedAuthorizationRequest = models.getPushedAuthorizationRequest(this);
    this.#OIDCContext = (0, _oidc_context.default)(this);
    const {
      pathname
    } = url.parse(this.issuer);
    this.#mountPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    (0, _weak_cache.default)(this).requestUriCache = new _request_uri_cache.default(this);
    _initialize_adapter.default.call(this, configuration.adapter);
    _initialize_keystore.default.call(this, configuration.jwks);
    delete configuration.jwks;
    _initialize_app.default.call(this);
    _initialize_clients.default.call(this, configuration.clients);
    delete configuration.clients;
  }
  urlFor(name, opt) {
    return url.resolve(this.issuer, this.pathFor(name, opt));
  }
  registerGrantType(name, handler, params, dupes) {
    (0, _weak_cache.default)(this).configuration('grantTypes').add(name);
    const {
      grantTypeHandlers,
      grantTypeParams,
      grantTypeDupes
    } = (0, _weak_cache.default)(this);
    const grantParams = new Set(['grant_type']);
    grantTypeHandlers.set(name, handler);
    if (dupes && typeof dupes === 'string') {
      grantTypeDupes.set(name, new Set([dupes]));
    } else if (dupes && (Array.isArray(dupes) || dupes instanceof Set)) {
      grantTypeDupes.set(name, new Set(dupes));
    }
    if (params && typeof params === 'string') {
      grantParams.add(params);
    } else if (params && (Array.isArray(params) || params instanceof Set)) {
      params.forEach(Set.prototype.add.bind(grantParams));
    }
    grantTypeParams.set(name, grantParams);
    grantParams.forEach(Set.prototype.add.bind(grantTypeParams.get(undefined)));
  }
  cookieName(type) {
    const name = (0, _weak_cache.default)(this).configuration(`cookies.names.${type}`);
    if (!name) {
      throw new Error(`cookie name for type ${type} is not configured`);
    }
    return name;
  }
  registerResponseMode(name, handler) {
    const {
      responseModes
    } = (0, _weak_cache.default)(this);
    if (!responseModes.has(name)) {
      responseModes.set(name, handler.bind(this));
    }
  }
  pathFor(name, {
    mountPath = this.#mountPath,
    ...opts
  } = {}) {
    const {
      router
    } = (0, _weak_cache.default)(this);
    const routerUrl = router.url(name, opts);
    if (routerUrl instanceof Error) {
      throw routerUrl;
    }
    return [mountPath, routerUrl].join('');
  }

  /**
   * @name interactionResult
   * @api public
   */
  async interactionResult(req, res, result, {
    mergeWithLastSubmission = true
  } = {}) {
    const interaction = await getInteraction.call(this, req, res);
    if (mergeWithLastSubmission && !('error' in result)) {
      interaction.result = {
        ...interaction.lastSubmission,
        ...result
      };
    } else {
      interaction.result = result;
    }
    await interaction.save(interaction.exp - (0, _epoch_time.default)());
    return interaction.returnTo;
  }

  /**
   * @name interactionFinished
   * @api public
   */
  async interactionFinished(req, res, result, {
    mergeWithLastSubmission = true
  } = {}) {
    const returnTo = await this.interactionResult(req, res, result, {
      mergeWithLastSubmission
    });
    res.statusCode = 303; // eslint-disable-line no-param-reassign
    res.setHeader('Location', returnTo);
    res.setHeader('Content-Length', '0');
    res.end();
  }

  /**
   * @name interactionDetails
   * @api public
   */
  async interactionDetails(req, res) {
    return getInteraction.call(this, req, res);
  }
  async backchannelResult(request, result, {
    acr,
    amr,
    authTime,
    sessionUid,
    expiresWithSession,
    sid
  } = {}) {
    if (typeof request === 'string' && request) {
      // eslint-disable-next-line no-param-reassign
      request = await this.#BackchannelAuthenticationRequest.find(request, {
        ignoreExpiration: true
      });
      if (!request) {
        throw new Error('BackchannelAuthenticationRequest not found');
      }
    } else if (!(request instanceof this.#BackchannelAuthenticationRequest)) {
      throw new TypeError('invalid "request" argument');
    }
    const client = await this.#Client.find(request.clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    if (typeof result === 'string' && result) {
      // eslint-disable-next-line no-param-reassign
      result = await this.#Grant.find(result);
      if (!result) {
        throw new Error('Grant not found');
      }
    }
    switch (true) {
      case result instanceof this.#Grant:
        if (request.clientId !== result.clientId) {
          throw new Error('client mismatch');
        }
        if (request.accountId !== result.accountId) {
          throw new Error('accountId mismatch');
        }
        Object.assign(request, {
          grantId: result.jti,
          acr,
          amr,
          authTime,
          sessionUid,
          expiresWithSession,
          sid
        });
        break;
      case result instanceof _errors.OIDCProviderError:
        Object.assign(request, {
          error: result.error,
          error_description: result.error_description
        });
        break;
      default:
        throw new TypeError('invalid "result" argument');
    }
    await request.save();
    if (client.backchannelTokenDeliveryMode === 'ping') {
      await client.backchannelPing(request);
    }
  }
  use(fn) {
    this.#app.use(fn);
    // note: get the fn back since it might've been changed from generator to fn by koa-convert
    const newMw = this.#app.middleware.pop();
    const internalIndex = this.#app.middleware.findIndex(mw => !!mw.firstInternal);
    this.#app.middleware.splice(internalIndex, 0, newMw);
  }
  get app() {
    return this.#app;
  }
  callback() {
    return this.#app.callback();
  }
  listen(...args) {
    return this.#app.listen(...args);
  }
  get proxy() {
    return this.#app.proxy;
  }
  set proxy(value) {
    this.#app.proxy = value;
  }
  get OIDCContext() {
    return this.#OIDCContext;
  }
  get Claims() {
    return this.#Claims;
  }
  get BaseToken() {
    return this.#BaseToken;
  }
  get Account() {
    return this.#Account;
  }
  get IdToken() {
    return this.#IdToken;
  }
  get Client() {
    return this.#Client;
  }
  get Grant() {
    return this.#Grant;
  }
  get Session() {
    return this.#Session;
  }
  get Interaction() {
    return this.#Interaction;
  }
  get AccessToken() {
    return this.#AccessToken;
  }
  get AuthorizationCode() {
    return this.#AuthorizationCode;
  }
  get RefreshToken() {
    return this.#RefreshToken;
  }
  get ClientCredentials() {
    return this.#ClientCredentials;
  }
  get InitialAccessToken() {
    return this.#InitialAccessToken;
  }
  get RegistrationAccessToken() {
    return this.#RegistrationAccessToken;
  }
  get DeviceCode() {
    return this.#DeviceCode;
  }
  get BackchannelAuthenticationRequest() {
    return this.#BackchannelAuthenticationRequest;
  }
  get PushedAuthorizationRequest() {
    return this.#PushedAuthorizationRequest;
  }
  get ReplayDetection() {
    return this.#ReplayDetection;
  }

  // eslint-disable-next-line class-methods-use-this
  get ResourceServer() {
    return _resource_server.default;
  }
}
var _default = exports.default = Provider;