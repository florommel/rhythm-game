/**
 * Copyright (C) 2017, 2018 Florian Rommel
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

function Timer(level_number, title, time_signature, bpm, timer_view) {
  this.time_signature = time_signature.clone();
  this.bpm = bpm;
  this.timer_view = timer_view;
  this.finished_callback = Function.prototype;  // NOP
  this.failed_callback = Function.prototype;  // NOP
  this.skipped_callback = Function.prototype;  // NOP
  this.skippable_callback = Function.prototype;  // NOP
  this.queue = [];
  this._skippable = false;

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


Timer.prototype.set_skipped_callback = function(handler) {
  this.skipped_callback = handler;
}


Timer.prototype.set_skippable_callback = function(handler) {
  this.skippable_callback = handler;
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


Timer.prototype._set_skippable = function(value) {
  this._skippable = value;
  this.skippable_callback(value);
}

// Rough overview:
// - Get the level schedule and initialize input and listener
// - Schedule all metronome sounds in advance (sound.play_m1 & sound.paly_m2)
// - Schedule all playback sounds in advance (sound.play_r)
// - metronome_intro_tick, play_tick, check_enable_tick, and check_tick
//   are closures that schedule themselves again as needed.
//   Since the non-user-input sounds are already scheduled, these functions
//   control the logic and the display (timer_view callbacks)
// TODO: This is a mess. Transform this into dedicated state machines.
Timer.prototype.start = function() {
  Controller.sound.get().then((sound) => {
    sound.suspend();

    let time_offset = Timer.half_tolerance + Timer.big_delay;

    let metronome_interval = 60 / this.bpm;
    let metronome_start_time = sound.time() + time_offset;
    let start_time = metronome_start_time +
        metronome_interval * this.time_signature.num;

    let schedule = this.get_schedule(start_time);

    let fail = () => {
      Controller.input.clear();
      Controller.timeout.clear();
      Controller.timeout.add(() => {
        sound.close();
        this.failed_callback();
      }, Timer.big_delay * 1000);
    }

    let listener = new CheckListener(schedule.check_timing, fail,
                                     this.timer_view, sound);

    let skip = () => {
      if (!this._skippable)
        return;
      Controller.input.clear();
      Controller.timeout.clear();
      Controller.timeout.add(() => {
        sound.close();
        this.skipped_callback();
      }, Timer.big_delay * 1000);
    }

    // Metronome ticks
    let beat_countdown = 0;
    let bar_count = -1;
    let next_metronome_time = metronome_start_time;
    while (next_metronome_time < schedule.end - 0.001) {
      if (beat_countdown == 0) {
        sound.play_m1(next_metronome_time);
        let tmp_bar_count = bar_count;
        Controller.timeout.add(() => this.timer_view._focus_bar(tmp_bar_count),
                               (next_metronome_time - sound.time()) * 1000);
        beat_countdown = this.time_signature.num - 1;
        bar_count = bar_count + 1;
      } else {
        sound.play_m2(next_metronome_time);
        beat_countdown--;
      }
      next_metronome_time += metronome_interval;
    }
    let metronome_intro_tick_count = -1;
    let metronome_intro_tick_time = metronome_start_time;
    let metronome_intro_tick = () => {
      if (metronome_intro_tick_count != -1) {
        this.timer_view.metronome_intro_tick();
      }
      if (++metronome_intro_tick_count < this.time_signature.num) {
        let delay = (metronome_intro_tick_time - sound.time()) * 1000;
        metronome_intro_tick_time += metronome_interval;
        Controller.timeout.add(metronome_intro_tick, delay);
      }
    }

    // Rhythm play ticks
    schedule.play_timing.forEach((item) => {
      sound.play_r(item.time);
    });
    let play_tick_index = -1;
    let play_tick = () => {
      if (play_tick_index != -1) {
        this.timer_view.highlight_next();
      }
      if (++play_tick_index < schedule.play_timing.length) {
        let time = schedule.play_timing[play_tick_index].time;
        let delay = (time - sound.time()) * 1000;
        Controller.timeout.add(play_tick, delay);
      }
    }

    // Enable/Disable checking
    let check_enable_tick_index = -1;
    let check_enable_tick = () => {
      if (check_enable_tick_index != -1) {
        let val = schedule.check_enable_timing[check_enable_tick_index]
            .checking_enabled;
        listener.set_checking_enabled(val);
        this._set_skippable(!val);
        if (listener.is_failed()) {
          fail();
          return;
        }
      }
      if (++check_enable_tick_index < schedule.check_enable_timing.length) {
        let time = schedule.check_enable_timing[check_enable_tick_index].time;
        let delay = (time - sound.time()) * 1000;
        Controller.timeout.add(check_enable_tick, delay);
      }
    }

    // Actual checking
    let check_tick_index = -1;
    let check_tick = () => {
      if (check_tick_index != -1) {
        if (listener.is_failed()) {
          this.timer_view.highlight_next_fail();
          fail();
          return;
        }
      }
      if (++check_tick_index < schedule.check_timing.length) {
        let time = schedule.check_timing[check_tick_index].time;
        let delay = (time + Timer.half_tolerance + Timer.check_delay
                     - sound.time()) * 1000;
        Controller.timeout.add(check_tick, delay);
      }
    }

    // Highlight first flag
    let flag_time = (schedule.check_timing[0].time - 1) * 1000;
    Controller.timeout.add(() => this.timer_view.highlight_flag(), flag_time);

    Controller.input.set(() => listener.knock(), skip);
    metronome_intro_tick();
    play_tick();
    check_enable_tick();
    check_tick();

    sound.resume();

    // Make only skippable when the first queue element is playback
    let has_playback = this.queue[0].type == 1;
    this._set_skippable(has_playback);

    Controller.timeout.add(() => {
      Controller.clear_all();
      this.finished_callback();
    }, (schedule.end + Timer.big_delay - sound.time()) * 1000);
  });
}


function CheckListener(check_timing, fail, timer_view, sound) {
  this.check_timing = check_timing;
  this.timing_index = 0;
  this.checking_enabled = false;
  this.fail = fail;
  this.timer_view = timer_view;
  this.sound = sound;
}


CheckListener.prototype.set_checking_enabled = function(value) {
  this.checking_enabled = value;
}


CheckListener.prototype.is_failed = function() {
  let now = this.sound.time();
  return (this.timing_index < this.check_timing.length) &&
    (now > this.check_timing[this.timing_index].time + Timer.half_tolerance);
}


CheckListener.prototype.knock = function() {
  let now = this.sound.time();
  if (this.checking_enabled) {
    this.sound.play_r();
    if (this.timing_index >= this.check_timing.length) {
      this.fail();
    } else {
      let target = this.check_timing[this.timing_index];
      if ((now < target.time - Timer.half_tolerance)
          || (now > target.time + Timer.half_tolerance)) {
        this.fail();
      } else {
        this.timer_view.highlight_next_correct();
      }
      this.timing_index++;
    }
  }
}
