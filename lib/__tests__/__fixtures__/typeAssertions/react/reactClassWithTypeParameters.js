"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var input = exports.input = "\n  import React from \"react\";\n\n  type Props = {\n    x: number;\n    y: number;\n  };\n\n  class Point extends React.Component<void, Props, void> {\n    render() {\n      return <div>{this.props.x} : {this.props.y}</div>;\n    }\n  }\n";

var expected = exports.expected = "\n  import React from \"react\";\n  import t from \"flow-runtime\";\n\n  const Props = t.type(\"Props\", t.object(\n    t.property(\"x\", t.number()),\n    t.property(\"y\", t.number())\n  ));\n\n  class Point extends React.Component {\n    static propTypes = t.propTypes(Props);\n\n    constructor(...args) {\n      super(...args);\n      t.bindTypeParameters(this, t.void(), Props, t.void());\n    }\n\n    render() {\n      return <div>{this.props.x} : {this.props.y}</div>;\n    }\n  }\n";