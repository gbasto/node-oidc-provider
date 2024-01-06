"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = loadPushedAuthorizationRequest;
var _index = require("../../consts/index.js");
var _errors = require("../../helpers/errors.js");
async function loadPushedAuthorizationRequest(ctx) {
  const {
    params
  } = ctx.oidc;
  const [, id] = params.request_uri.split(_index.PUSHED_REQUEST_URN);
  const requestObject = await ctx.oidc.provider.PushedAuthorizationRequest.find(id, {
    ignoreExpiration: true
  });
  if (!requestObject || requestObject.isExpired) {
    throw new _errors.InvalidRequestUri('request_uri is invalid or expired');
  }
  ctx.oidc.entity('PushedAuthorizationRequest', requestObject);
  await requestObject.destroy();
  return requestObject;
}