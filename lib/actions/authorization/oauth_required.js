"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = oauthRequired;
var _validate_presence = _interopRequireDefault(require("../../helpers/validate_presence.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/*
 * Validates presence of mandatory OAuth2.0 parameters response_type, client_id and scope.
 *
 * @throws: invalid_request
 */
function oauthRequired(ctx, next) {
  // Validate: required oauth params
  (0, _validate_presence.default)(ctx, 'response_type', 'client_id');
  return next();
}