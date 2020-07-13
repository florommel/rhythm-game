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

function TimeSignature(num, den) {
  this.num = num;
  this.den = den;
}

TimeSignature.parse = function(string) {
  let m = "Could not parse time signature, expected '<n>/<m>', " +
      `found '${string}'.`;
  let a = string.split('/');
  if (a.length != 2) {
    throw new Error(m);
  }
  let num = Number(a[0]);
  let den = Number(a[1]);
  if (Number.isNaN(num) || Number.isNaN(den) ||
      !Number.isInteger(num) || !Number.isInteger(den)) {
    throw new Error(m + " <n> and <m> must be integers.");
  }
  return new TimeSignature(num, den);
}

TimeSignature.prototype.clone = function() {
  return new TimeSignature(this.num, this.den);
}


function Rhythm(time_signature, bars) {
  this.time_signature = time_signature.clone();
  this.bars = bars;
}

Rhythm.parse = function(time_signature, rhythm_string) {
  // TODO check rhythm_string
  //      - full bars
  //      - no "syncopic" breaks
  bars = rhythm_string
    .split('|')
    .map((bar) => bar.split(/\s+/).filter((note) => note != ''))
    .filter((bar) => bar.length > 0);
  return new Rhythm(time_signature, bars);
}

Rhythm.prototype.to_timing = function(bpm, offset) {
  return new Timing(this, bpm, offset);
}


function Timing(rhythm, bpm, offset) {
  this.start = offset;
  this.ticks = [];
  let whole_interval = 60 / bpm * rhythm.time_signature.den;
  let t = offset;
  var notes = rhythm.bars.reduce((a, b) => {
    return a.concat(b);
  });
  for (let i = 0; i < notes.length; i++) {
    let note = notes[i];
    switch (note.charAt(0)) {
    case 'n':
      this.ticks.push(t);
    case 'p':
      t += Timing.decode_note_value(note) * whole_interval;
      break;
    case '&':
      break;
    default:
      throw new Error("Invalid note or rest: " + note);
    }
  }
  this.end = t;
}

Timing.empty = function(offset) {
  return new Timing([], 1, offset);
}

Timing.decode_note_value = function(note) {
  let len = (note.charAt(note.length-1) == 'b') ? note.length-1 : note.length;
  if (note.charAt(len-1) == '+') {
    return (3 / (2 * Number(note.substring(1, len-1))));
  } else {
    return (1 / Number(note.substring(1, len)));
  }
}
