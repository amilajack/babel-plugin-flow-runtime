"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var input = exports.input = "\n  import t from \"babel-types\";\n  type Demo = number;\n";

var expected = exports.expected = "\n  import t from \"babel-types\";\n  import _t from \"flow-runtime\";\n  const Demo = _t.type(\"Demo\", _t.number());\n";