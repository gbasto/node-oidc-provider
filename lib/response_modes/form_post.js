"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = formPost;
var _html_safe = _interopRequireDefault(require("../helpers/html_safe.js"));
var _script_src_sha = _interopRequireDefault(require("../helpers/script_src_sha.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const statusCodes = new Set([200, 400, 500]);
function formPost(ctx, action, inputs) {
  ctx.type = 'html';
  if (!statusCodes.has(ctx.status)) {
    ctx.status = 'error' in inputs ? 400 : 200;
  }
  const formInputs = Object.entries(inputs).map(([key, value]) => `<input type="hidden" name="${key}" value="${(0, _html_safe.default)(value)}"/>`).join('\n');
  ctx.body = `<!DOCTYPE html>
<head>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Submitting Callback</title>
  <script>${(0, _script_src_sha.default)(ctx, `
    document.addEventListener('DOMContentLoaded', function () { document.forms[0].submit() });
  `)}</script>
</head>
<body>
  <form method="post" action="${(0, _html_safe.default)(action)}">
    ${formInputs}
    <noscript>
      Your browser does not support JavaScript or you've disabled it.<br/>
      <button autofocus type="submit">Continue</button>
    </noscript>
  </form>
</body>
</html>`;
}