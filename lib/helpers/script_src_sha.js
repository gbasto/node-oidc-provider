"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = pushScriptSrcSha;
var _nodeCrypto = require("node:crypto");
function pushScriptSrcSha(ctx, script) {
  const csp = ctx.response.get('Content-Security-Policy');
  if (csp) {
    const directives = csp.split(';').reduce((acc, directive) => {
      const [name, ...values] = directive.trim().split(/\s+/g);
      acc[name] = values;
      return acc;
    }, {});
    if (directives['script-src']) {
      const digest = (0, _nodeCrypto.createHash)('sha256').update(script).digest('base64');
      directives['script-src'].push(`'sha256-${digest}'`);
      const replaced = Object.entries(directives).map(([name, values]) => [name, ...values].join(' ')).join(';');
      ctx.response.set('Content-Security-Policy', replaced);
    }
  }
  return script;
}