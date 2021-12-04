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

function rhythm_game_run() {
  document.onselectstart = function() { return false; }
  document.onmousedown = function() { return false; }

  Controller.init().then(() => {
    load_challenge_index().then((challenge_index) => {
      let router = get_router(challenge_index);
      window.addEventListener("hashchange", router);
      router();
    }).catch((err) => console.log(err));
  }).catch((err) => console.log(err));
}


function get_router(challenge_index) {
  let router = () => {
    let route = location.hash.slice(1);

    document.getElementById("rhythm-game").innerHTML = "";
    Controller.clear_all();

    if (route == '') {
      let menu_view = new MenuView(challenge_index);
      document.getElementById("rhythm-game")
        .appendChild(menu_view.get_element());

    } else {
      Challenge.load(route).then((challenge) => {
        let game_view = new GameView();
        let game = new Game(router, challenge, game_view);
        document.getElementById("rhythm-game")
          .appendChild(game_view.get_element());
        game.run();
      }).catch((err) => console.log(err));
    }
  };
  return router;
}


function load_challenge_index() {
  return new Promise((resolve, reject) => {
    let request = new XMLHttpRequest();
    request.open("GET", "challenge_index.json", true);
    request.responseType = "json";
    request.onload = () => {
      resolve(request.response);
    }
    request.onerror = () => {
      reject(new Error("Error while loading 'challenge_index.json'."));
    }
    request.send();
  });
}
