// Copying and distribution of this file, with or without modification, are
// permitted in any medium without royalty.  This file is offered as-is, without
// any warranty.

const DOMParser = require('xmldom').DOMParser;
const XMLSerializer = require('xmldom').XMLSerializer;
const fs = require('fs');
const path = require('path');

let svg_files = fs.readdirSync(__dirname)
    .filter((name) => name.endsWith('.svg'));

let notation = svg_files.reduce((acc, filename) => {
  let key = filename.substring(0, filename.length-4);
  let content = fs.readFileSync(path.join(__dirname, filename),
                                { encoding: 'utf8' });

  let doc = new DOMParser().parseFromString(content);
  let svg_node = null;
  for(let i = 0; i < doc.childNodes.length; i++) {
    if (doc.childNodes.item(i).nodeName == 'svg') {
      svg_node = doc.childNodes.item(i);
      break;
    }
  }

  let serializer = new XMLSerializer();
  let str = '';
  for(let i = 0; i < svg_node.childNodes.length; i++) {
    let item = svg_node.childNodes.item(i);
    if ((item.nodeType == 1) && (item.nodeValue == null)) {
      item.namespaceURI = null;
      str += serializer.serializeToString(item)
        .replace(/<([a-zA-Z0-9 ]+)(?:xml)ns=\".*\"(.*)>/g, "<$1$2>");
    }
  }

  acc[key] = str.trim().replace(/\s+/g, ' ');
  return acc;
}, {});

fs.writeSync(1, "var Notation = " + JSON.stringify(notation));
