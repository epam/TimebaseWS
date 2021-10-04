import argparse
import asyncio
import websockets as ws
import requests
import numpy as np
import subprocess
import functools
from threading import Thread
import time
import os
import sys
import struct
import shutil


TEST_DATA = {'messages': '[{"type":"BarMessage","symbol":"AAPL","timestamp":'
                         '"2018-05-11T00:00:00.042Z","close":1.25,"open":1.9,'
                         '"high":1.5,"low":0.5,"volume":10042.0}]'}
WS_JAR_PATH = '\\java\\ws-server\\build\\libs\\deltix-timebase-ws-server-0.2.2.jar'
RUNJAR_PATH = '\\java\\quantserver\\all\\build\\libs\\runjar.jar'
QS_JAR_PATH = '\\lib\\deltix-quantserver-all-5.2.42.jar'
TOMCAT_CMD = 'deltix.qsrv.comm.cat.TomcatCmd'
PYTHON_PASS = 'python\\dxapi'
TEST_STREAM_PATH = '\\tickdb\\bars1mintest'
timebase = 'dxtick://localhost:8011'
if not os.path.isdir('logs'):
    os.makedirs('logs')


def start_qs(qs_cp, qs_home):
    def start_subprocess(qs_cp_, qs_home_):
        with open('logs\\log_qs.txt', 'w') as out:
            subprocess.call(['java', '-jar', qs_cp_ + RUNJAR_PATH, qs_cp_ + QS_JAR_PATH,
                             TOMCAT_CMD, '-tb', '-home', qs_home_], stdout=out, stderr=out)

    test_path = qs_home + TEST_STREAM_PATH
    if os.path.isdir(test_path):
        shutil.rmtree(test_path)

    start_subprocess = functools.partial(start_subprocess, qs_cp_=qs_cp, qs_home_=qs_home)
    qs_thread = Thread(target=start_subprocess)
    qs_thread.start()
    time.sleep(5)
    return qs_thread


def create_stream():
    try:
        db = dxapi.TickDb.createFromUrl(timebase)
        db.open(False)
        print('Connected to ' + timebase)
        with open('qql/bars1min.qql', 'r') as qqlFile:
            barsQQL = qqlFile.read()
        cursor = db.executeQuery(barsQQL)
        try:
            if (cursor.next()):
                message = cursor.getMessage()
                print('Query result: ' + message.messageText)
            else:
                print('Unknown result of query.')
        finally:
            if (cursor != None):
                cursor.close()
    finally:
        if (db.isOpen()):
            db.close()
        print("Connection " + timebase + " closed.")


async def test(debug):
    uri = 'ws://localhost:8099/ws/v0/bars1mintest/select?live=true'
    async with ws.connect(uri) as websocket:
        test_result = []
        for i in range(20):
            if debug:
                print(f'test {i}:')
            temp = {}
            requests.post("http://localhost:8099/api/v0/bars1mintest/write", data=TEST_DATA)
            sent = f"Sent message:\n{TEST_DATA['messages']}"
            if debug:
                print(sent)
            message = await websocket.recv()
            received = f"Received message:\n{message}"
            if debug:
                print(received)
            are_equal = message == TEST_DATA['messages']
            equal = f"Are equal? {are_equal}"
            if debug:
                print(equal, '\n')
            temp['is_ok'] = are_equal
            temp['message'] = '\n'.join([sent, received, equal])
            test_result.append(temp)
        result = [item['is_ok'] for item in test_result]
        if np.all(result):
            print('All tests passed, congrats!')
        else:
            print('Tests failed on positions ', np.where(result is False))


def parse_string(s):
    return True if s == 'True' or s == 'true' else False


def create_parser():
    result = argparse.ArgumentParser()
    result.add_argument('--ws_home',
                        help='Path to WSServer boot-jar.',
                        type=str,
                        default='C:\\Projects\\TimebaseWS',
                        required=False)

    result.add_argument('--QScp',
                        help='Path to Quant Server project.',
                        type=str,
                        default='C:\\Projects\\Deltix\\Branches\\5_2\\QuantServer',
                        required=False)

    result.add_argument('--QShome',
                        help='QS home path.',
                        type=str,
                        default='C:\\Projects\\Deltix\\QS\\Home',
                        required=False)

    result.add_argument('--debug',
                        help='Enables debug output.',
                        type=parse_string,
                        default=False,
                        required=False)
    return result


def start_ws(ws_home):
    def start_server(ws_home_):
        with open('logs\\log_ws.txt', 'w') as out:
            subprocess.call(['java', '-jar', ws_home_ + WS_JAR_PATH], stdout=out, stderr=out)
    start_server = functools.partial(start_server, ws_home_=ws_home)
    ws_thread = Thread(target=start_server)
    ws_thread.start()
    return ws_thread


parser = create_parser()
args = parser.parse_args()

platform = ("linux" if sys.platform.startswith('linux') else "windows")
path = os.path.join(args.QScp, "python\\dxapi",
                    platform, ("py36" if sys.version.startswith("3.") else "py27"),
                    ("x64" if struct.calcsize('P') * 8 == 64 else "x86"))
sys.path.append(path)
import dxapi

print('Test started...')

qs_thread = start_qs(args.QScp, args.QShome)
create_stream()
ws_thread = start_ws(args.ws_home)

time.sleep(10)

loop = asyncio.get_event_loop()
loop.run_until_complete(test(args.debug))
loop.close()