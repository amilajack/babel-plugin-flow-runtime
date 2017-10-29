"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var input = exports.input = "\n  class Point <T: number> {\n    x: T = 0;\n    y: T = 0;\n\n    constructor (x: T, y: T) {\n      this.x = x;\n      this.y = y;\n    }\n\n    static create (x: T, y: T): Point<T> {\n      return new Point(x, y);\n    }\n  }\n";

var expected = exports.expected = "\n  import t from \"flow-runtime\";\n\n  const _PointTypeParametersSymbol = Symbol(\"PointTypeParameters\");\n\n  class Point {\n\n    static [t.TypeParametersSymbol] = _PointTypeParametersSymbol;\n\n    @t.decorate(function () {\n      return t.flowInto(this[_PointTypeParametersSymbol].T);\n    })\n    x = 0;\n    @t.decorate(function () {\n      return t.flowInto(this[_PointTypeParametersSymbol].T);\n    })\n    y = 0;\n\n    constructor(x, y) {\n      this[_PointTypeParametersSymbol] = {\n        T: t.typeParameter(\"T\", t.number())\n      };\n      let _xType = t.flowInto(this[_PointTypeParametersSymbol].T);\n      let _yType = t.flowInto(this[_PointTypeParametersSymbol].T);\n      t.param(\"x\", _xType).assert(x);\n      t.param(\"y\", _yType).assert(y);\n      this.x = x;\n      this.y = y;\n    }\n\n    static create(x, y) {\n      const _typeParameters = {\n        T: t.typeParameter(\"T\", t.number())\n      };\n      let _xType2 = t.flowInto(_typeParameters.T);\n      let _yType2 = t.flowInto(_typeParameters.T);\n      const _returnType = t.return(t.ref(Point, _typeParameters.T));\n      t.param(\"x\", _xType2).assert(x);\n      t.param(\"y\", _yType2).assert(y);\n      return _returnType.assert(new Point(x, y));\n    }\n  }\n";

var annotated = exports.annotated = "\n  import t from \"flow-runtime\";\n\n  @t.annotate(t.class(\"Point\", Point => {\n    const T = Point.typeParameter(\"T\", t.number());\n    return [\n      t.property(\"x\", t.flowInto(T)),\n      t.property(\"y\", t.flowInto(T)),\n      t.method(\n        \"constructor\",\n        t.param(\"x\", t.flowInto(T)),\n        t.param(\"y\", t.flowInto(T))\n      ),\n      t.staticMethod(\n        \"create\",\n        t.param(\"x\", t.flowInto(T)),\n        t.param(\"y\", t.flowInto(T)),\n        t.return(t.ref(Point, T))\n      )\n    ];\n  }))\n  class Point {\n    x = 0;\n    y = 0;\n\n    constructor(x, y) {\n      this.x = x;\n      this.y = y;\n    }\n\n    static create(x, y) {\n      return new Point(x, y);\n    }\n  }\n";

var combined = exports.combined = "\n  import t from \"flow-runtime\";\n\n  const _PointTypeParametersSymbol = Symbol(\"PointTypeParameters\");\n\n  @t.annotate(t.class(\"Point\", Point => {\n    const T = Point.typeParameter(\"T\", t.number());\n    return [\n      t.property(\"x\", t.flowInto(T)),\n      t.property(\"y\", t.flowInto(T)),\n      t.method(\n        \"constructor\",\n        t.param(\"x\", t.flowInto(T)),\n        t.param(\"y\", t.flowInto(T))\n      ),\n      t.staticMethod(\n        \"create\",\n        t.param(\"x\", t.flowInto(T)),\n        t.param(\"y\", t.flowInto(T)),\n        t.return(t.ref(Point, T))\n      )\n    ];\n  }))\n  class Point {\n\n    static [t.TypeParametersSymbol] = _PointTypeParametersSymbol;\n\n    @t.decorate(function () {\n      return t.flowInto(this[_PointTypeParametersSymbol].T);\n    })\n    x = 0;\n    @t.decorate(function () {\n      return t.flowInto(this[_PointTypeParametersSymbol].T);\n    })\n    y = 0;\n\n    constructor(x, y) {\n      this[_PointTypeParametersSymbol] = {\n        T: t.typeParameter(\"T\", t.number())\n      };\n      let _xType = t.flowInto(this[_PointTypeParametersSymbol].T);\n      let _yType = t.flowInto(this[_PointTypeParametersSymbol].T);\n      t.param(\"x\", _xType).assert(x);\n      t.param(\"y\", _yType).assert(y);\n      this.x = x;\n      this.y = y;\n    }\n\n    static create(x, y) {\n      const _typeParameters = {\n        T: t.typeParameter(\"T\", t.number())\n      };\n      let _xType2 = t.flowInto(_typeParameters.T);\n      let _yType2 = t.flowInto(_typeParameters.T);\n      const _returnType = t.return(t.ref(Point, _typeParameters.T));\n      t.param(\"x\", _xType2).assert(x);\n      t.param(\"y\", _yType2).assert(y);\n      return _returnType.assert(new Point(x, y));\n    }\n  }\n";