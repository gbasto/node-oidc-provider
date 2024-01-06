"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = authorizationAction;
var _no_cache = _interopRequireDefault(require("../../shared/no_cache.js"));
var _conditional_body = _interopRequireDefault(require("../../shared/conditional_body.js"));
var _reject_dupes = _interopRequireDefault(require("../../shared/reject_dupes.js"));
var _assemble_params = _interopRequireDefault(require("../../shared/assemble_params.js"));
var _session = _interopRequireDefault(require("../../shared/session.js"));
var _weak_cache = _interopRequireDefault(require("../../helpers/weak_cache.js"));
var _index = require("../../consts/index.js");
var _check_resource = _interopRequireDefault(require("../../shared/check_resource.js"));
var _token_auth = _interopRequireDefault(require("../../shared/token_auth.js"));
var _check_client = _interopRequireDefault(require("./check_client.js"));
var _check_response_mode = _interopRequireDefault(require("./check_response_mode.js"));
var _reject_unsupported = _interopRequireDefault(require("./reject_unsupported.js"));
var _reject_registration = _interopRequireDefault(require("./reject_registration.js"));
var _oauth_required = _interopRequireDefault(require("./oauth_required.js"));
var _one_redirect_uri_clients = _interopRequireDefault(require("./one_redirect_uri_clients.js"));
var _fetch_request_uri = _interopRequireDefault(require("./fetch_request_uri.js"));
var _process_request_object = _interopRequireDefault(require("./process_request_object.js"));
var _oidc_required = _interopRequireDefault(require("./oidc_required.js"));
var _ciba_required = _interopRequireDefault(require("./ciba_required.js"));
var _check_prompt = _interopRequireDefault(require("./check_prompt.js"));
var _check_max_age = _interopRequireDefault(require("./check_max_age.js"));
var _check_id_token_hint = _interopRequireDefault(require("./check_id_token_hint.js"));
var _check_scope = _interopRequireDefault(require("./check_scope.js"));
var _check_response_type = _interopRequireDefault(require("./check_response_type.js"));
var _check_redirect_uri = _interopRequireDefault(require("./check_redirect_uri.js"));
var _check_web_message_uri = _interopRequireDefault(require("./check_web_message_uri.js"));
var _assign_defaults = _interopRequireDefault(require("./assign_defaults.js"));
var _check_claims = _interopRequireDefault(require("./check_claims.js"));
var _assign_claims = _interopRequireDefault(require("./assign_claims.js"));
var _load_account = _interopRequireDefault(require("./load_account.js"));
var _load_grant = _interopRequireDefault(require("./load_grant.js"));
var _interactions = _interopRequireDefault(require("./interactions.js"));
var _respond = _interopRequireDefault(require("./respond.js"));
var _check_pkce = _interopRequireDefault(require("./check_pkce.js"));
var _process_response_types = _interopRequireDefault(require("./process_response_types.js"));
var _interaction_emit = _interopRequireDefault(require("./interaction_emit.js"));
var _resume = _interopRequireDefault(require("./resume.js"));
var _check_client_grant_type = _interopRequireDefault(require("./check_client_grant_type.js"));
var _check_openid_scope = _interopRequireDefault(require("./check_openid_scope.js"));
var _device_authorization_response = _interopRequireDefault(require("./device_authorization_response.js"));
var _authenticated_client_id = _interopRequireDefault(require("./authenticated_client_id.js"));
var _device_user_flow = _interopRequireDefault(require("./device_user_flow.js"));
var _device_user_flow_errors = _interopRequireDefault(require("./device_user_flow_errors.js"));
var _device_user_flow_response = _interopRequireDefault(require("./device_user_flow_response.js"));
var _pushed_authorization_request_remap_errors = _interopRequireDefault(require("./pushed_authorization_request_remap_errors.js"));
var _backchannel_request_remap_errors = _interopRequireDefault(require("./backchannel_request_remap_errors.js"));
var _strip_outside_jar_params = _interopRequireDefault(require("./strip_outside_jar_params.js"));
var _pushed_authorization_request_response = _interopRequireDefault(require("./pushed_authorization_request_response.js"));
var _ciba_load_account = _interopRequireDefault(require("./ciba_load_account.js"));
var _check_requested_expiry = _interopRequireDefault(require("./check_requested_expiry.js"));
var _backchannel_request_response = _interopRequireDefault(require("./backchannel_request_response.js"));
var _check_ciba_context = _interopRequireDefault(require("./check_ciba_context.js"));
var _check_dpop_jkt = _interopRequireDefault(require("./check_dpop_jkt.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const A = 'authorization';
const R = 'resume';
const DA = 'device_authorization';
const CV = 'code_verification';
const DR = 'device_resume';
const PAR = 'pushed_authorization_request';
const BA = 'backchannel_authentication';
const authRequired = new Set([DA, PAR, BA]);
const parseBody = _conditional_body.default.bind(undefined, 'application/x-www-form-urlencoded');
function authorizationAction(provider, endpoint) {
  const {
    features: {
      claimsParameter,
      dPoP,
      resourceIndicators,
      webMessageResponseMode
    },
    extraParams
  } = (0, _weak_cache.default)(provider).configuration();
  const allowList = new Set(_index.PARAM_LIST);
  if (webMessageResponseMode.enabled) {
    allowList.add('web_message_uri');
    allowList.add('web_message_target');
  }
  if (claimsParameter.enabled) {
    allowList.add('claims');
  }
  let rejectDupesMiddleware = _reject_dupes.default.bind(undefined, {});
  if (resourceIndicators.enabled) {
    allowList.add('resource');
    rejectDupesMiddleware = _reject_dupes.default.bind(undefined, {
      except: new Set(['resource'])
    });
  }
  extraParams.forEach(Set.prototype.add.bind(allowList));
  if ([DA, CV, DR, BA].includes(endpoint)) {
    allowList.delete('web_message_uri');
    allowList.delete('web_message_target');
    allowList.delete('response_type');
    allowList.delete('response_mode');
    allowList.delete('code_challenge_method');
    allowList.delete('code_challenge');
    allowList.delete('state');
    allowList.delete('redirect_uri');
    allowList.delete('prompt');
  }
  if (endpoint === BA) {
    allowList.add('client_notification_token');
    allowList.add('login_hint_token');
    allowList.add('binding_message');
    allowList.add('user_code');
    allowList.add('request_context');
    allowList.add('requested_expiry');
  }
  if (dPoP && [A, R, PAR].includes(endpoint)) {
    allowList.add('dpop_jkt');
  }
  const stack = [];
  const use = (middleware, ...only) => {
    if (only.includes(endpoint)) {
      stack.push(middleware());
    }
  };
  const returnTo = /^(code|device)_/.test(endpoint) ? 'device_resume' : 'resume';

  /* eslint-disable no-multi-spaces, space-in-parens, function-paren-newline */
  use(() => _no_cache.default, A, DA, R, CV, DR, PAR, BA);
  use(() => _session.default, A, R, DR);
  use(() => _device_user_flow_errors.default, CV, DR);
  use(() => _resume.default.bind(undefined, allowList, returnTo), R, DR);
  use(() => _device_user_flow.default.bind(undefined, allowList), CV, DR);
  use(() => parseBody, A, DA, PAR, BA);
  if (authRequired.has(endpoint)) {
    const {
      params: authParams,
      middleware: tokenAuth
    } = (0, _token_auth.default)(provider);
    use(() => _assemble_params.default.bind(undefined, authParams), DA, PAR, BA);
    tokenAuth.forEach(tokenAuthMiddleware => {
      use(() => tokenAuthMiddleware, DA, PAR, BA);
    });
  }
  use(() => _authenticated_client_id.default, DA, BA);
  use(() => _assemble_params.default.bind(undefined, allowList), A, DA, PAR, BA);
  use(() => rejectDupesMiddleware, A, DA, PAR, BA);
  use(() => _reject_unsupported.default, A, DA, PAR, BA);
  use(() => _strip_outside_jar_params.default, PAR, BA);
  use(() => _check_client.default, A, DA, R, CV, DR);
  use(() => _check_client_grant_type.default, DA, BA);
  use(() => _check_response_mode.default, A, PAR);
  use(() => _pushed_authorization_request_remap_errors.default, PAR);
  use(() => _backchannel_request_remap_errors.default, BA);
  use(() => _fetch_request_uri.default, A);
  use(() => _process_request_object.default.bind(undefined, allowList, rejectDupesMiddleware), A, DA, PAR, BA);
  use(() => _one_redirect_uri_clients.default, A, PAR);
  use(() => _oauth_required.default, A, PAR);
  use(() => _reject_registration.default, A, DA, PAR, BA);
  use(() => _check_response_type.default, A, PAR);
  use(() => _oidc_required.default, A, PAR);
  use(() => _ciba_required.default, BA);
  use(() => _assign_defaults.default, A, DA, BA);
  use(() => _check_prompt.default, A, PAR);
  use(() => _check_resource.default, A, DA, R, CV, DR, PAR, BA);
  use(() => _check_scope.default.bind(undefined, allowList), A, DA, PAR, BA);
  use(() => _check_openid_scope.default.bind(undefined, allowList), A, DA, PAR, BA);
  use(() => _check_redirect_uri.default, A, PAR);
  use(() => _check_web_message_uri.default, A, PAR);
  use(() => _check_pkce.default, A, PAR);
  use(() => _check_claims.default, A, DA, PAR, BA);
  use(() => _check_max_age.default, A, DA, PAR, BA);
  use(() => _check_requested_expiry.default, BA);
  use(() => _check_ciba_context.default, BA);
  use(() => _check_id_token_hint.default, A, DA, PAR);
  use(() => _check_dpop_jkt.default, PAR);
  use(() => _interaction_emit.default, A, R, CV, DR);
  use(() => _assign_claims.default, A, R, CV, DR, BA);
  use(() => _ciba_load_account.default, BA);
  use(() => _load_account.default, A, R, CV, DR);
  use(() => _load_grant.default, A, R, CV, DR);
  use(() => _interactions.default.bind(undefined, returnTo), A, R, CV, DR);
  use(() => _respond.default, A, R);
  use(() => _process_response_types.default, A, R);
  use(() => _device_authorization_response.default, DA);
  use(() => _device_user_flow_response.default, CV, DR);
  use(() => _pushed_authorization_request_response.default, PAR);
  use(() => _backchannel_request_response.default, BA);
  /* eslint-enable no-multi-spaces, space-in-parens, function-paren-newline */

  return stack;
}