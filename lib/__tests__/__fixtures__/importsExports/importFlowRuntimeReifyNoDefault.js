"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var input = exports.input = "\n  import { reify } from \"flow-runtime\";\n  import type { Type } from \"flow-runtime\";\n  type Demo = number;\n  console.log((reify: Type<Demo>));\n";

var expected = exports.expected = "\n  import { reify } from \"flow-runtime\";\n  import { Type as _Type } from \"flow-runtime\";\n  import t from \"flow-runtime\";\n  const Type = t.tdz(() => _Type);\n  const Demo = t.type(\"Demo\", t.number());\n  console.log(Demo);\n";