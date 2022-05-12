'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
var url_search_params_1 = require('@ungap/url-search-params');

function getRespParameters() {
  var responseParams = (
    window.location.hash === '' ? window.location.search : window.location.hash
  ).substr(1);
  var params = new url_search_params_1.default(responseParams);
  var response = {};
  params.forEach(function (value, key) {
    response[key] = value;
  });
  var expires_in = response['expires_in'];
  if (expires_in != null && !isNaN(expires_in)) {
    response['expires_in'] = +expires_in;
  }
  return response;
}

function makeMsg(parameters) {
  return {
    type: 'authorization_response',
    response: parameters,
  };
}

function getMainWindow() {
  return window.opener ? window.opener : window.parent;
}

var responseParameters = getRespParameters();
var msg = makeMsg(responseParameters);
var mainWin = getMainWindow();
mainWin.postMessage(msg, window.location.origin);
