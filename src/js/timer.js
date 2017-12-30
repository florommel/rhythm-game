/**
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2017 Florian Rommel
 *
 * The JavaScript code in this page is free software: you can
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
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */


window.AudioContext = window.AudioContext || window.webkitAudioContext;


function Timer(level_number, title, time_signature, bpm, timer_view,
               sound_raw_buffers) {
  this.time_signature = time_signature.clone();
  this.bpm = bpm;
  this.timer_view = timer_view;
  this.sound_raw_buffers = sound_raw_buffers;
  this.finished_callback = Function.prototype;  // NOP
  this.failed_callback = Function.prototype;  // NOP
  this.queue = [];

  this.timer_view.add_head(level_number, title, this.time_signature);
}


Timer.half_tolerance = 0.09;
Timer.big_delay = 0.09;
Timer.check_delay = 0.015;


Timer.prototype.set_finished_callback = function(handler) {
  this.finished_callback = handler;
}


Timer.prototype.set_failed_callback = function(handler) {
  this.failed_callback = handler;
}


Timer.prototype.queue_play = function(rhythm) {
  this.queue.push({
    type: 1,
    rhythm: rhythm
  });
  this.timer_view.add_play(rhythm);
}


Timer.prototype.queue_listen = function(rhythm) {
  this.queue.push({
    type: 2,
    rhythm: rhythm
  });
  this.timer_view.add_listen(rhythm);
}


Timer.prototype.get_schedule = function(initial_time_offset) {
  let schedule = {
    play_timing: [],
    check_timing: [],
    check_enable_timing: [],
    end: 0
  }
  let play_id_counter = 0;
  let check_id_counter = 0;
  let time_offset = initial_time_offset;

  this.queue.forEach((item, i, org) => {
    let item_timing = item.rhythm.to_timing(this.bpm, time_offset);
    time_offset = item_timing.end;

    switch (item.type) {
    case 1:  // Play rhythm
      item_timing.ticks.forEach((tick) => {
        schedule.play_timing.push({
          time: tick,
          id: 'p-' + play_id_counter
        });
        play_id_counter++;
      });
      break;
    case 2:  // Listen to the user
      if (i == 0 || org[i-1].type != 2) {
        schedule.check_enable_timing.push({
          time: item_timing.start - Timer.half_tolerance - Timer.check_delay,
          checking_enabled: true
        });
      }
      if (i == org.length-1 || org[i+1].type != 2) {
        schedule.check_enable_timing.push({
          time: item_timing.end + Timer.check_delay,
          checking_enabled: false
        });
      }
      item_timing.ticks.forEach((tick) => {
        schedule.check_timing.push({
          time: tick,
          id: 'c-' + check_id_counter
        });
        check_id_counter++;
      });
      break;
    default:
      throw Error("Unreachable");
    }
    schedule.end = item_timing.end;
  });

  return schedule;
}


