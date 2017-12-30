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


function Game(challenge, game_view, sound_buffers) {
  this.challenge = challenge;
  this.game_view = game_view;
  this.sound_buffers = sound_buffers;
  this.finished_callback = Function.prototype;  // NOP
  this.cancelled_callback = Function.prototype;  // NOP
  this.current_level_number = 0;
  this.current_level_score = 0;
  this.score = 0;
  this.max_score = this.challenge.levels
    .reduce((acc, level) => acc + level.max_score, 0);
}


Game.prototype.run = function() {
  // `mode` either 'start', 'end', 'success' or 'fail'.
  let start_level = (mode) => {
    let timer_view = new TimerView();
    let level = this.challenge.levels[this.current_level_number-1];

    if (mode == 'start' || mode == 'success') {
      this.current_level_score = level.max_score;
    } else if (mode == 'fail' && this.current_level_score > 0) {
      this.current_level_score--;
    }

    let timer = new Timer(this.current_level_number, level.title,
                          level.rhythm.time_signature, level.bpm, timer_view,
                          this.sound_buffers);
    timer.set_failed_callback(() => {
      start_level("fail");
    });
    timer.set_finished_callback(() => {
      this.score += this.current_level_score;
      this.game_view.update_score(this.score);
      if (++this.current_level_number > this.challenge.levels.length) {
        this.game_view.switch_result_view(this.score, this.max_score,
                                          this.finished_callback);
      } else {
        start_level("success");
      }
    });

    timer.queue_play(level.rhythm);
    timer.queue_listen(level.rhythm);

    this.game_view.switch_timer_view(timer_view, mode != "fail", () => {
      this.game_view.show_modal(mode, () => {
        timer.start();
      });
    });
  }

  this.current_level_number = 1;
  this.game_view.create_game_menu(this.max_score);
  start_level("start");
}
