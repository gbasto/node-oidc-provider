"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = exports.default = `<form autocomplete="off" action="<%= submitUrl %>" method="post">
  <input type="hidden" name="prompt" value="login"/>
  <input required type="text" name="login" placeholder="Enter any login" <% if (!params.login_hint) { %>autofocus="on"<% } else { %> value="<%= params.login_hint %>" <% } %>>
  <input required type="password" name="password" placeholder="and password" <% if (params.login_hint) { %>autofocus="on"<% } %>>

  <button type="submit" class="login login-submit">Sign-in</button>
</form>`;