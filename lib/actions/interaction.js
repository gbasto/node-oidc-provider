"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = devInteractions;
var _nodeAssert = require("node:assert");
var url = _interopRequireWildcard(require("node:url"));
var querystring = _interopRequireWildcard(require("node:querystring"));
var _nodeUtil = require("node:util");
var attention = _interopRequireWildcard(require("../helpers/attention.js"));
var _selective_body = require("../shared/selective_body.js");
var views = _interopRequireWildcard(require("../views/index.js"));
var _weak_cache = _interopRequireDefault(require("../helpers/weak_cache.js"));
var _no_cache = _interopRequireDefault(require("../shared/no_cache.js"));
var _defaults = require("../helpers/defaults.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const {
  interactions: {
    url: defaultInteractionUri
  }
} = _defaults.defaults;
const keys = new Set();
const dbg = obj => querystring.stringify(Object.entries(obj).reduce((acc, [key, value]) => {
  keys.add(key);
  acc[key] = (0, _nodeUtil.inspect)(value, {
    depth: null
  });
  return acc;
}, {}), '<br/>', ': ', {
  encodeURIComponent(value) {
    return keys.has(value) ? `<strong>${value}</strong>` : value;
  }
});
function devInteractions(provider) {
  /* eslint-disable no-multi-str */
  attention.warn('a quick start development-only feature devInteractions is enabled, \
you are expected to disable these interactions and provide your own');
  const configuration = (0, _weak_cache.default)(provider).configuration('interactions');
  if (configuration.url !== defaultInteractionUri) {
    attention.warn('you\'ve configured your own interactions.url but devInteractions are still enabled, \
your configuration is not in effect');
  }
  /* eslint-enable */

  (0, _weak_cache.default)(provider).configuration('interactions').url = async function interactionUrl(ctx, interaction) {
    return url.parse(ctx.oidc.urlFor('interaction', {
      uid: interaction.uid
    })).pathname;
  };
  return {
    render: [_no_cache.default, async function interactionRender(ctx, next) {
      const {
        uid,
        prompt,
        params,
        session
      } = await provider.interactionDetails(ctx.req, ctx.res);
      const client = await provider.Client.find(params.client_id);
      let view;
      let title;
      switch (prompt.name) {
        case 'login':
          view = 'login';
          title = 'Sign-in';
          break;
        case 'consent':
          view = 'interaction';
          title = 'Authorize';
          break;
        default:
          ctx.throw(501, 'not implemented');
      }
      const locals = {
        client,
        uid,
        abortUrl: ctx.oidc.urlFor('abort', {
          uid
        }),
        submitUrl: ctx.oidc.urlFor('submit', {
          uid
        }),
        details: prompt.details,
        prompt: prompt.name,
        params,
        title,
        session: session ? dbg(session) : undefined,
        dbg: {
          params: dbg(params),
          prompt: dbg(prompt)
        }
      };
      locals.body = views[view](locals);
      ctx.type = 'html';
      ctx.body = views.layout(locals);
      await next();
    }],
    abort: [_no_cache.default, function interactionAbort(ctx) {
      const result = {
        error: 'access_denied',
        error_description: 'End-User aborted interaction'
      };
      return provider.interactionFinished(ctx.req, ctx.res, result, {
        mergeWithLastSubmission: false
      });
    }],
    submit: [_no_cache.default, _selective_body.urlencoded, async function interactionSubmit(ctx, next) {
      const {
        prompt: {
          name,
          details
        },
        grantId,
        session,
        params
      } = await provider.interactionDetails(ctx.req, ctx.res);
      switch (ctx.oidc.body.prompt) {
        // eslint-disable-line default-case
        case 'login':
          {
            _nodeAssert.strict.equal(name, 'login');
            await provider.interactionFinished(ctx.req, ctx.res, {
              login: {
                accountId: ctx.oidc.body.login
              }
            }, {
              mergeWithLastSubmission: false
            });
            break;
          }
        case 'consent':
          {
            _nodeAssert.strict.equal(name, 'consent');
            let grant;
            if (grantId) {
              // we'll be modifying existing grant in existing session
              grant = await provider.Grant.find(grantId);
            } else {
              // we're establishing a new grant
              grant = new provider.Grant({
                accountId: session.accountId,
                clientId: params.client_id
              });
            }
            if (details.missingOIDCScope) {
              grant.addOIDCScope(details.missingOIDCScope.join(' '));
            }
            if (details.missingOIDCClaims) {
              grant.addOIDCClaims(details.missingOIDCClaims);
            }
            if (details.missingResourceScopes) {
              for (const [indicator, scope] of Object.entries(details.missingResourceScopes)) {
                grant.addResourceScope(indicator, scope.join(' '));
              }
            }
            const result = {
              consent: {
                grantId: await grant.save()
              }
            };
            await provider.interactionFinished(ctx.req, ctx.res, result, {
              mergeWithLastSubmission: true
            });
            break;
          }
        default:
          ctx.throw(501, 'not implemented');
      }
      await next();
    }]
  };
}