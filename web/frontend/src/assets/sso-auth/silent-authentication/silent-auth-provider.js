'use strict';
var __assign = (this && this.__assign) || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
        t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
Object.defineProperty(exports, '__esModule', {value: true});
var appauth_1 = require('@openid/appauth');
var nonce_utils_1 = require('../utils/nonce.utils');
var types_1 = require('./types');
var SilentAuthProvider = (function () {
  function SilentAuthProvider(params) {
    this.timeout = 60 * 1000;
    this.messageType = 'message';
    this.bindedIframeResponseHandler = this.iframeResponseHandler.bind(this);
    this.timeoutError = Object.freeze({
      error: 'timeout',
      error_description: 'timeout',
    });
    this.flow = params.flow;
    this.clientId = params.clientId;
    this.scope = params.scope;
    this.redirectUrl = params.redirectUrl;
    this.authorizationServiceConfig = params.authorizationServiceConfig;
    this.extraAuthParams = params.extraAuthParams;
    this.failureCallback = params.failureCallback;
    this.callback = params.callback;
    this.requestor = params.requestor;
    this.prompt = params.prompt;
    if (params.timeout != null && !isNaN(params.timeout)) {
      this.timeout = params.timeout;
    }
  }
  
  Object.defineProperty(SilentAuthProvider.prototype, 'authorizationEndPointUrl', {
    get: function () {
      return this.authorizationServiceConfig.authorizationEndpoint;
    },
    enumerable: true,
    configurable: true,
  });
  SilentAuthProvider.prototype.getToken = function () {
    this.iFrame = this.createIFrame();
    this.iFrame.src = this.buildUrl();
    this.timeoutId = this.setAuthWaitingTimeout();
  };
  SilentAuthProvider.prototype.createIFrame = function () {
    var iframe = window.document.createElement('iframe');
    iframe.style.display = 'none';
    window.addEventListener(this.messageType, this.bindedIframeResponseHandler, false);
    window.document.body.appendChild(iframe);
    return iframe;
  };
  SilentAuthProvider.prototype.buildUrl = function () {
    var responseType = this.getResponseType();
    var parameters = {
      response_type: responseType,
      prompt: this.prompt || 'none',
      client_id: this.clientId,
      scope: this.scope,
      redirect_uri: this.redirectUrl,
      nonce: nonce_utils_1.makeNonce(),
      state: nonce_utils_1.makeNonce(),
    };
    parameters = __assign({}, parameters, this.extraAuthParams);
    var paramsStr = Object.keys(parameters)
      .map(function (key) { return encodeURIComponent(key) + '=' + encodeURIComponent(parameters[key]); })
      .join('&');
    return this.authorizationEndPointUrl + '?' + paramsStr;
  };
  SilentAuthProvider.prototype.getResponseType = function () {
    return this.flow === types_1.AuthFlow.CODE ? 'code' : 'token id_token';
  };
  SilentAuthProvider.prototype.setAuthWaitingTimeout = function () {
    return window.setTimeout(this.onTimeout.bind(this), this.timeout);
  };
  SilentAuthProvider.prototype.onTimeout = function () {
    this.destroy();
    if (this.failureCallback != null) {
      this.failureCallback(this.timeoutError);
    }
  };
  SilentAuthProvider.prototype.iframeResponseHandler = function (event) {
    if (!this.isValidMessage(event)) {
      return;
    }
    this.destroy();
    var msgBody = this.getMessageBody(event);
    if (this.isErrorMsg(msgBody)) {
      this.failureCallback(msgBody);
      return;
    }
    this.continueAuthByFlow(msgBody);
  };
  SilentAuthProvider.prototype.isValidMessage = function (event) {
    return event.data.type === 'authorization_response';
  };
  SilentAuthProvider.prototype.getMessageBody = function (event) {
    return event.data.response;
  };
  SilentAuthProvider.prototype.isErrorMsg = function (body) {
    return body.error != null;
  };
  SilentAuthProvider.prototype.continueAuthByFlow = function (msgBody) {
    if (this.flow === types_1.AuthFlow.IMPLICIT) {
      this.continueImplicitFlowAuth(msgBody);
    } else if (this.flow === types_1.AuthFlow.CODE) {
      this.continueCodeFlowAuth(msgBody);
    }
  };
  SilentAuthProvider.prototype.continueImplicitFlowAuth = function (msgBody) {
    var tokenResponse = new appauth_1.TokenResponse(msgBody);
    this.callback(tokenResponse);
  };
  SilentAuthProvider.prototype.continueCodeFlowAuth = function (msgBody) {
    var tokenRequest = new appauth_1.TokenRequest({
      client_id: this.clientId,
      redirect_uri: this.redirectUrl,
      grant_type: appauth_1.GRANT_TYPE_AUTHORIZATION_CODE,
      code: msgBody.code,
      refresh_token: undefined,
    });
    var tokenHandler = new appauth_1.BaseTokenRequestHandler(this.requestor);
    tokenHandler.performTokenRequest(this.authorizationServiceConfig, tokenRequest)
      .then(this.callback)
      .catch(this.failureCallback);
  };
  SilentAuthProvider.prototype.destroy = function () {
    clearTimeout(this.timeoutId);
    window.removeEventListener(this.messageType, this.bindedIframeResponseHandler, false);
    if (this.iFrame.parentNode) {
      this.iFrame.parentNode.removeChild(this.iFrame);
    }
  };
  return SilentAuthProvider;
}());
exports.SilentAuthProvider = SilentAuthProvider;
