"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = interactionEmit;
const resumeRoutes = new Set(['resume', 'device_resume']);
function interactionEmit(ctx, next) {
  if (resumeRoutes.has(ctx.oidc.route)) {
    ctx.oidc.provider.emit('interaction.ended', ctx);
  }
  return next();
}