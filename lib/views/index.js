"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.login = exports.layout = exports.interaction = void 0;
var _eta = require("eta");
var _layout = _interopRequireDefault(require("./layout.js"));
var _login = _interopRequireDefault(require("./login.js"));
var _interaction = _interopRequireDefault(require("./interaction.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
let eta;
const interaction = locals => {
  eta ||= new _eta.Eta({
    useWith: true
  });
  return eta.renderString(_interaction.default, locals);
};
exports.interaction = interaction;
const layout = locals => {
  eta ||= new _eta.Eta({
    useWith: true
  });
  return eta.renderString(_layout.default, locals);
};
exports.layout = layout;
const login = locals => {
  eta ||= new _eta.Eta({
    useWith: true
  });
  return eta.renderString(_login.default, locals);
};
exports.login = login;