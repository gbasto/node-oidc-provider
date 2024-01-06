"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const hasPrototype = target => target.prototype !== null && typeof target.prototype === 'object';
const isContructor = fn => fn.constructor instanceof Function && fn.constructor.name !== undefined;
var _default = constructable => constructable instanceof Function && hasPrototype(constructable) && isContructor(constructable.constructor);
exports.default = _default;