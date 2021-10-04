'use strict';
Object.defineProperty(exports, '__esModule', {value: true});

function makeNonce() {
  return makeRandomString(32);
}

exports.makeNonce = makeNonce;

function makeRandomString(length) {
  var bytes = new Uint8Array(length);
  var result = [];
  var charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~';
  var cryptoObj = window.crypto;
  if (!cryptoObj) {
    return null;
  }
  var random = cryptoObj.getRandomValues(bytes);
  for (var a = 0; a < random.length; a++) {
    result.push(charset[random[a] % charset.length]);
  }
  return result.join('');
}

exports.makeRandomString = makeRandomString;
