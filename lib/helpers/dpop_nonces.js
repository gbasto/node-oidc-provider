"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _nodeCrypto = require("node:crypto");
var base64url = _interopRequireWildcard(require("./base64url.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/* eslint-disable no-plusplus, no-bitwise, no-param-reassign */

function sixfourbeify(value) {
  const buf = Buffer.alloc(8);
  for (let i = buf.length - 1; i >= 0; i--) {
    buf[i] = value & 0xff;
    value >>= 8;
  }
  return buf;
}
function compute(secret, step) {
  return base64url.encodeBuffer((0, _nodeCrypto.createHmac)('sha256', secret).update(sixfourbeify(step)).digest());
}
function compare(server, client) {
  let result = 0;
  if (server.length !== client.length) {
    result = 1;
    client = server;
  }
  for (let i = 0; i < server.length; i++) {
    result |= server.charCodeAt(i) ^ client.charCodeAt(i);
  }
  return result;
}
const STEP = 60;
class DPoPNonces {
  #counter;
  #secret;
  #prevprev;
  #prev;
  #now;
  #next;
  #nextnext;
  constructor(secret) {
    if (!Buffer.isBuffer(secret) || secret.byteLength !== 32) {
      throw new TypeError('features.dPoP.nonceSecret must be a 32-byte Buffer instance');
    }
    this.#secret = Uint8Array.prototype.slice.call(secret);
    this.#counter = Math.floor(Date.now() / 1000 / STEP);
    [this.#prevprev, this.#prev, this.#now, this.#next, this.#nextnext] = [this.#counter - 2, this.#counter - 1, this.#counter, this.#counter + 1, this.#counter++ + 2].map(compute.bind(undefined, this.#secret));
    setInterval(() => {
      [this.#prevprev, this.#prev, this.#now, this.#next, this.#nextnext] = [this.#prev, this.#now, this.#next, this.#nextnext, compute(this.#secret, this.#counter++ + 2)];
    }, STEP * 1000).unref();
  }
  nextNonce() {
    return this.#next;
  }
  checkNonce(nonce) {
    let result = 0;
    for (const server of [this.#prevprev, this.#prev, this.#now, this.#next, this.#nextnext]) {
      result ^= compare(server, nonce);
    }
    return result === 0;
  }
}
exports.default = DPoPNonces;