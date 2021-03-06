"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var input = exports.input = "\n  import { type Demo } from './simplestExportType';\n\n  type Local = number;\n\n  type Item = {\n    local: Local;\n    value: Demo;\n  };\n";

var expected = exports.expected = "\n  import { Demo as _Demo } from './simplestExportType';\n  import t from \"flow-runtime\";\n  const Demo = t.tdz(() => _Demo);\n\n  const Local = t.type(\"Local\", t.number());\n\n  const Item = t.type(\"Item\", t.object(\n    t.property(\"local\", Local),\n    t.property(\"value\", t.ref(Demo))\n  ));\n";