/**
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2018 Florian Rommel
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


function MenuView(challenge_list) {
  this.container = document.createElement("div");
  this.container.setAttribute("class", "menu row");

  let title = document.createElement("div");
  title.setAttribute("class", "menu-title xs-12 m-10 push-m-1 l-8 push-l-2");
  title.appendChild(document.createTextNode("A Rhythm Game"));
  this.container.appendChild(title);

  this.challenge_list_view = document.createElement("div");
  this.challenge_list_view.setAttribute("class",
      "menu-challenges xs-12 m-10 push-m-1 l-8 push-l-2 nested-row");
  this.container.appendChild(this.challenge_list_view);

  for (entry of challenge_list) {
    let entry_view = document.createElement("a");
    entry_view.setAttribute("class", "menu-challenge-entry xs-6 s-4 l-4");
    entry_view.setAttribute("href", "#" + entry.name);
    entry_view.appendChild(document.createTextNode(entry.title));
    this.challenge_list_view.appendChild(entry_view);
  }
}


MenuView.prototype.get_element = function() {
  return this.container;
}
