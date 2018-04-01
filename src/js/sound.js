/**
 * Copyright (C) 2017 Florian Rommel
 *
 * The JavaScript code in this file is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 */

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var Sound = {
  urls: {
    r: 'r.wav',
    m1: 'm1.wav',
    m2: 'm2.wav'
  }
};


Sound.load_audio_buffers = function(context, raw_buffers) {
  return new Promise((resolve, reject) => {
    let audio_buffers = {};
    let index = 0;
    let already_rejected = false;

    let load_single_buffer = (prop) => {

      // Make a copy of the raw buffer (this is ugly but necessary because the
      // buffer gets consumed by the context).
      let raw_org = raw_buffers[prop];
      let raw_copy = new ArrayBuffer(raw_org.byteLength);
      new Uint8Array(raw_copy).set(new Uint8Array(raw_org));

      // Then, decode the raw buffer into a context dependent audio buffer.
      context.decodeAudioData(
        raw_copy,
        (buffer) => {
          audio_buffers[prop] = buffer;
          if (++index == Object.keys(raw_buffers).length) {
            resolve(audio_buffers);
          }
        },
        (error) => {
          if (!already_rejected) {
            already_rejected = true;
            reject(error);
          }
        }
      );
    }

    for (let prop in raw_buffers) {
      load_single_buffer(prop);
    }
  });
}


Sound.load_raw_buffers = function() {
  return new Promise((resolve, reject) => {
    let raw_buffers = {};
    let index = 0;
    let already_rejected = false;

    let load_single_buffer = (prop) => {
      let request = new XMLHttpRequest();
      request.open("GET", Sound.urls[prop], true);
      request.responseType = "arraybuffer";
      request.onload = () => {
        raw_buffers[prop] = request.response;
        if (++index == Object.keys(Sound.urls).length) {
          resolve(raw_buffers);
        }
      }
      request.onerror = () => {
        if (!already_rejected) {
          already_rejected = true;
          reject(new Error('XHR error'));
        }
      }
      request.send();
    }

    for (let prop in Sound.urls) {
      load_single_buffer(prop);
    }
  });
};
