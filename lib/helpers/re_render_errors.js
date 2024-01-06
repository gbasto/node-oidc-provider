"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ReRenderError = exports.NotFoundError = exports.NoCodeError = exports.ExpiredError = exports.AlreadyUsedError = exports.AbortedError = void 0;
/* eslint-disable max-classes-per-file */

class ReRenderError extends Error {
  constructor(message, userCode) {
    super(message);
    if (userCode) this.userCode = userCode;
    this.message = message;
    this.name = this.constructor.name;
    this.status = 200;
    this.statusCode = 200;
    this.expose = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
exports.ReRenderError = ReRenderError;
class NotFoundError extends ReRenderError {
  constructor(userCode) {
    super('the code was not found', userCode);
  }
}
exports.NotFoundError = NotFoundError;
class ExpiredError extends ReRenderError {
  constructor(userCode) {
    super('the code has expired', userCode);
  }
}
exports.ExpiredError = ExpiredError;
class AbortedError extends ReRenderError {
  constructor() {
    super('the interaction was aborted');
  }
}
exports.AbortedError = AbortedError;
class AlreadyUsedError extends ReRenderError {
  constructor(userCode) {
    super('code has already been used', userCode);
  }
}
exports.AlreadyUsedError = AlreadyUsedError;
class NoCodeError extends ReRenderError {
  constructor() {
    super('no code submitted');
  }
}
exports.NoCodeError = NoCodeError;