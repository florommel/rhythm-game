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

function TimerView() {
  this.note_elements = [];
  this.note_highlight_index = 0;
  this.metronome_intro_elements = [];
  this.metronome_intro_index = 0;
  this.bar_count = 0;
  this.container = document.createElement("div");
  this.container.setAttribute("class", "timer-view");
  this.get_screen_height = null; // will be set by GameView
}


TimerView.prototype.get_element = function() {
  return this.container;
}


TimerView.prototype.add_play = function(rhythm) {
  this._add_rhythm(rhythm, 'play');
}


TimerView.prototype.add_listen = function(rhythm) {
  this._add_rhythm(rhythm, 'listen');
}


TimerView.prototype.metronome_intro_tick = function() {
  if (this.metronome_intro_index < this.metronome_intro_elements.length) {
    let e = this.metronome_intro_elements[this.metronome_intro_index++];
    e.setAttribute("class", "intro-highlight");
  }
}


TimerView.prototype.highlight_next = function() {
  if (this.note_highlight_index < this.note_elements.length) {
    let e = this.note_elements[this.note_highlight_index];
    e.setAttribute("class", e.getAttribute("class") + " note-highlight");
    this.note_highlight_index++;
  }
}


TimerView.prototype.highlight_next_correct = function() {
  if (this.note_highlight_index < this.note_elements.length) {
    let e = this.note_elements[this.note_highlight_index];
    e.setAttribute("class", e.getAttribute("class") + " note-highlight-correct");
    this.note_highlight_index++;
  }
}


TimerView.prototype.highlight_next_fail = function() {
  if (this.note_highlight_index < this.note_elements.length) {
    let e = this.note_elements[this.note_highlight_index];
    e.setAttribute("class", e.getAttribute("class") + " note-highlight-fail");
    this.note_highlight_index++;
  }
}


TimerView.prototype._focus_bar = function(bar) {
  let element = (bar < 0)
      ? this.container.children[0]
      : this.container.querySelector(".index" + bar);
  let screen = this.get_screen_height();
  let height = this.container.offsetHeight;
  let center = screen / 2 - element.offsetHeight;
  let pos = element.offsetTop;
  let max_scroll = height - screen + 15;
  let scroll = pos - center;
  if (scroll < 0 || screen >= height)
    scroll = 0;
  else if (scroll > max_scroll)
    scroll = max_scroll;
  this.container.style.top = -scroll + "px";
}


TimerView.prototype.add_head = function(level_num, title, time_signature) {
  let head = document.createElement("div");
  head.setAttribute("class", "head");

  let challenge_title = document.createElement("div");
  challenge_title.setAttribute("class", "challenge-title");
  if (level_num) {
    challenge_title.appendChild(document.createTextNode(`Level ${level_num}`));
  }
  if (level_num && title) {
    challenge_title.appendChild(document.createTextNode(": "));
  }
  if (title) {
    let span = document.createElement("span");
    span.appendChild(document.createTextNode(title));
    challenge_title.appendChild(span);
    head.appendChild(challenge_title);
  }

  let disp_time_signature = document.createElement("div");
  disp_time_signature.setAttribute("class", "time-signature");
  let num = document.createElement("div");
  num.appendChild(document.createTextNode(time_signature.num));
  disp_time_signature.appendChild(num);
  let den = document.createElement("div");
  den.appendChild(document.createTextNode(time_signature.den));
  disp_time_signature.appendChild(den);
  head.appendChild(disp_time_signature);

  let metronome_intro = document.createElement("div");
  metronome_intro.setAttribute("class", "metronome-intro");
  for (let i = 1; i <= time_signature.num; i++) {
    let tick = document.createElement("div");
    tick.appendChild(document.createTextNode(i));
    metronome_intro.appendChild(tick);
    this.metronome_intro_elements.push(tick);
  }
  head.appendChild(metronome_intro);

  this.container.appendChild(head);
}


