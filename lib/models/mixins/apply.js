"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = apply;
function apply(mixins) {
  const klass = mixins.pop();
  return mixins.reduce((mixed, mixin) => mixin(mixed), klass);
}