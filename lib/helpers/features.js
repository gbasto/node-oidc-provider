"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.STABLE = exports.DRAFTS = void 0;
const STABLE = exports.STABLE = new Set(['backchannelLogout', 'ciba', 'claimsParameter', 'clientCredentials', 'deviceFlow', 'devInteractions', 'dPoP', 'encryption', 'fapi', 'introspection', 'jwtResponseModes', 'jwtUserinfo', 'mTLS', 'pushedAuthorizationRequests', 'registration', 'registrationManagement', 'requestObjects', 'resourceIndicators', 'revocation', 'rpInitiatedLogout', 'userinfo']);
const DRAFTS = exports.DRAFTS = new Map(Object.entries({
  jwtIntrospection: {
    name: 'JWT Response for OAuth Token Introspection - draft 10',
    type: 'IETF OAuth Working Group draft',
    url: 'https://tools.ietf.org/html/draft-ietf-oauth-jwt-introspection-response-10',
    version: ['draft-09', 'draft-10']
  },
  webMessageResponseMode: {
    name: 'OAuth 2.0 Web Message Response Mode - draft 00',
    type: 'Individual draft',
    url: 'https://tools.ietf.org/html/draft-sakimura-oauth-wmrm-00',
    version: [0, 'id-00', 'individual-draft-00']
  }
}));