// Parameter -type- should be one of 'listen' or 'play'.
// The perspective is that of the game:
// - Listen to the user
// - Play the rhythm to the user
TimerView.prototype._add_rhythm = function(rhythm, type) {
  let previous = null;
  rhythm.bars.forEach((notes, i) => previous = this._add_bar(notes, type, previous));
}


TimerView.prototype._add_bar = function(notes, type, previous) {
  let bar;
  if (notes[0] == '&') {
    bar = previous;
    bar.setAttribute("class", bar.getAttribute("class") + " index" + this.bar_count);
    TimerView._add_divider(bar);

  } else {
    bar = document.createElement("div");
    bar.setAttribute("class", "bar index" + this.bar_count);
  }
  this.bar_count++;

  let curr_bar_or_group = bar;
  let group_nesting = 0;
  let triplet_count = 0;

  if (type == "listen")
    TimerView._add_flag_icon(bar);

  for (let i = 0; i < notes.length; i++) {
    let curr = notes[i];
    if (curr == "&")
      continue;
    let next = (i+1 < notes.length) ? notes[i+1] : null;
    let curr_is_note = curr.charAt(0) == 'n';

    let notation = '';

    if (curr_is_note) {
      notation += Notation.indicator;
    }

    // handle beamed notes (n8, n8+, n16, n16+, n12, n24) and dotted notes (+)
    let beam_suffix = '';
    if (curr.endsWith('b')) {
      if (curr.endsWith('+')) {
        curr = curr.substring(0, curr.length-2);
        notation += Notation.dot;
      } else {
        curr = curr.substring(0, curr.length-1);
      }
      if (next && next.endsWith('b')) {
        beam_suffix = '_b';
      } else {
        beam_suffix = '_c';
        group_nesting--;
      }
    } else {
      if (curr.endsWith('+')) {
        curr = curr.substring(0, curr.length-1);
        notation += Notation.dot;
      }
      if (next && next.endsWith('b')) {
        beam_suffix = '_a';
        group_nesting++;
        if (curr_bar_or_group == bar) {
          curr_bar_or_group = TimerView._add_group(bar);
        }
      }
    }

    // triplets
    let val = Number(curr.substring(1));
    if (val % 3 == 0) {
      triplet_count++;
      switch (triplet_count) {
      case 1:
        notation += Notation.tri_a;
        group_nesting++;
        if (curr_bar_or_group == bar) {
          curr_bar_or_group = TimerView._add_group(bar);
        }
        break;
      case 2:
        notation += Notation.tri_b;
        break;
      case 3:
        notation += Notation.tri_c;
        group_nesting--;
        triplet_count = 0;
        break;
      }
      curr = curr.charAt(0) + 2/3 * val;
    }

    // main note or rest character
    notation += Notation[curr + beam_suffix];

    let element = TimerView._add_element(curr_bar_or_group, notation);

    if (curr_is_note) {
      this.note_elements.push(element);
    }

    if (group_nesting == 0) {
      curr_bar_or_group = bar;
    }
  }

  this.container.appendChild(bar);
  return bar;
}


TimerView._add_group = function(bar) {
  let group = document.createElement("div");
  group.setAttribute("class", "group");
  bar.appendChild(group);
  return group;
}


TimerView._add_divider = function(bar) {
  let divider = document.createElement("div");
  divider.setAttribute("class", "item divider");
  bar.appendChild(divider);
  return divider;
}


TimerView._add_element = function(bar_or_group, notation) {
  let item = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  item.setAttribute("class", "item");
  item.setAttribute("viewBox", "0 0 40 110");
  item.innerHTML = notation;
  bar_or_group.appendChild(item);
  return item;
}


TimerView._add_space = function(bar_or_group, px_width = null) {
  let space = document.createElement("div");
  space.setAttribute("class", "item");
  if (px_width !== null) {
    space.setAttribute("style", "width: " + px_width + "px");
  }
  bar_or_group.appendChild(space);
  return space;
}


TimerView._add_flag_icon = function(bar) {
  let item = document.createElement("span");
  item.setAttribute("class", "flag");
  bar.appendChild(item);
  return item;
}
