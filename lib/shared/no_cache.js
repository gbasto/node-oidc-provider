"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = noCache;
async function noCache(ctx, next) {
  ctx.set('cache-control', 'no-store');
  await next();
}