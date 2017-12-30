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


function GameView() {
  this.timer_view = null;

  this.container = document.createElement("div");
  this.container.setAttribute("class", "row");

  this.game_container = document.createElement("div");
  this.game_container
    .setAttribute("class", "xs-12 s-12 m-10 push-m-1 l-8 push-l-0");
  this.game_view = document.createElement("div");
  this.game_view.setAttribute("class", "game-view");
  this.game_container.appendChild(this.game_view);

  this.timer_view_container = document.createElement("div");
  this.timer_view_container.setAttribute("class", "timer-view-container");
  this.game_view.appendChild(this.timer_view_container);

  this.game_menu = document.createElement("div");
  this.game_menu
    .setAttribute("class", "game-menu xs-12 s-12 m-10 push-m-1 l-2 push-l-0");
  this.score_div = document.createElement("div");
  this.score_div.setAttribute("class", "curr-score");

  this.container.appendChild(this.game_menu);
  this.container.appendChild(this.game_container);
}


GameView.prototype.get_element = function() {
  return this.container;
}


GameView.prototype.switch_timer_view = function(new_timer_view,
                                                successful,
                                                finished_callback) {
  let old_timer_view = null;
  if (this.timer_view_container) {
    old_timer_view = this.timer_view;
    this.timer_view = null;
  }

  this.timer_view_container.appendChild(new_timer_view.get_element());
  this.timer_view = new_timer_view;

  let new_element = new_timer_view.get_element();
  let old_element = (old_timer_view) ? old_timer_view.get_element() : null;

  let finish = () => {
    this.timer_view = new_timer_view;
    finished_callback();
  };

  if (old_element) {
    if (successful) {
      GameView._flip_view(old_element, new_element, finish);
    } else {
      GameView._shake_view(old_element, new_element, finish)
    }
  } else {
    GameView._intro_view(new_element, finish);
  }
}


GameView.prototype.switch_result_view = function(score, max_score,
                                                 finished_callback) {
  let old_timer_view = this.timer_view;
  this.timer_view = null;

  let result_view = document.createElement("div");
  result_view.setAttribute("class", "result-view");
  let title_element = document.createElement("span");
  title_element.textContent = "Challenge finished";
  title_element.setAttribute("class", "big");
  let score_element = document.createElement("span");
  score_element.textContent = score;
  score_element.setAttribute("class", "big");
  let fract = Math.round(score / max_score * 100);
  let fract_element = document.createElement("span");
  fract_element.textContent = fract;
  fract_element.setAttribute("class", "big");
  let continue_text = document.createElement("span");
  continue_text.textContent = GameView._get_continue_text();
  continue_text.setAttribute("class", "it");
  result_view.appendChild(title_element);
  result_view.appendChild(document.createElement("br"));
  result_view.appendChild(document.createTextNode("Score: "));
  result_view.appendChild(score_element);
  result_view.appendChild(document.createTextNode(" / " + max_score));
  result_view.appendChild(document.createElement("br"));
  result_view.appendChild(document.createTextNode("≘ "));
  result_view.appendChild(fract_element);
  result_view.appendChild(document.createTextNode(" %"));
  result_view.appendChild(document.createElement("br"));
  result_view.appendChild(continue_text);
  result_view.style.background = `hsla(${fract}, 100%, 50%, 0.4)`;
  this.timer_view_container.appendChild(result_view);
  GameView._flip_view(old_timer_view.get_element(), result_view,
                      finished_callback);
}


// See also _view.css (.timer-view-container)
GameView._flip_view = function(old_element, new_element,
                               finished_callback) {
  let duration = 600;

  old_element.style.transform = "rotateY(0deg)";
  new_element.style.transform = "rotateY(180deg)";
  old_element.style.position = "absolute";
  new_element.style.position = "absolute";
  new_element.style.zIndex = 1;

  let start = null;
  let step = (timestamp) => {
    if (!start)
      start = timestamp;
    let progress = timestamp - start;
    if (progress < duration) {
      let step_deg = progress / duration * 180;
      old_element.style.transform = `rotateY(${0 - step_deg}deg)`;
      new_element.style.transform = `rotateY(${180 - step_deg}deg)`;
      window.requestAnimationFrame(step);
    } else {
      new_element.style.transform = "none";
      new_element.style.position = "static";
      new_element.style.zIndex = 0;
      old_element.remove();
      finished_callback();
    }
  }

  window.requestAnimationFrame(step);
}


