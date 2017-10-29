"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var input = exports.input = "\n  import { reify } from \"flow-runtime\";\n  import type { Type } from \"flow-runtime\";\n\n  type A = {a: number};\n  type B = {b: number};\n  type C = A | B;\n\n  const checkC = (reify: Type<C>);\n";

var expected = exports.expected = "\n  import { reify } from \"flow-runtime\";\n  import { Type as _Type } from \"flow-runtime\";\n  import t from \"flow-runtime\";\n  const Type = t.tdz(() => _Type);\n\n  const A = t.type(\"A\", t.object(\n    t.property(\"a\", t.number())\n  ));\n  const B = t.type(\"B\", t.object(\n    t.property(\"b\", t.number())\n  ));\n  const C = t.type(\"C\", t.union(A, B));\n\n  const checkC = C;\n";

var reifiedOnly = exports.reifiedOnly = "\n  import { reify } from \"flow-runtime\";\n  import { Type as _Type } from \"flow-runtime\";\n  import t from \"flow-runtime\";\n  const Type = t.tdz(() => _Type);\n\n  const A = t.type(\"A\", t.object(\n    t.property(\"a\", t.number())\n  ));\n  const B = t.type(\"B\", t.object(\n    t.property(\"b\", t.number())\n  ));\n  const C = t.type(\"C\", t.union(A, B));\n  \n  const checkC = C;\n";