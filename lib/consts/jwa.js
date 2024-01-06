"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.userinfoSigningAlgValues = exports.userinfoEncryptionEncValues = exports.userinfoEncryptionAlgValues = exports.requestObjectSigningAlgValues = exports.requestObjectEncryptionEncValues = exports.requestObjectEncryptionAlgValues = exports.introspectionSigningAlgValues = exports.introspectionEncryptionEncValues = exports.introspectionEncryptionAlgValues = exports.idTokenSigningAlgValues = exports.idTokenEncryptionEncValues = exports.idTokenEncryptionAlgValues = exports.dPoPSigningAlgValues = exports.clientAuthSigningAlgValues = exports.authorizationSigningAlgValues = exports.authorizationEncryptionEncValues = exports.authorizationEncryptionAlgValues = void 0;
const signingAlgValues = ['HS256', 'HS384', 'HS512', 'RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512', 'ES256', 'ES256K', 'ES384', 'ES512', 'EdDSA'];
const encryptionAlgValues = [
// asymmetric
'RSA-OAEP', 'RSA-OAEP-256', 'RSA-OAEP-384', 'RSA-OAEP-512', 'ECDH-ES', 'ECDH-ES+A128KW', 'ECDH-ES+A192KW', 'ECDH-ES+A256KW',
// symmetric
'A128GCMKW', 'A192GCMKW', 'A256GCMKW', 'A128KW', 'A192KW', 'A256KW',
// direct
'dir'];
const encryptionEncValues = ['A128CBC-HS256', 'A128GCM', 'A192CBC-HS384', 'A192GCM', 'A256CBC-HS512', 'A256GCM'];
const clientAuthSigningAlgValues = exports.clientAuthSigningAlgValues = [...signingAlgValues];
const idTokenSigningAlgValues = exports.idTokenSigningAlgValues = [...signingAlgValues];
const requestObjectSigningAlgValues = exports.requestObjectSigningAlgValues = [...signingAlgValues];
const userinfoSigningAlgValues = exports.userinfoSigningAlgValues = [...signingAlgValues];
const introspectionSigningAlgValues = exports.introspectionSigningAlgValues = [...signingAlgValues];
const authorizationSigningAlgValues = exports.authorizationSigningAlgValues = [...signingAlgValues];
const idTokenEncryptionAlgValues = exports.idTokenEncryptionAlgValues = [...encryptionAlgValues];
const requestObjectEncryptionAlgValues = exports.requestObjectEncryptionAlgValues = [...encryptionAlgValues];
const userinfoEncryptionAlgValues = exports.userinfoEncryptionAlgValues = [...encryptionAlgValues];
const introspectionEncryptionAlgValues = exports.introspectionEncryptionAlgValues = [...encryptionAlgValues];
const authorizationEncryptionAlgValues = exports.authorizationEncryptionAlgValues = [...encryptionAlgValues];
const idTokenEncryptionEncValues = exports.idTokenEncryptionEncValues = [...encryptionEncValues];
const requestObjectEncryptionEncValues = exports.requestObjectEncryptionEncValues = [...encryptionEncValues];
const userinfoEncryptionEncValues = exports.userinfoEncryptionEncValues = [...encryptionEncValues];
const introspectionEncryptionEncValues = exports.introspectionEncryptionEncValues = [...encryptionEncValues];
const authorizationEncryptionEncValues = exports.authorizationEncryptionEncValues = [...encryptionEncValues];
const dPoPSigningAlgValues = exports.dPoPSigningAlgValues = [...signingAlgValues].filter(alg => !alg.startsWith('HS'));