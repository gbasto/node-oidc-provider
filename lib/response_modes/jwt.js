"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = jwtResponseModes;
var _query = _interopRequireDefault(require("./query.js"));
var _fragment = _interopRequireDefault(require("./fragment.js"));
var _form_post = _interopRequireDefault(require("./form_post.js"));
var _web_message = _interopRequireDefault(require("./web_message.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable camelcase */

const modes = {
  query: _query.default,
  fragment: _fragment.default,
  form_post: _form_post.default,
  web_message: _web_message.default
};
const RENDER_MODES = new Set(['form_post', 'web_message']);
async function jwtResponseModes(ctx, redirectUri, payload) {
  const {
    params
  } = ctx.oidc;
  let mode;
  if (params.response_mode === 'jwt') {
    if (typeof params.response_type === 'string' && params.response_type.includes('token')) {
      mode = 'fragment';
    } else {
      mode = 'query';
    }
  } else {
    [mode] = params.response_mode.split('.');
  }
  const {
    IdToken
  } = this;
  const token = new IdToken({}, {
    ctx
  });
  token.extra = payload;
  const response = await token.issue({
    use: 'authorization'
  });
  if (RENDER_MODES.has(mode)) {
    if ('error' in payload && payload.error !== 'server_error') {
      ctx.status = 400;
    }
  }
  return modes[mode](ctx, redirectUri, {
    response
  });
}