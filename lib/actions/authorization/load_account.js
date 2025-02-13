"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = loadAccount;
/*
 * Loads the End-User's account referenced by the session.
 */
async function loadAccount(ctx, next) {
  const {
    accountId
  } = ctx.oidc.session;
  if (accountId) {
    const account = await ctx.oidc.provider.Account.findAccount(ctx, accountId);
    ctx.oidc.entity('Account', account);
  }
  return next();
}