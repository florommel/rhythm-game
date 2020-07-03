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

function MenuView(challenge_list) {
  this.container = document.createElement("div");
  this.container.setAttribute("class", "menu");
  this.container.style.transform = "scale(0.6)";
  this.container.style.opacity = 0;
  this.container.style.transition = "none";
  Controller.timeout.add(() => this.container.removeAttribute("style"), 100);

  let title = document.createElement("div");
  title.setAttribute("class", "menu-title");
  title.appendChild(document.createTextNode("A Rhythm Game"));
  this.container.appendChild(title);

  this.challenge_list_view = document.createElement("div");
  this.challenge_list_view.setAttribute("class", "menu-challenges");
  this.container.appendChild(this.challenge_list_view);

  for (entry of challenge_list) {
    let entry_view = document.createElement("a");
    entry_view.setAttribute("class", "menu-challenge-entry");
    entry_view.setAttribute("href", "#" + entry.name);
    let rezi = 5 - entry.difficulty;
    let fract = (rezi + 1.2 * Math.sqrt(rezi) - 1.8) * 20;
    entry_view.style.background = `hsla(${fract}, 80%, 55%, 0.5)`;
    entry_view.style.color = `hsla(${fract}, 60%, 25%, 1)`;
    entry_view.style.borderColor = `hsla(${fract}, 70%, 40%, 1)`;
    let title = document.createElement("span");
    title.setAttribute("class", "menu-challenge-title");
    title.appendChild(document.createTextNode(entry.title));
    entry_view.appendChild(title);
    let info = document.createElement("span");
    info.setAttribute("class", "menu-challenge-info");
    entry_view.appendChild(info);
    let levels = document.createElement("span");
    levels.setAttribute("class", "menu-challenge-levels");
    levels.appendChild(document.createTextNode("Levels: " + entry.levels));
    info.appendChild(levels);
    let difficulty = document.createElement("span");
    difficulty.setAttribute("class", "menu-challenge-difficulty");
    let bullets = Array.from(Array(entry.difficulty)).map(() => "\u2669").join(" ");
    difficulty.appendChild(document.createTextNode(bullets));
    info.appendChild(difficulty);
    this.challenge_list_view.appendChild(entry_view);
  }
}


MenuView.prototype.get_element = function() {
  return this.container;
}
