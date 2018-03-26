/**
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2017, 2018 Florian Rommel
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


var rhythm_config = {
  challenges: [
    { name: "challenge", title: "Main Challenge", difficulty: 3 },
    { name: "test1", title: "Test Challenge 1", difficulty: 3 },
    { name: "test2", title: "Test Challenge 2", difficulty: 3 },
    { name: "test3", title: "Test Challenge 3", difficulty: 3 },
    { name: "test4", title: "Test Challenge 4", difficulty: 3 },
    { name: "test5", title: "Test Challenge 5", difficulty: 3 },
    { name: "test6", title: "Test Challenge 6", difficulty: 3 },
    { name: "test7", title: "Test Challenge 7", difficulty: 3 },
    { name: "test8", title: "Test Challenge 8", difficulty: 3 },
    { name: "test9", title: "Test Challenge 9", difficulty: 3 },
    { name: "phantom", title: "Phantom", difficulty: 10 }
  ]
};


function rhythm_game_run() {
  document.onselectstart = function() { return false; }
  document.onmousedown = function() { return false; }

  Controller.init().then(() => {
    window.addEventListener("hashchange", router);
    router();
  }).catch((err) => console.log(err));
}


function router() {
  let route = location.hash.slice(1);

  document.getElementById("rhythm-game").innerHTML = "";
  Controller.clear_all();

  if (route == '') {
    let menu_view = new MenuView(rhythm_config.challenges);
    document.getElementById("rhythm-game")
      .appendChild(menu_view.get_element());

  } else {
    Challenge.load(`${route}.json`).then((challenge) => {
      let game_view = new GameView();
      let game = new Game(challenge, game_view);
      document.getElementById("rhythm-game")
        .appendChild(game_view.get_element());
      game.run();
    }).catch((err) => console.log(err));
  }
}
