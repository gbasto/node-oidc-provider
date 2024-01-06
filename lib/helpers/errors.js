"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebMessageUriMismatch = exports.UseDpopNonce = exports.UnsupportedResponseType = exports.UnsupportedResponseMode = exports.UnsupportedGrantType = exports.UnmetAuthenticationRequirements = exports.UnknownUserId = exports.UnauthorizedClient = exports.UnapprovedSoftwareStatement = exports.TransactionFailed = exports.TemporarilyUnavailable = exports.SlowDown = exports.SessionNotFound = exports.RequestUriNotSupported = exports.RequestNotSupported = exports.RegistrationNotSupported = exports.OIDCProviderError = exports.MissingUserCode = exports.LoginRequired = exports.InvalidUserCode = exports.InvalidToken = exports.InvalidTarget = exports.InvalidSoftwareStatement = exports.InvalidScope = exports.InvalidRequestUri = exports.InvalidRequestObject = exports.InvalidRequest = exports.InvalidRedirectUri = exports.InvalidGrant = exports.InvalidDpopProof = exports.InvalidClientMetadata = exports.InvalidClientAuth = exports.InvalidClient = exports.InvalidBindingMessage = exports.InteractionRequired = exports.InsufficientScope = exports.ExpiredToken = exports.ExpiredLoginHintToken = exports.CustomOIDCProviderError = exports.ConsentRequired = exports.AuthorizationPending = exports.AccessDenied = void 0;
var _upper_first = _interopRequireDefault(require("./_/upper_first.js"));
var _camel_case = _interopRequireDefault(require("./_/camel_case.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable camelcase */
/* eslint-disable max-classes-per-file */

class OIDCProviderError extends Error {
  allow_redirect = true;
  constructor(status, message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.error = message;
    this.status = status;
    this.statusCode = status;
    this.expose = status < 500;
  }
}
exports.OIDCProviderError = OIDCProviderError;
class CustomOIDCProviderError extends OIDCProviderError {
  constructor(message, description) {
    super(400, message);
    Error.captureStackTrace(this, this.constructor);
    Object.assign(this, {
      error_description: description
    });
  }
}
exports.CustomOIDCProviderError = CustomOIDCProviderError;
class InvalidToken extends OIDCProviderError {
  error_description = 'invalid token provided';
  constructor(detail) {
    super(401, 'invalid_token');
    Error.captureStackTrace(this, this.constructor);
    Object.assign(this, {
      error_detail: detail
    });
  }
}
exports.InvalidToken = InvalidToken;
class InvalidClientMetadata extends OIDCProviderError {
  constructor(description, detail) {
    const message = description.startsWith('redirect_uris') ? 'invalid_redirect_uri' : 'invalid_client_metadata';
    super(400, message);
    Error.captureStackTrace(this, this.constructor);
    Object.assign(this, {
      error_description: description,
      error_detail: detail
    });
  }
}
exports.InvalidClientMetadata = InvalidClientMetadata;
class InvalidScope extends OIDCProviderError {
  constructor(description, scope, detail) {
    super(400, 'invalid_scope');
    Error.captureStackTrace(this, this.constructor);
    Object.assign(this, {
      scope,
      error_description: description,
      error_detail: detail
    });
  }
}
exports.InvalidScope = InvalidScope;
class InsufficientScope extends OIDCProviderError {
  constructor(description, scope, detail) {
    super(403, 'insufficient_scope');
    Error.captureStackTrace(this, this.constructor);
    Object.assign(this, {
      scope,
      error_description: description,
      error_detail: detail
    });
  }
}
exports.InsufficientScope = InsufficientScope;
class InvalidRequest extends OIDCProviderError {
  constructor(description, code, detail) {
    super(code ?? 400, 'invalid_request');
    Error.captureStackTrace(this, this.constructor);
    Object.assign(this, {
      error_description: description || 'request is invalid',
      error_detail: detail,
      expose: true
    });
  }
}
exports.InvalidRequest = InvalidRequest;
class SessionNotFound extends InvalidRequest {}
exports.SessionNotFound = SessionNotFound;
class InvalidClientAuth extends OIDCProviderError {
  error_description = 'client authentication failed';
  constructor(detail) {
    super(401, 'invalid_client');
    Error.captureStackTrace(this, this.constructor);
    Object.assign(this, {
      error_detail: detail
    });
  }
}
exports.InvalidClientAuth = InvalidClientAuth;
class InvalidGrant extends OIDCProviderError {
  error_description = 'grant request is invalid';
  constructor(detail) {
    super(400, 'invalid_grant');
    Error.captureStackTrace(this, this.constructor);
    Object.assign(this, {
      error_detail: detail
    });
  }
}
exports.InvalidGrant = InvalidGrant;
class InvalidRedirectUri extends OIDCProviderError {
  error_description = 'redirect_uri did not match any of the client\'s registered redirect_uris';
  allow_redirect = false;
  constructor() {
    super(400, 'invalid_redirect_uri');
    Error.captureStackTrace(this, this.constructor);
  }
}
exports.InvalidRedirectUri = InvalidRedirectUri;
class WebMessageUriMismatch extends OIDCProviderError {
  error_description = 'web_message_uri did not match any client\'s registered web_message_uris';
  allow_redirect = false;
  constructor() {
    super(400, 'web_message_uri_mismatch');
    Error.captureStackTrace(this, this.constructor);
  }
}
exports.WebMessageUriMismatch = WebMessageUriMismatch;
function E(message, errorDescription) {
  const klassName = (0, _upper_first.default)((0, _camel_case.default)(message));
  const klass = class extends OIDCProviderError {
    error_description = errorDescription;
    constructor(description, detail) {
      super(400, message);
      Error.captureStackTrace(this, this.constructor);
      if (description) {
        this.error_description = description;
      }
      if (detail) {
        this.error_detail = detail;
      }
    }
  };
  Object.defineProperty(klass, 'name', {
    value: klassName
  });
  return klass;
}
const AccessDenied = exports.AccessDenied = E('access_denied');
const AuthorizationPending = exports.AuthorizationPending = E('authorization_pending', 'authorization request is still pending as the end-user hasn\'t yet completed the user interaction steps');
const ConsentRequired = exports.ConsentRequired = E('consent_required');
const ExpiredLoginHintToken = exports.ExpiredLoginHintToken = E('expired_login_hint_token');
const ExpiredToken = exports.ExpiredToken = E('expired_token');
const InteractionRequired = exports.InteractionRequired = E('interaction_required');
const InvalidBindingMessage = exports.InvalidBindingMessage = E('invalid_binding_message');
const InvalidClient = exports.InvalidClient = E('invalid_client');
const InvalidDpopProof = exports.InvalidDpopProof = E('invalid_dpop_proof');
const InvalidRequestObject = exports.InvalidRequestObject = E('invalid_request_object');
const InvalidRequestUri = exports.InvalidRequestUri = E('invalid_request_uri');
const InvalidSoftwareStatement = exports.InvalidSoftwareStatement = E('invalid_software_statement');
const InvalidTarget = exports.InvalidTarget = E('invalid_target', 'resource indicator is missing, or unknown');
const InvalidUserCode = exports.InvalidUserCode = E('invalid_user_code');
const LoginRequired = exports.LoginRequired = E('login_required');
const MissingUserCode = exports.MissingUserCode = E('missing_user_code');
const RegistrationNotSupported = exports.RegistrationNotSupported = E('registration_not_supported', 'registration parameter provided but not supported');
const RequestNotSupported = exports.RequestNotSupported = E('request_not_supported', 'request parameter provided but not supported');
const RequestUriNotSupported = exports.RequestUriNotSupported = E('request_uri_not_supported', 'request_uri parameter provided but not supported');
const SlowDown = exports.SlowDown = E('slow_down', 'you are polling too quickly and should back off at a reasonable rate');
const TemporarilyUnavailable = exports.TemporarilyUnavailable = E('temporarily_unavailable');
const TransactionFailed = exports.TransactionFailed = E('transaction_failed');
const UnapprovedSoftwareStatement = exports.UnapprovedSoftwareStatement = E('unapproved_software_statement');
const UnauthorizedClient = exports.UnauthorizedClient = E('unauthorized_client');
const UnknownUserId = exports.UnknownUserId = E('unknown_user_id');
const UnmetAuthenticationRequirements = exports.UnmetAuthenticationRequirements = E('unmet_authentication_requirements');
const UnsupportedGrantType = exports.UnsupportedGrantType = E('unsupported_grant_type', 'unsupported grant_type requested');
const UnsupportedResponseMode = exports.UnsupportedResponseMode = E('unsupported_response_mode', 'unsupported response_mode requested');
const UnsupportedResponseType = exports.UnsupportedResponseType = E('unsupported_response_type', 'unsupported response_type requested');
const UseDpopNonce = exports.UseDpopNonce = E('use_dpop_nonce');