"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.put = exports.post = exports.get = exports.del = void 0;
var _omit_by = _interopRequireDefault(require("../helpers/_/omit_by.js"));
var _constant_equals = _interopRequireDefault(require("../helpers/constant_equals.js"));
var _no_cache = _interopRequireDefault(require("../shared/no_cache.js"));
var _selective_body = require("../shared/selective_body.js");
var _epoch_time = _interopRequireDefault(require("../helpers/epoch_time.js"));
var _errors = require("../helpers/errors.js");
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var _set_www_authenticate = _interopRequireDefault(require("../helpers/set_www_authenticate.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const FORBIDDEN = ['registration_access_token', 'registration_client_uri', 'client_secret_expires_at', 'client_id_issued_at'];
async function setWWWAuthenticateHeader(ctx, next) {
  try {
    await next();
  } catch (err) {
    if (err.expose) {
      (0, _set_www_authenticate.default)(ctx, 'Bearer', {
        realm: ctx.oidc.issuer,
        ...(err.error_description !== 'no access token provided' ? {
          error: err.message,
          error_description: err.error_description
        } : undefined)
      });
    }
    throw err;
  }
}
const validateRegistrationAccessToken = [setWWWAuthenticateHeader, async function validateRegistrationAccessToken(ctx, next) {
  const regAccessToken = await ctx.oidc.provider.RegistrationAccessToken.find(ctx.oidc.getAccessToken());
  ctx.assert(regAccessToken, new _errors.InvalidToken('token not found'));
  const client = await ctx.oidc.provider.Client.find(ctx.params.clientId);
  if (!client || client.clientId !== regAccessToken.clientId) {
    await regAccessToken.destroy();
    throw new _errors.InvalidToken('client mismatch');
  }
  ctx.oidc.entity('Client', client);
  ctx.oidc.entity('RegistrationAccessToken', regAccessToken);
  await next();
}];
const post = exports.post = [_no_cache.default, setWWWAuthenticateHeader, _selective_body.json, async function validateInitialAccessToken(ctx, next) {
  const {
    oidc: {
      provider
    }
  } = ctx;
  const {
    initialAccessToken
  } = (0, _weak_cache.default)(provider).configuration('features.registration');
  switch (initialAccessToken && typeof initialAccessToken) {
    case 'boolean':
      {
        const iat = await provider.InitialAccessToken.find(ctx.oidc.getAccessToken());
        ctx.assert(iat, new _errors.InvalidToken('initial access token not found'));
        ctx.oidc.entity('InitialAccessToken', iat);
        break;
      }
    case 'string':
      {
        const valid = (0, _constant_equals.default)(initialAccessToken, ctx.oidc.getAccessToken(), 1000);
        ctx.assert(valid, new _errors.InvalidToken('invalid initial access token value'));
        break;
      }
    default:
  }
  await next();
}, async function registrationResponse(ctx, next) {
  const {
    oidc: {
      provider
    }
  } = ctx;
  const {
    idFactory,
    secretFactory,
    issueRegistrationAccessToken
  } = (0, _weak_cache.default)(provider).configuration('features.registration');
  const properties = {};
  const clientId = idFactory(ctx);
  let rat;
  if (issueRegistrationAccessToken === true || typeof issueRegistrationAccessToken === 'function' && issueRegistrationAccessToken(ctx)) {
    rat = new provider.RegistrationAccessToken({
      clientId
    });
    ctx.oidc.entity('RegistrationAccessToken', rat);
  }
  Object.assign(properties, ctx.oidc.body, {
    client_id: clientId,
    client_id_issued_at: (0, _epoch_time.default)()
  });
  const {
    Client
  } = provider;
  const secretRequired = Client.needsSecret(properties);
  if (secretRequired) {
    Object.assign(properties, {
      client_secret: await secretFactory(ctx),
      client_secret_expires_at: 0
    });
  } else {
    delete properties.client_secret;
    delete properties.client_secret_expires_at;
  }
  if (ctx.oidc.entities.InitialAccessToken?.policies) {
    const {
      policies
    } = ctx.oidc.entities.InitialAccessToken;
    const implementations = (0, _weak_cache.default)(provider).configuration('features.registration.policies');
    for (const policy of policies) {
      await implementations[policy](ctx, properties); // eslint-disable-line no-await-in-loop
    }
    if (rat && !('policies' in rat)) {
      rat.policies = policies;
    }
  }
  const client = await (0, _weak_cache.default)(provider).clientAdd(properties, {
    store: true,
    ctx
  });
  ctx.oidc.entity('Client', client);
  ctx.body = client.metadata();
  if (rat) {
    Object.assign(ctx.body, {
      registration_client_uri: ctx.oidc.urlFor('client', {
        clientId: properties.client_id
      }),
      registration_access_token: await rat.save()
    });
  }
  ctx.status = 201;
  provider.emit('registration_create.success', ctx, client);
  await next();
}];
const get = exports.get = [_no_cache.default, ...validateRegistrationAccessToken, async function clientReadResponse(ctx, next) {
  if (ctx.oidc.client.noManage) {
    throw new _errors.InvalidRequest('client does not have permission to read its record', 403);
  }
  ctx.body = ctx.oidc.client.metadata();
  Object.assign(ctx.body, {
    registration_access_token: ctx.oidc.getAccessToken(),
    registration_client_uri: ctx.oidc.urlFor('client', {
      clientId: ctx.params.clientId
    })
  });
  await next();
}];
const put = exports.put = [_no_cache.default, ...validateRegistrationAccessToken, _selective_body.json, async function forbiddenFields(ctx, next) {
  const hit = FORBIDDEN.find(field => ctx.oidc.body[field] !== undefined);
  ctx.assert(!hit, new _errors.InvalidRequest(`request MUST NOT include the ${hit} field`));
  await next();
}, async function equalChecks(ctx, next) {
  ctx.assert(ctx.oidc.body.client_id === ctx.oidc.client.clientId, new _errors.InvalidRequest('provided client_id does not match the authenticated client\'s one'));
  if ('client_secret' in ctx.oidc.body) {
    const clientSecretValid = (0, _constant_equals.default)(typeof ctx.oidc.body.client_secret === 'string' ? ctx.oidc.body.client_secret : '', ctx.oidc.client.clientSecret || '', 1000);
    ctx.assert(clientSecretValid, new _errors.InvalidRequest('provided client_secret does not match the authenticated client\'s one'));
  }
  await next();
}, async function clientUpdateResponse(ctx, next) {
  if (ctx.oidc.client.noManage) {
    throw new _errors.InvalidRequest('client does not have permission to update its record', 403);
  }
  const properties = (0, _omit_by.default)({
    client_id: ctx.oidc.client.clientId,
    client_id_issued_at: ctx.oidc.client.clientIdIssuedAt,
    ...ctx.oidc.body
  }, value => value === null || value === '');
  const {
    oidc: {
      provider
    }
  } = ctx;
  const {
    secretFactory
  } = (0, _weak_cache.default)(provider).configuration('features.registration');
  const secretRequired = !ctx.oidc.client.clientSecret && provider.Client.needsSecret(properties);
  if (secretRequired) {
    Object.assign(properties, {
      client_secret: await secretFactory(ctx),
      client_secret_expires_at: 0
    });
  } else {
    Object.assign(properties, {
      client_secret: ctx.oidc.client.clientSecret,
      client_secret_expires_at: ctx.oidc.client.clientSecretExpiresAt
    });
  }
  if (ctx.oidc.entities.RegistrationAccessToken.policies) {
    const {
      policies
    } = ctx.oidc.entities.RegistrationAccessToken;
    const implementations = (0, _weak_cache.default)(provider).configuration('features.registration.policies');
    for (const policy of policies) {
      await implementations[policy](ctx, properties); // eslint-disable-line no-await-in-loop
    }
  }
  const client = await (0, _weak_cache.default)(provider).clientAdd(properties, {
    store: true,
    ctx
  });
  ctx.body = client.metadata();
  Object.assign(ctx.body, {
    registration_access_token: ctx.oidc.getAccessToken(),
    registration_client_uri: ctx.oidc.urlFor('client', {
      clientId: ctx.params.clientId
    })
  });
  const management = (0, _weak_cache.default)(provider).configuration('features.registrationManagement');
  if (management.rotateRegistrationAccessToken === true || typeof management.rotateRegistrationAccessToken === 'function' && (await management.rotateRegistrationAccessToken(ctx))) {
    ctx.oidc.entity('RotatedRegistrationAccessToken', ctx.oidc.entities.RegistrationAccessToken);
    const rat = new provider.RegistrationAccessToken({
      client: ctx.oidc.client,
      policies: ctx.oidc.entities.RegistrationAccessToken.policies
    });
    await ctx.oidc.registrationAccessToken.destroy();
    ctx.oidc.entity('RegistrationAccessToken', rat);
    ctx.body.registration_access_token = await rat.save();
  }
  provider.emit('registration_update.success', ctx, ctx.oidc.client);
  await next();
}];
const del = exports.del = [_no_cache.default, ...validateRegistrationAccessToken, async function clientRemoveResponse(ctx, next) {
  if (ctx.oidc.client.noManage) {
    throw new _errors.InvalidRequest('client does not have permission to delete its record', 403);
  }
  const {
    oidc: {
      provider
    }
  } = ctx;
  await (0, _weak_cache.default)(provider).clientRemove(ctx.oidc.client.clientId);
  await ctx.oidc.entities.RegistrationAccessToken.destroy();
  ctx.status = 204;
  provider.emit('registration_delete.success', ctx, ctx.oidc.client);
  await next();
}];