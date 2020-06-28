/**
 * Copyright (C) 2018 Florian Rommel
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

var Controller = {};

Controller.init = function() {
  return this.sound._init();
};

Controller.clear_all = function() {
  this.input.clear();
  this.timeout.clear();
  return this.sound.clear();
};


Controller.input = {
  _current: {
    keydown: null,
    touch: null
  }
};

Controller.input.set = function(handler) {
  this.clear();
  this._current.keydown = (event) => {
    if (event.key == " " || event.key == "Enter")
      handler();
  };
  this._current.touch = handler;
  window.addEventListener("keydown", this._current.keydown);
  window.addEventListener("touchstart", this._current.touch);
};

Controller.input.clear = function() {
  if (this._current.keydown)
    window.removeEventListener("keydown", this._current.keydown);
  if (this._current.touch)
    window.removeEventListener("touchstart", this._current.touch);
};


Controller.sound = {
  _raw_buffers: null,
  _current: null
};


Controller.sound.get = function() {
  this.clear();
  let context = new AudioContext();
  return Sound.load_audio_buffers(context, this._raw_buffers)
    .then((audio_buffers) => {
      this._current = {
        audio_buffers,
        context,
        play_r: function(time) {
          let source = this.context.createBufferSource();
          source.buffer = this.audio_buffers.r;
          source.connect(this.context.destination);
          source.start(time);
        },
        play_m1: function(time) {
          let source = this.context.createBufferSource();
          source.buffer = this.audio_buffers.m1;
          source.connect(this.context.destination);
          source.start(time);
        },
        play_m2: function(time) {
          let source = this.context.createBufferSource();
          source.buffer = this.audio_buffers.m2;
          source.connect(this.context.destination);
          source.start(time);
        },
        time: function() {
          return this.context.currentTime;
        },
        suspend: function() {
          this.context.suspend();
        },
        resume: function() {
          this.context.resume();
        },
        close: function() {
          if (this.context) {
            this.context.close();
            this.context = null;
          }
        }
      };
      return this._current;
    });
};

Controller.sound.clear = function() {
  if (this._current) {
    this._current.close();
    this._current = null;
  }
}

Controller.sound._init = function() {
  return Sound.load_raw_buffers().then((raw_buffers) => {
    this._raw_buffers = raw_buffers;
  }).catch((err) => console.log(err));
};


Controller.timeout = {
  _timeouts: []
};

Controller.timeout.add = function(handler, time) {
  this._timeouts.push(window.setTimeout(handler, time));
};

Controller.timeout.clear = function() {
  while (this._timeouts.length) {
    window.clearTimeout(this._timeouts.pop());
  }
};
