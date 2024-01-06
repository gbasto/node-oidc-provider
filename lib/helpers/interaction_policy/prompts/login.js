"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var errors = _interopRequireWildcard(require("../../errors.js"));
var _get = _interopRequireDefault(require("../../_/get.js"));
var _weak_cache = _interopRequireDefault(require("../../weak_cache.js"));
var _prompt = _interopRequireDefault(require("../prompt.js"));
var _check = _interopRequireDefault(require("../check.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/* eslint-disable camelcase */
var _default = () => new _prompt.default({
  name: 'login',
  requestable: true
}, ctx => {
  const {
    oidc
  } = ctx;
  return {
    ...(oidc.params.max_age === undefined ? undefined : {
      max_age: oidc.params.max_age
    }),
    ...(oidc.params.login_hint === undefined ? undefined : {
      login_hint: oidc.params.login_hint
    }),
    ...(oidc.params.id_token_hint === undefined ? undefined : {
      id_token_hint: oidc.params.id_token_hint
    })
  };
}, new _check.default('no_session', 'End-User authentication is required', ctx => {
  const {
    oidc
  } = ctx;
  if (oidc.session.accountId) {
    return _check.default.NO_NEED_TO_PROMPT;
  }
  return _check.default.REQUEST_PROMPT;
}), new _check.default('max_age', 'End-User authentication could not be obtained', ctx => {
  const {
    oidc
  } = ctx;
  if (oidc.params.max_age === undefined) {
    return _check.default.NO_NEED_TO_PROMPT;
  }
  if (!oidc.session.accountId) {
    return _check.default.REQUEST_PROMPT;
  }
  if (oidc.session.past(oidc.params.max_age) && (!ctx.oidc.result || !ctx.oidc.result.login)) {
    return _check.default.REQUEST_PROMPT;
  }
  return _check.default.NO_NEED_TO_PROMPT;
}), new _check.default('id_token_hint', 'id_token_hint and authenticated subject do not match', async ctx => {
  const {
    oidc
  } = ctx;
  if (oidc.entities.IdTokenHint === undefined) {
    return _check.default.NO_NEED_TO_PROMPT;
  }
  const {
    payload
  } = oidc.entities.IdTokenHint;
  let sub = oidc.session.accountId;
  if (sub === undefined) {
    return _check.default.REQUEST_PROMPT;
  }
  if (oidc.client.subjectType === 'pairwise') {
    sub = await (0, _weak_cache.default)(oidc.provider).configuration('pairwiseIdentifier')(ctx, sub, oidc.client);
  }
  if (payload.sub !== sub) {
    return _check.default.REQUEST_PROMPT;
  }
  return _check.default.NO_NEED_TO_PROMPT;
}), new _check.default('claims_id_token_sub_value', 'requested subject could not be obtained', async ctx => {
  const {
    oidc
  } = ctx;
  if (!oidc.claims.id_token || !oidc.claims.id_token.sub || !('value' in oidc.claims.id_token.sub)) {
    return _check.default.NO_NEED_TO_PROMPT;
  }
  let sub = oidc.session.accountId;
  if (sub === undefined) {
    return _check.default.REQUEST_PROMPT;
  }
  if (oidc.client.subjectType === 'pairwise') {
    sub = await (0, _weak_cache.default)(oidc.provider).configuration('pairwiseIdentifier')(ctx, sub, oidc.client);
  }
  if (oidc.claims.id_token.sub.value !== sub) {
    return _check.default.REQUEST_PROMPT;
  }
  return _check.default.NO_NEED_TO_PROMPT;
}, ({
  oidc
}) => ({
  sub: oidc.claims.id_token.sub
})), new _check.default('essential_acrs', 'none of the requested ACRs could not be obtained', ctx => {
  const {
    oidc
  } = ctx;
  const request = (0, _get.default)(oidc.claims, 'id_token.acr', {});
  if (!request || !request.essential || !request.values) {
    return _check.default.NO_NEED_TO_PROMPT;
  }
  if (!Array.isArray(oidc.claims.id_token.acr.values)) {
    throw new errors.InvalidRequest('invalid claims.id_token.acr.values type');
  }
  if (request.values.includes(oidc.acr)) {
    return _check.default.NO_NEED_TO_PROMPT;
  }
  return _check.default.REQUEST_PROMPT;
}, ({
  oidc
}) => ({
  acr: oidc.claims.id_token.acr
})), new _check.default('essential_acr', 'requested ACR could not be obtained', ctx => {
  const {
    oidc
  } = ctx;
  const request = (0, _get.default)(oidc.claims, 'id_token.acr', {});
  if (!request || !request.essential || !request.value) {
    return _check.default.NO_NEED_TO_PROMPT;
  }
  if (request.value === oidc.acr) {
    return _check.default.NO_NEED_TO_PROMPT;
  }
  return _check.default.REQUEST_PROMPT;
}, ({
  oidc
}) => ({
  acr: oidc.claims.id_token.acr
})));
exports.default = _default;