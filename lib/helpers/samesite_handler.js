"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.get = get;
exports.set = set;
function get(cookies, name, opts) {
  let value = cookies.get(name, opts);
  if (value === undefined && opts && /none/i.test(opts.sameSite)) {
    value = cookies.get(`${name}.legacy`, opts);
  }
  return value;
}
function set(cookies, name, value, opts) {
  cookies.set(name, value, opts);
  if (opts && /none/i.test(opts.sameSite)) {
    const {
      sameSite,
      ...noSS
    } = opts;
    cookies.set(`${name}.legacy`, value, noSS);
  }
}