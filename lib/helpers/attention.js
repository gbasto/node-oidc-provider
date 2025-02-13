"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.info = info;
exports.warn = warn;
const SET_BOLD_YELLOW_TEXT = '\x1b[33;1m';
const SET_BOLD_RED_TEXT = '\x1b[31;1m';
const RESET_ALL_ATTRIBUTES = '\x1b[0m';
function colorizeStdout(str) {
  if (process.stdout.isTTY) {
    return `${SET_BOLD_YELLOW_TEXT}${str}${RESET_ALL_ATTRIBUTES}`;
  }
  return str;
}
function colorizeStderr(str) {
  if (process.stderr.isTTY) {
    return `${SET_BOLD_RED_TEXT}${str}${RESET_ALL_ATTRIBUTES}`;
  }
  return str;
}
function info(str) {
  console.info(colorizeStdout(`oidc-provider NOTICE: ${str}`)); // eslint-disable-line no-console
}
function warn(str) {
  console.warn(colorizeStderr(`oidc-provider WARNING: ${str}`)); // eslint-disable-line no-console
}