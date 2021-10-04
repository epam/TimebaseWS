'use strict';

const fs = require('fs');
const WebSocket = require('ws')

let messages = 0;
let bytes = 0;


var logger = fs.createWriteStream('log.json', {
    flags: 'a' // 'a' means appending (old data will be preserved)
})

let ts0 = 0;
let ts1 = 0;
let stream = `bars`

let url = `ws://localhost:8099/ws/v0/bars/select`;
let ws = new WebSocket(url);

ws.onopen = () => {
    console.log(`Connected to ${url}`);
    console.log(`Downloading data from ${stream}`);
}
ws.onmessage = (event) => {
    if (messages === 0) {
        ts0 = new Date().getTime();
    }
    //console.log(`got message:` + event.data);
    logger.write(event.data)
    messages++;
    bytes += event.data.length;
};
ws.onclose = () => {        
    console.log(`got messages: ${messages}, bytes: ${bytes}`);
    ts1 = new Date().getTime();
    const s = (ts1 - ts0) * 0.001;
    console.log(`${messages} msg ${s} sec; speed: ${messages / s} msg/s, ${bytes / (1024 * 1024) / s} MB/s`);    
    logger.end()
};
ws.onerror = (e) => console.error(e);