Timer.prototype.start = function() {
  let context = new AudioContext();
  context.suspend();

  Sound.load_audio_buffers(context, this.sound_raw_buffers)
    .then((audio_buffers) => {
      let time_offset = Timer.half_tolerance + Timer.big_delay;

      let metronome_interval = 60 / this.bpm;
      let metronome_start_time = context.currentTime + time_offset;
      let start_time = context.currentTime + time_offset
          + metronome_interval * this.time_signature.num;

      let schedule = this.get_schedule(start_time);

      let failed = false;
      let fail = (this_listener) => {
        this_listener.set_checking_enabled(false);
        this_listener.deregister();
        failed = true;
        window.setTimeout(() => {
          context.close();
          this.failed_callback();
        }, Timer.big_delay * 1000);
      }

      let listener = new CheckListener(schedule.check_timing, fail,
                                       this.timer_view, context, audio_buffers);

      // Metronome ticks
      let beat_countdown = 0;
      let bar_count = -1;
      let next_metronome_time = metronome_start_time;
      while (next_metronome_time < schedule.end - 0.001) {
        let source = context.createBufferSource();
        if (beat_countdown == 0) {
          source.buffer = audio_buffers.m1;
          beat_countdown = this.time_signature.num - 1;
          bar_count++;
        } else {
          source.buffer = audio_buffers.m2;
          beat_countdown--;
        }
        source.connect(context.destination);
        source.start(next_metronome_time);
        next_metronome_time += metronome_interval;
      }
      let metronome_intro_tick_count = -1;
      let metronome_intro_tick_time = metronome_start_time;
      let metronome_intro_tick = () => {
        if (failed) return;
        if (metronome_intro_tick_count != -1) {
          this.timer_view.metronome_intro_tick();
        }
        if (++metronome_intro_tick_count < this.time_signature.num) {
          let delay = (metronome_intro_tick_time - context.currentTime) * 1000;
          metronome_intro_tick_time += metronome_interval;
          window.setTimeout(metronome_intro_tick, delay);
        }
      }

      // Rhythm play ticks
      schedule.play_timing.forEach((item) => {
        let source = context.createBufferSource();
        source.buffer = audio_buffers.r;
        source.connect(context.destination);
        source.start(item.time);
      });
      let play_tick_index = -1;
      let play_tick = () => {
        if (failed) return;
        if (play_tick_index != -1) {
          this.timer_view.highlight_next();
        }
        if (++play_tick_index < schedule.play_timing.length) {
          let time = schedule.play_timing[play_tick_index].time;
          let delay = (time - context.currentTime) * 1000;
          window.setTimeout(play_tick, delay);
        }
      }

      // Enable/Disable checking
      let check_enable_tick_index = -1;
      let check_enable_tick = () => {
        if (failed) return;
        if (check_enable_tick_index != -1) {
          let val = schedule.check_enable_timing[check_enable_tick_index]
              .checking_enabled;
          listener.set_checking_enabled(val);
          if (listener.is_failed()) fail(listener);
        }
        if (++check_enable_tick_index < schedule.check_enable_timing.length) {
          let time = schedule.check_enable_timing[check_enable_tick_index].time;
          let delay = (time - context.currentTime) * 1000;
          window.setTimeout(check_enable_tick, delay);
        }
      }

      // Actual checking
      let check_tick_index = -1;
      let check_tick = () => {
        if (failed) return;
        if (check_tick_index != -1) {
          if (listener.is_failed()) {
            this.timer_view.highlight_next_fail();
            fail(listener);
          }
        }
        if (++check_tick_index < schedule.check_timing.length) {
          let time = schedule.check_timing[check_tick_index].time;
          let delay = (time + Timer.half_tolerance + Timer.check_delay
                       - context.currentTime) * 1000;
          window.setTimeout(check_tick, delay);
        }
      }

      listener.register();
      context.resume();
      metronome_intro_tick();
      play_tick();
      check_enable_tick();
      check_tick();

      window.setTimeout(() => {
        if (failed) return;
        listener.deregister();
        this.finished_callback();
        context.close();
      }, (schedule.end + Timer.big_delay - context.currentTime) * 1000);
    });
}


function CheckListener(check_timing, fail_handler, timer_view, context,
                       audio_buffers) {
  this.check_timing = check_timing;
  this.timing_index = 0;
  this.checking_enabled = false;
  this.fail_handler = fail_handler;
  this.timer_view = timer_view;
  this.context = context;
  this.audio_buffers = audio_buffers;

  this.keydown_handler = (event) => {
    let now = this.context.currentTime;
    if (this.checking_enabled && (event.key == " " || event.key == "Enter")) {
      this._knock(now);
    }
  };
  this.touch_handler = (event) => {
    let now = this.context.currentTime;
    this._knock(now);
  };
}


CheckListener.prototype.register = function() {
  window.addEventListener("keydown", this.keydown_handler);
  window.addEventListener("touchstart", this.touch_handler);
}


CheckListener.prototype.deregister = function() {
  window.removeEventListener("keydown", this.keydown_handler);
  window.removeEventListener("touchstart", this.touch_handler);
}


CheckListener.prototype.set_checking_enabled = function(value) {
  this.checking_enabled = value;
}


CheckListener.prototype.is_failed = function() {
  let now = this.context.currentTime;
  return (this.timing_index < this.check_timing.length) &&
    (now > this.check_timing[this.timing_index].time + Timer.half_tolerance);
}


CheckListener.prototype._knock = function(now) {
  if (this.checking_enabled) {
    let source = this.context.createBufferSource();
    source.buffer = this.audio_buffers.r;
    source.connect(this.context.destination);
    source.start();
    if (this.timing_index >= this.check_timing.length) {
      this.fail_handler(this);
    } else {
      let target = this.check_timing[this.timing_index];
      if ((now < target.time - Timer.half_tolerance)
          || (now > target.time + Timer.half_tolerance)) {
        this.fail_handler(this);
      } else {
        this.timer_view.highlight_next_correct();
      }
      this.timing_index++;
    }
  }
}
