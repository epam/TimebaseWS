'use strict';

let ws = new WebSocket('ws://localhost:8099/ws/v0/test.stream/select?live=true');
let messages = document.createElement('ul');
ws.onmessage = function (event) {
    let messages = document.getElementsByTagName('ul')[0],
        message = document.createElement('li'),
        content = document.createTextNode(event.data);
    message.appendChild(content);
    messages.appendChild(message);
};
document.body.appendChild(messages);