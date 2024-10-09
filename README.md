# A Rhythm Game

Test your rhythmic skills! Follow the notes displayed on the screen
and replicate the rhythm by tapping on your touch device or keyboard.

Play it: https://florommel.de/rhythm


## Build and run it yourself

Get the build dependencies (there are no runtime dependencies).
```sh
$ npm install
```

Then, build the game:
```sh
$ make
```

To run the game, serve `dist` and open `index.html` in your browser.


## Create new challenges

Challenges are json files located in `src/challenges/`.

A challenge file has the following top-level fields:
- `title`: string
- `difficulty`: integer between 1 and 5
- `levels`: Array of level objects.

Each level object has the following fields
- `title`: string
- `time_signature`: string in the format of `integer/integer`
- `bpm`: integer; beats per minute for this level
- `no_playback`: boolean [can be omitted];
   if true, the rhythm is not played back before the user has to tap.
- `rhythm`: a rhythm string, see below
   
A rhythm string determines the rhythm and the displayed notes.
It consists of notes `n` and rests `p`, combined with a denominator value,
e.g., `n4` represent a quarter note, `p2` a half-note rest, and `n12` an
eighth-note triplet.  Add a plus to create a dotted note, e.g., `n4+`.
The game currently supports the following denominator values:
`1, 2, 4, 6, 8, 12, 16`.

Notes are separated by spaces.  Bars are separated by pipe symbols `|`.
Usually, a new bar is put into a new line.  Add a `&` directly after the `|`
to avoid the line break (`|&`).

Some notes (`n8`, `n12`, `n16`) can be beamed by adding a `b` to (only) the
subsequent note(s), e.g., `n8 n8b` creates to beamed eight notes,
`n8 n8b n8b n8b` creates four beamed eight notes.

Currently, there is no semantic validation of the rhythm string.