GameView._shake_view = function(old_element, new_element,
                                      finished_callback) {
  let duration = 600;

  old_element.remove();

  let start = null;
  let step = (timestamp) => {
    if (!start)
      start = timestamp;
    let progress = timestamp - start;
    if (progress < duration) {
      let step_inc = progress / duration * Math.PI * 8;
      let step_deg = Math.sin(step_inc) * 4;
      new_element.style.transform = `rotate(${step_deg}deg)`;
      window.requestAnimationFrame(step);
    } else {
      new_element.style.transform = "none";
      finished_callback();
    }
  }

  window.requestAnimationFrame(step);
}


GameView._intro_view = function(new_element, finished_callback) {
  let duration = 400;
  new_element.style.transform = "rotateY(20deg) scale(1.5)";
  new_element.style.opacity = 0;

  let start = null;
  let step = (timestamp) => {
    if (!start)
      start = timestamp;
    let progress = timestamp - start;
    if (progress < duration) {
      let step_deg = progress / duration * 20;
      let step_opacity = progress / duration;
      let step_scale = progress / duration * 0.5;
      new_element.style.transform =
        `rotateY(${20 - step_deg}deg) scale(${1.5 - step_scale})`;
      new_element.style.opacity = step_opacity;
      window.requestAnimationFrame(step);
    } else {
      new_element.style.transform = "none";
      finished_callback();
    }
  }

  window.requestAnimationFrame(step);
}


GameView.prototype.create_game_menu = function(max_game_score) {
  let back_text = "Back to main menu";
  let back_button = document.createElement("button");
  let back_image = document.createElement("img");
  back_image.setAttribute("src", "back.svg");
  back_image.setAttribute("alt", back_text);
  back_button.appendChild(back_image);
  back_button.setAttribute("title", back_text);
  this.game_menu.appendChild(back_button);

  let restart_text = "Restart whole challenge";
  let restart_button = document.createElement("button");
  let restart_image = document.createElement("img");
  restart_image.setAttribute("src", "restart.svg");
  restart_image.setAttribute("alt", restart_text);
  restart_button.appendChild(restart_image);
  restart_button.setAttribute("title", restart_text);
  this.game_menu.appendChild(restart_button);

  let score_container = document.createElement("div");
  score_container.setAttribute("class", "score");
  this.score_div.textContent = 0;
  score_container.appendChild(this.score_div);
  this.game_menu.appendChild(score_container);

  this.game_menu.style.opacity = 0;
  // see transition in _view.scss
  window.setTimeout(() => {
    this.game_menu.removeAttribute("style");
  }, 500);
}


GameView.prototype.update_score = function(new_score) {
  let old_score = Number(this.score_div.textContent);
  if (new_score != old_score) {
    this.score_div.textContent = new_score;
    this.score_div.style.transform = "scale(15)";
    this.score_div.style.opacity = 0;
    this.score_div.style.transition = "none";
    window.setTimeout(() => this.score_div.removeAttribute("style"), 100);
  }
}


// `mode` either 'start', 'end', 'success' or 'fail'.
GameView.prototype.show_modal = function(mode, callback) {
  let main_text = null;
  switch (mode) {
  case "start":
    main_text = "Start Challenge";
    break;
  case "end":
    main_text = "Challenge Completed";
    break;
  case "success":
    main_text = "Next Level";
    break;
  case "fail":
    main_text = "Retry Level";
    break;
  default:
    main_text = "Continue";
  }

  let modal = document.createElement("div");
  modal.setAttribute("class", "modal");
  modal.style.opacity = 0;
  modal.appendChild(document.createTextNode(main_text));
  let continue_div = document.createElement("div");
  continue_div.textContent = GameView._get_continue_text();
  modal.appendChild(continue_div);
  this.game_view.appendChild(modal);

  window.setTimeout(() => modal.removeAttribute("style"));

  let keydown_handler = (event) => {
    if (event.key == " " || event.key == "Enter") {
      handler();
    }
  };
  let handler = () => {
    callback();
    window.removeEventListener("keydown", keydown_handler);
    window.removeEventListener("touchstart", handler);
    modal.style.opacity = 0;
    modal.style.transform = "scale(2) translate(-25%, -25%)";
    setTimeout(() => modal.remove(), 1000);
  };

  window.addEventListener("keydown", keydown_handler);
  window.addEventListener("touchstart", handler);
}


GameView._get_continue_text = function() {
  return ("ontouchstart" in window)
    ? `tap or press »enter« or »space«`
    : `press »enter« or »space«`;
}
