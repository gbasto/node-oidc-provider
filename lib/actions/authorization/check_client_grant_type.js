"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkClientGrantType;
var _errors = require("../../helpers/errors.js");
function checkClientGrantType({
  oidc: {
    route,
    client
  }
}, next) {
  let grantType;
  switch (route) {
    case 'device_authorization':
      grantType = 'urn:ietf:params:oauth:grant-type:device_code';
      break;
    case 'backchannel_authentication':
      grantType = 'urn:openid:params:grant-type:ciba';
      break;
    default:
      throw new Error('not implemented');
  }
  if (!client.grantTypeAllowed(grantType)) {
    throw new _errors.UnauthorizedClient(`${grantType} is not allowed for this client`);
  }
  return next();
}