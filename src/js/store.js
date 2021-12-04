/**
 * Copyright (C) 2020 Florian Rommel
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

var Store = {};

Store.STORE_VERSION = 1;

Store.get_challenge = function(name) {
    return JSON.parse(localStorage.getItem("challenges/" + name));
}

Store.set_challenge = function(name, score, max_score, challenge_version) {
    let obj = {
        store_version: Store.STORE_VERSION,
        challenge_version,
        score,
        max_score,
        date: new Date(),
    };
    localStorage.setItem("challenges/" + name, JSON.stringify(obj));
}
