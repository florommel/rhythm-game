// Copying and distribution of this file, with or without modification, are
// permitted in any medium without royalty.  This file is offered as-is, without
// any warranty.

const fs = require('fs');
const path = require('path');

let challenge_files = fs.readdirSync(__dirname)
  .filter((name) => name.endsWith('.json'))
  .sort((a, b) => a.localeCompare(b));

let challenge_index = challenge_files.reduce((acc, filename) => {
  let key = filename.substring(0, filename.length-5);
  let content = fs.readFileSync(path.join(__dirname, filename),
                                { encoding: 'utf8' });
  try {
    let object = JSON.parse(content);

    if (typeof(object) != 'object') {
      throw new Error("Challenge must be of type 'object'.");
    }
    if (object.title == undefined) {
      throw new Error("Property 'title' must be defined.");
    }
    if (typeof(object.title) != 'string') {
      throw new Error("Property 'title' must be of type string.");
    }
    if (object.difficulty == undefined) {
      throw new Error("Property 'difficulty' must be defined.");
    }
    if (object.difficulty < 1 || object.difficulty > 5) {
      throw new Error("Property 'difficulty' must be a value between 1 and 5.");
    }
    if (!Number.isInteger(object.difficulty)) {
      throw new Error("Property 'difficulty' must be a integer value.");
    }

    acc.push({ name: key, title: object.title, difficulty: object.difficulty,
               levels: object.levels.length });

  } catch (e) {
    console.error(`Error: ${filename}: ${e.message}`);
  }
  return acc;
}, []);

challenge_index.sort((a, b) => a.difficulty - b.difficulty);

fs.writeSync(1, JSON.stringify(challenge_index));
