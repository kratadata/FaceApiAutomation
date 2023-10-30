import json
import os
import threading
import webbrowser
from datetime import datetime

import cv2
import numpy as np
from flask import Flask, render_template, request
from pynput.keyboard import Key, Controller

app = Flask(__name__, static_folder='static', static_url_path='/static')

CURRENT_DIR = r"C:\Users\kr4ta\Desktop\AGR\users"
keyboard = Controller()

# UNCOMMENT THIS FOR PRODUCTION
threading.Timer(0.1, lambda: webbrowser.get("C:\Program Files\Google\Chrome\Application\chrome.exe %s").open("http://localhost:5000", autoraise=True)).start()
threading.Timer(1.25, lambda:keyboard.press(Key.f11)).start()


@app.route("/", methods=['GET', 'POST'])
def index():
    return render_template('takePicture.html')

@app.route('/savePicture', methods=['GET', 'POST'])
def savePicture():
    if request.method == 'POST':
        fs = request.files.get('snap')
        user_time = datetime.today().strftime('%Y%m%d_%H%M%S')
        if fs:
            img = cv2.imdecode(np.frombuffer(fs.read(), np.uint8), cv2.IMREAD_UNCHANGED)
            cv2.imwrite(os.path.join(CURRENT_DIR, 'visitor{}.png'.format(user_time)), img)

    return 'Picture Saved!'

@app.route('/saveJson', methods=['POST'])
def handle_json():
    data = request.get_json()
    user_time = datetime.today().strftime('%Y%m%d_%H%M%S')
    jsondir = CURRENT_DIR + "/" + 'data{}.json'.format(user_time)
    with open(jsondir, 'w') as f:
        json.dump(data, f, ensure_ascii=False)
    return data

if __name__ == '__main__':
    port = 5005
    url = "http://127.0.0.1:{0}".format(port)
    app.run(host="0.0.0.0", port=port, debug=True,  use_debugger=True, use_reloader=False)

