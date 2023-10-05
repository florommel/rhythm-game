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

function Challenge(name, title, version, levels) {
  this.name = name;
  this.version = version;
  this.title = title;
  this.levels = levels;
}


function Level(title, rhythm, bpm, max_score, no_playback) {
  this.title = title;
  this.rhythm = rhythm;
  this.bpm = bpm;
  this.max_score = max_score;
  this.no_playback = no_playback;
}


Challenge.load = function(name) {
  return new Promise((resolve, reject) => {
    let request = new XMLHttpRequest();
    request.open("GET", `challenges/${name}.json`, true);
    request.responseType = "json";
    request.onload = () => {
      try {
        resolve(Challenge.parse(name, request.response));
      } catch (err) {
        reject(err);
      }
    }
    request.onerror = () => {
      reject(new Error(`Error while loading '${name}'.`));
    }
    request.send();
  });
}


Challenge.parse = function(name, plain_challenge_object) {
  if (typeof(plain_challenge_object) != 'object') {
    throw new Error("Challenge object must be of type 'object'.");
  }
  if (typeof(plain_challenge_object.title) != 'string'
      || plain_challenge_object.title == "") {
    throw new Error("Property 'title' must be of type 'string' and not empty.");
  }
  if (!Array.isArray(plain_challenge_object.levels)
      || plain_challenge_object.levels.length == 0) {
    throw new Error("Property 'levels' must be of type 'Array' and not empty.");
  }
  // TODO optional author[string] and version/revision[number]
  let title = plain_challenge_object.title;
  let version = plain_challenge_object.version || 1;
  let levels = plain_challenge_object.levels
      .map((plain_level) => Level.parse(plain_level));
  return new Challenge(name, title, version, levels);
}


Level.parse = function(plain_level_object) {
  if (typeof(plain_level_object) != 'object') {
    throw new Error("Level object must be of type 'object'.");
  }
  if (typeof(plain_level_object.title) != 'string') {
    throw new Error("Property 'title' must be of type 'string'.");
  }
  if ((typeof(plain_level_object.bpm) != 'number') ||
      (!Number.isInteger(plain_level_object.bpm))) {
    throw new Error("Property 'bpm' must be an integer value.");
  }
  if (typeof(plain_level_object.time_signature) != 'string') {
    throw new Error("Property 'time_signature' must be of type 'string'.");
  }
  if (typeof(plain_level_object.rhythm) != 'string') {
    throw new Error("Property 'rhythm' must be of type 'string'.");
  }
  if (plain_level_object.max_score != undefined) {
    if ((typeof(plain_level_object.max_score == undefined) != 'number') ||
        (!Number.isInteger(plain_level_object.max_score))) {
      throw new Error("Property 'max_score' must be an integer value.");
    }
  }
  if (!['undefined', 'boolean'].includes(typeof(plain_level_object.no_playback))) {
    throw new Error("Property 'no_playback' must be a boolean value.");
  }

  let title = plain_level_object.title;
  let bpm = plain_level_object.bpm;
  let time_signature = TimeSignature.parse(plain_level_object.time_signature);
  let rhythm = Rhythm.parse(time_signature, plain_level_object.rhythm);
  let max_score = (plain_level_object.max_score)
      ? plain_level_object.max_score : 5;
  let no_playback = !!plain_level_object.no_playback;
  return new Level(title, rhythm, bpm, max_score, no_playback);
}
