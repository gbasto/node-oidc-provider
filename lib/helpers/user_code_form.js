"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.confirm = confirm;
exports.input = input;
var _html_safe = _interopRequireDefault(require("./html_safe.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function input(action, csrfToken, code, charset) {
  const attributes = charset === 'digits' ? 'pattern="[0-9]*" inputmode="numeric" ' : '';
  return `<form id="op.deviceInputForm" novalidate method="post" action="${action}">
  <input type="hidden" name="xsrf" value="${csrfToken}"/>
  <input
    ${code ? `value="${(0, _html_safe.default)(code)}" ` : ''}${attributes}type="text" name="user_code" placeholder="Enter code" onfocus="this.select(); this.onfocus = undefined;" autofocus autocomplete="off"></input>
  </form>`;
}
function confirm(action, csrfToken, code) {
  return `<form id="op.deviceConfirmForm" method="post" action="${action}">
<input type="hidden" name="xsrf" value="${csrfToken}"/>
<input type="hidden" name="user_code" value="${(0, _html_safe.default)(code)}"/>
<input type="hidden" name="confirm" value="yes"/>
</form>`;
}