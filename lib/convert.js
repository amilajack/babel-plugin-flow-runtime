'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _babelTypes = require('babel-types');

var t = _interopRequireWildcard(_babelTypes);

var _getTypeParameters = require('./getTypeParameters');

var _getTypeParameters2 = _interopRequireDefault(_getTypeParameters);

var _typeAnnotationIterator = require('./typeAnnotationIterator');

var _typeAnnotationIterator2 = _interopRequireDefault(_typeAnnotationIterator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var converters = {};

/**
 * Convert a type definition to a typed method call.
 */
function convert(context, path) {
  var loc = path.node.loc;
  var converter = converters[path.type];
  if (!converter) {
    if (path.isClass()) {
      converter = converters.Class;
    } else if (path.isFunction()) {
      converter = converters.Function;
    } else {
      console.warn('Unsupported node type: ' + path.type + ', please report this issue at http://github.com/codemix/flow-runtime/issues');
      var fallback = context.call('any');
      fallback.loc = loc;
      return fallback;
    }
  }
  var result = converter(context, path);
  if (result && loc) {
    result.loc = loc;
  }
  return result;
}

function annotationReferencesId(annotation, name) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _typeAnnotationIterator2.default)(annotation)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var item = _step.value;

      if (item.type === 'Identifier' && item.node.name === name) {
        return true;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return false;
}

/**
 * Determine whether a given type parameter exists in a position where
 * values it receives should flow into the union of types the annotation
 * allows. For example, given a function like `<T> (a: T, b: T) => T`,
 * T should be a union of whatever `a` and `b` are.
 *
 * If the annotation exists in a function parameter, it is considered flowable.
 */
function typeParameterCanFlow(annotation) {
  var subject = annotation.parentPath;
  while (subject) {
    if (subject.isClassProperty()) {
      return true;
    } else if (subject.isFlow()) {
      subject = subject.parentPath;
      continue;
    } else if (subject.isStatement()) {
      return false;
    } else if (subject.__flowRuntime__wasParam || subject.node.__flowRuntime__wasParam) {
      return true;
    }
    if (subject.isIdentifier() || subject.isArrayPattern() || subject.isObjectPattern()) {
      if (subject.parentPath.isFunction() && subject.listKey === 'params') {
        return true;
      }
    }
    subject = subject.parentPath;
  }

  return false;
}

function annotationParentHasTypeParameter(annotation, name) {
  var subject = annotation.parentPath;
  while (subject && subject.isFlow()) {
    var typeParameters = (0, _getTypeParameters2.default)(subject);
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = typeParameters[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var typeParameter = _step2.value;

        if (typeParameter.node.name === name) {
          return true;
        }
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    subject = subject.parentPath;
  }
  return false;
}

function parentIsStaticMethod(subject) {
  var fn = subject.findParent(function (item) {
    return item.isClassMethod();
  });
  if (!fn) {
    return false;
  }
  return fn.node.static;
}

function parentIsClassConstructorWithSuper(subject) {
  var fn = subject.findParent(function (item) {
    return item.isClassMethod() && item.node.kind === 'constructor';
  });
  if (!fn) {
    return false;
  }
  var classDefinition = fn.parentPath.parentPath;
  if (classDefinition.has('superClass')) {
    return true;
  } else {
    return parentIsClassConstructorWithSuper(classDefinition.parentPath);
  }
}

function qualifiedToMemberExpression(context, path) {
  var current = path;
  var stack = [];
  while (current.type === 'QualifiedTypeIdentifier') {
    stack.unshift(current.node.id);
    current = current.get('qualification');
  }

  var first = current.node;
  var second = stack[0];

  // is this a type or a value?
  var entity = context.getEntity(first.name, path);
  var isType = false;
  var isDirectlyReferenceable = false;
  if (entity) {
    if (entity.isValue) {
      isDirectlyReferenceable = true;
    } else {
      isType = true;
      if (entity.isGlobal) {
        isDirectlyReferenceable = false;
      } else {
        isDirectlyReferenceable = true;
      }
    }
  } else {
    isType = true;
  }

  if (!isDirectlyReferenceable) {

    var args = [t.stringLiteral(first.name), t.stringLiteral(second.name)];
    for (var i = 1; i < stack.length; i++) {
      args.push(t.stringLiteral(stack[i]));
    }

    return context.call.apply(context, ['get'].concat(args));
  } else if (isType) {
    var _args = [first, t.stringLiteral(second.name)];
    for (var _i = 1; _i < stack.length; _i++) {
      _args.push(t.stringLiteral(stack[_i]));
    }

    return context.call.apply(context, ['get'].concat(_args));
  } else {

    var inner = t.memberExpression(first, second);

    for (var _i2 = 1; _i2 < stack.length; _i2++) {
      inner = t.memberExpression(inner, stack[_i2]);
    }
    return inner;
  }
}

function annotationToValue(context, subject) {
  switch (subject.type) {
    case 'NullableTypeAnnotation':
    case 'TypeAnnotation':
      return annotationToValue(context, subject.get('typeAnnotation'));
    case 'GenericTypeAnnotation':
      return annotationToValue(context, subject.get('id'));
    case 'QualifiedTypeIdentifier':
      return qualifiedToMemberExpression(context, subject);
    case 'NullLiteralTypeAnnotation':
      return t.nullLiteral();
    case 'VoidTypeAnnotation':
      return t.identifier('undefined');
    case 'BooleanLiteralTypeAnnotation':
      return t.booleanLiteral(subject.node.value);
    case 'NumericLiteralTypeAnnotation':
      return t.numericLiteral(subject.node.value);
    case 'StringLiteralTypeAnnotation':
      return t.stringLiteral(subject.node.value);

    default:
      return subject.node;
  }
}

function getMemberExpressionObject(subject) {
  if (subject.type === 'MemberExpression') {
    return getMemberExpressionObject(subject.object);
  } else {
    return subject;
  }
}

converters.DeclareVariable = function (context, path) {
  var id = path.get('id');
  if (id.has('typeAnnotation')) {
    return context.call('declare', context.call('var', t.stringLiteral(id.node.name), convert(context, id.get('typeAnnotation'))));
  } else {
    return context.call('declare', context.call('var', t.stringLiteral(id.node.name)));
  }
};

converters.DeclareTypeAlias = function (context, path) {
  var id = path.get('id');
  var right = path.get('right');
  return context.call('declare', context.call('type', t.stringLiteral(id.node.name), convert(context, right)));
};

converters.DeclareFunction = function (context, path) {
  var id = path.get('id');
  if (id.has('typeAnnotation')) {
    return context.call('declare', t.stringLiteral(id.node.name), convert(context, id.get('typeAnnotation')));
  } else {
    return context.call('declare', t.stringLiteral(id.node.name));
  }
};

converters.DeclareModule = function (context, path) {
  var id = path.get('id');
  var name = id.isIdentifier() ? id.node.name : id.node.value;
  return context.call('declare', context.call('module', t.stringLiteral(name), t.arrowFunctionExpression([t.identifier(context.libraryId)], t.blockStatement(path.get('body.body').map(function (item) {
    var converted = convert(context, item);
    if (t.isExpression(converted)) {
      return t.expressionStatement(convert(context, item));
    } else {
      return converted;
    }
  })))));
};

converters.DeclareModuleExports = function (context, path) {
  return context.call('moduleExports', convert(context, path.get('typeAnnotation')));
};

converters.InterfaceDeclaration = function (context, path) {
  var name = path.node.id.name;
  var typeParameters = (0, _getTypeParameters2.default)(path);
  var body = convert(context, path.get('body'));
  if (typeParameters.length > 0) {
    body = t.arrowFunctionExpression([t.identifier(name)], t.blockStatement([t.variableDeclaration('const', typeParameters.map(function (typeParameter) {
      return declareTypeParameter(context, name, typeParameter);
    })), t.returnStatement(body)]));
  } else if (annotationReferencesId(path.get('body'), name)) {
    // This type alias references itself, we need to wrap it in an arrow
    body = t.arrowFunctionExpression([t.identifier(name)], t.blockStatement([t.returnStatement(body)]));
  }

  if (path.has('extends')) {
    body = context.call.apply(context, ['intersect'].concat(_toConsumableArray(path.get('extends').map(function (item) {
      return convert(context, item);
    })), [body]));
  }

  return t.variableDeclaration('const', [t.variableDeclarator(t.identifier(name), context.call('type', t.stringLiteral(name), body))]);
};

converters.InterfaceExtends = function (context, path) {
  var id = path.get('id');
  var method = 'extends';
  if (path.parentPath.isInterfaceDeclaration()) {
    method = 'ref';
  }
  var name = void 0;
  var subject = void 0;
  if (id.isQualifiedTypeIdentifier()) {
    subject = qualifiedToMemberExpression(context, id);
    var outer = getMemberExpressionObject(subject);
    name = outer.name;
  } else {
    name = id.node.name;
    subject = t.identifier(name);
  }
  var typeParameters = (0, _getTypeParameters2.default)(path).map(function (item) {
    return convert(context, item);
  });
  var entity = context.getEntity(name, path);

  var isDirectlyReferenceable = annotationParentHasTypeParameter(path, name) || entity && (entity.isTypeAlias || entity.isTypeParameter);

  if (isDirectlyReferenceable) {
    if (typeParameters.length > 0) {
      return context.call.apply(context, [method, subject].concat(_toConsumableArray(typeParameters)));
    } else {
      return subject;
    }
  } else if (!entity) {
    return context.call.apply(context, [method, t.stringLiteral(name)].concat(_toConsumableArray(typeParameters)));
  } else {
    return context.call.apply(context, [method, subject].concat(_toConsumableArray(typeParameters)));
  }
};

converters.DeclareClass = function (context, path) {
  var id = path.get('id');
  var name = id.node.name;

  var extra = [];

  if (path.has('extends')) {
    var interfaceExtends = path.get('extends').map(function (item) {
      return convert(context, item);
    });
    extra.push.apply(extra, _toConsumableArray(interfaceExtends));
  }

  var typeParameters = (0, _getTypeParameters2.default)(path);
  if (typeParameters.length > 0) {
    var uid = path.scope.generateUidIdentifier(name);
    return context.call('declare', context.call('class', t.stringLiteral(name), t.arrowFunctionExpression([uid], t.blockStatement([t.variableDeclaration('const', typeParameters.map(function (typeParameter) {
      return declareTypeParameter(context, uid.name, typeParameter);
    })), t.returnStatement(t.arrayExpression([convert(context, path.get('body'))].concat(extra)))]))));
  } else {
    return context.call('declare', context.call.apply(context, ['class', t.stringLiteral(name), convert(context, path.get('body'))].concat(extra)));
  }
};

converters.TypeAlias = function (context, path) {
  var name = path.node.id.name;
  var typeParameters = (0, _getTypeParameters2.default)(path);
  var body = convert(context, path.get('right'));
  if (typeParameters.length > 0) {
    body = t.arrowFunctionExpression([t.identifier(name)], t.blockStatement([t.variableDeclaration('const', typeParameters.map(function (typeParameter) {
      return declareTypeParameter(context, name, typeParameter);
    })), t.returnStatement(body)]));
  } else if (annotationReferencesId(path.get('right'), path.node.id.name)) {
    // This type alias references itself, we need to wrap it in an arrow
    body = t.arrowFunctionExpression([t.identifier(name)], t.blockStatement([t.returnStatement(body)]));
  }
  var entity = context.getEntity(name, path);
  if (context.shouldGenerateReifiedOnly && (!entity || !entity.reified)) {
    return path.node;
  }
  return t.variableDeclaration('const', [t.variableDeclarator(t.identifier(name), context.call('type', t.stringLiteral(name), body))]);
};

converters.TypeofTypeAnnotation = function (context, path) {
  var value = annotationToValue(context, path.get('argument'));
  if (value.type === 'CallExpression') {
    // this is a reference to a type
    return value;
  } else {
    return context.call('typeOf', value);
  }
};

converters.TypeParameter = function (context, path) {
  if (path.has('bound')) {
    return context.call('typeParameter', t.stringLiteral(path.node.name), convert(context, path.get('bound')));
  } else {
    return context.call('typeParameter', t.stringLiteral(path.node.name));
  }
};

converters.TypeAnnotation = function (context, path) {
  return convert(context, path.get('typeAnnotation'));
};

converters.NullableTypeAnnotation = function (context, path) {
  return context.call('nullable', convert(context, path.get('typeAnnotation')));
};

converters.NullLiteralTypeAnnotation = function (context, _ref) {
  var node = _ref.node;

  return context.call('null');
};

converters.AnyTypeAnnotation = function (context, _ref2) {
  var node = _ref2.node;

  return context.call('any');
};

converters.MixedTypeAnnotation = function (context, _ref3) {
  var node = _ref3.node;

  return context.call('mixed');
};

converters.ExistentialTypeParam = function (context, _ref4) {
  var node = _ref4.node;

  return context.call('existential');
};

// Duplicated for compatibility with flow-parser.
converters.ExistsTypeAnnotation = function (context, _ref5) {
  var node = _ref5.node;

  return context.call('existential');
};

converters.EmptyTypeAnnotation = function (context, _ref6) {
  var node = _ref6.node;

  return context.call('empty');
};

converters.NumberTypeAnnotation = function (context, _ref7) {
  var node = _ref7.node;

  return context.call('number');
};

converters.NumericLiteralTypeAnnotation = function (context, _ref8) {
  var node = _ref8.node;

  return context.call('number', t.numericLiteral(node.value));
};

// Duplicated for compatibility with flow-parser.
converters.NumberLiteralTypeAnnotation = function (context, _ref9) {
  var node = _ref9.node;

  return context.call('number', t.numericLiteral(node.value));
};

converters.BooleanTypeAnnotation = function (context, _ref10) {
  var node = _ref10.node;

  return context.call('boolean');
};

converters.BooleanLiteralTypeAnnotation = function (context, _ref11) {
  var node = _ref11.node;

  return context.call('boolean', t.booleanLiteral(node.value));
};

converters.StringTypeAnnotation = function (context, _ref12) {
  var node = _ref12.node;

  return context.call('string');
};

converters.StringLiteralTypeAnnotation = function (context, _ref13) {
  var node = _ref13.node;

  return context.call('string', t.stringLiteral(node.value));
};

converters.VoidTypeAnnotation = function (context, _ref14) {
  var node = _ref14.node;

  return context.call('void');
};

converters.UnionTypeAnnotation = function (context, path) {
  var types = path.get('types').map(function (item) {
    return convert(context, item);
  });
  return context.call.apply(context, ['union'].concat(_toConsumableArray(types)));
};

converters.IntersectionTypeAnnotation = function (context, path) {
  var types = path.get('types').map(function (item) {
    return convert(context, item);
  });
  return context.call.apply(context, ['intersection'].concat(_toConsumableArray(types)));
};

converters.ThisTypeAnnotation = function (context, path) {
  if (context.isAnnotating) {
    return context.call('this');
  } else {
    return context.call('this', t.thisExpression());
  }
};

converters.GenericTypeAnnotation = function (context, path) {
  var id = path.get('id');
  var name = void 0;
  var subject = void 0;
  if (id.isQualifiedTypeIdentifier()) {
    subject = qualifiedToMemberExpression(context, id);
    var outer = getMemberExpressionObject(subject);
    name = outer.name;
  } else {
    name = id.node.name;
    subject = t.identifier(name);
  }
  if (context.shouldSuppressTypeName(name)) {
    return context.call('any');
  }
  if (context.inTDZ(id.node)) {
    subject = context.call('tdz', t.arrowFunctionExpression([], subject), t.stringLiteral(name));
  }
  var typeParameters = (0, _getTypeParameters2.default)(path).map(function (item) {
    return convert(context, item);
  });
  var entity = context.getEntity(name, path);

  if (!entity) {
    if (name === 'Array') {
      return context.call.apply(context, ['array'].concat(_toConsumableArray(typeParameters)));
    } else if (name === 'Function') {
      return context.call('function');
    } else if (name === 'Object') {
      return context.call('object');
    }
  }

  var isTypeParameter = entity && entity.isTypeParameter || context.isAnnotating && entity && entity.isClassTypeParameter || annotationParentHasTypeParameter(path, name);

  if (isTypeParameter && typeParameterCanFlow(path)) {
    subject = context.call('flowInto', subject);
  }

  var isDirectlyReferenceable = isTypeParameter || entity && entity.isTypeAlias;

  if (isDirectlyReferenceable) {
    if (typeParameters.length > 0) {
      return context.call.apply(context, ['ref', subject].concat(_toConsumableArray(typeParameters)));
    } else {
      return subject;
    }
  } else if (!entity) {
    var flowTypeName = context.getFlowTypeName(name);
    if (flowTypeName) {
      return context.call.apply(context, [flowTypeName].concat(_toConsumableArray(typeParameters)));
    } else {
      return context.call.apply(context, ['ref', t.stringLiteral(name)].concat(_toConsumableArray(typeParameters)));
    }
  } else if (entity.isClassTypeParameter) {
    var target = void 0;
    var typeParametersUid = context.getClassData(path, 'typeParametersUid');
    var typeParametersSymbolUid = context.getClassData(path, 'typeParametersSymbolUid');
    if (typeParametersUid && parentIsStaticMethod(path)) {
      target = t.memberExpression(t.identifier(typeParametersUid), subject);
    } else if (typeParametersUid && parentIsClassConstructorWithSuper(path)) {
      target = t.memberExpression(t.identifier(typeParametersUid), subject);
    } else if (typeParametersSymbolUid) {
      target = t.memberExpression(t.memberExpression(t.thisExpression(), t.identifier(typeParametersSymbolUid), true), subject);
    } else {
      target = t.memberExpression(t.memberExpression(t.thisExpression(), t.memberExpression(t.thisExpression(), context.symbol('TypeParameters'), true), true), subject);
    }

    if (typeParameterCanFlow(path)) {
      target = context.call('flowInto', target);
    }

    if (typeParameters.length > 0) {
      return context.call.apply(context, ['ref', target].concat(_toConsumableArray(typeParameters)));
    } else {
      return target;
    }
  } else {
    return context.call.apply(context, ['ref', subject].concat(_toConsumableArray(typeParameters)));
  }
};

converters.ArrayTypeAnnotation = function (context, path) {
  var elementType = convert(context, path.get('elementType'));
  return context.call('array', elementType);
};

converters.TupleTypeAnnotation = function (context, path) {
  var types = path.get('types').map(function (item) {
    return convert(context, item);
  });
  return context.call.apply(context, ['tuple'].concat(_toConsumableArray(types)));
};

converters.ObjectTypeAnnotation = function (context, path) {
  var _path$get$reduce = path.get('properties').reduce(function (_ref15, property) {
    var _ref16 = _slicedToArray(_ref15, 3),
        properties = _ref16[0],
        seen = _ref16[1],
        seenStatic = _ref16[2];

    var key = property.get('key');
    if (property.type === 'ObjectTypeSpreadProperty' || property.node.computed) {
      properties.push(property);
    } else if (property.node.static) {
      var existing = seenStatic.get(key.node.name);
      if (existing) {
        if (existing.node.value.type === 'UnionTypeAnnotation') {
          existing.node.value.types.push(property.node.value);
        } else {
          existing.node.value = t.unionTypeAnnotation([existing.node.value, property.node.value]);
        }
      } else {
        seenStatic.set(key.node.name, property);
        properties.push(property);
      }
    } else {
      var _existing = seen.get(key.node.name);
      if (_existing) {
        if (_existing.node.value.type === 'UnionTypeAnnotation') {
          _existing.node.value.types.push(property.node.value);
        } else {
          _existing.node.value = t.unionTypeAnnotation([_existing.node.value, property.node.value]);
        }
      } else {
        seen.set(key.node.name, property);
        properties.push(property);
      }
    }
    return [properties, seen, seenStatic];
  }, [[], new Map(), new Map()]),
      _path$get$reduce2 = _slicedToArray(_path$get$reduce, 1),
      properties = _path$get$reduce2[0];

  var body = [].concat(_toConsumableArray(path.get('callProperties')), _toConsumableArray(properties), _toConsumableArray(path.get('indexers')));
  return context.call.apply(context, [path.node.exact ? 'exactObject' : 'object'].concat(_toConsumableArray(body.map(function (item) {
    return convert(context, item);
  }))));
};

converters.ObjectTypeSpreadProperty = function (context, path) {
  var arg = convert(context, path.get('argument'));
  return t.spreadElement(t.memberExpression(arg, t.identifier('properties')));
};

converters.ObjectTypeCallProperty = function (context, path) {
  var methodName = path.node.static ? 'staticCallProperty' : 'callProperty';
  return context.call(methodName, convert(context, path.get('value')));
};

converters.ObjectTypeProperty = function (context, path) {
  var propName = void 0;
  if (!path.node.computed && path.get('key').isIdentifier()) {
    propName = t.stringLiteral(path.node.key.name);
  } else {
    propName = path.node.key;
  }
  var value = convert(context, path.get('value'));
  var methodName = path.node.static ? 'staticProperty' : 'property';
  if (path.node.optional) {
    return context.call(methodName, propName, value, t.booleanLiteral(true));
  } else {
    return context.call(methodName, propName, value);
  }
};

converters.ObjectTypeIndexer = function (context, path) {
  var name = "key";
  if (path.node.id) {
    name = path.node.id.name;
  }
  return context.call('indexer', t.stringLiteral(name), convert(context, path.get('key')), convert(context, path.get('value')));
};

converters.FunctionTypeAnnotation = function (context, path) {
  var body = [].concat(_toConsumableArray(path.get('params').map(function (item) {
    return convert(context, item);
  })));
  if (path.has('rest')) {
    body.push(convert(context, path.get('rest')));
  }
  if (path.has('returnType')) {
    body.push(context.call('return', convert(context, path.get('returnType'))));
  }
  var typeParameters = (0, _getTypeParameters2.default)(path);
  if (typeParameters.length > 0) {
    var _name = path.scope.generateUid('fn');

    return context.call('function', t.arrowFunctionExpression([t.identifier(_name)], t.blockStatement([t.variableDeclaration('const', typeParameters.map(function (typeParameter) {
      return declareTypeParameter(context, _name, typeParameter);
    })), t.returnStatement(t.arrayExpression(body))])));
  } else {
    return context.call.apply(context, ['function'].concat(_toConsumableArray(body)));
  }
};

function declareTypeParameter(context, name, typeParameter) {
  var args = [t.stringLiteral(typeParameter.node.name)];
  if (typeParameter.node.bound) {
    args.push(convert(context, typeParameter.get('bound')));
    if (typeParameter.node.default) {
      args.push(convert(context, typeParameter.get('default')));
    }
  } else if (typeParameter.node.default) {
    args.push(t.identifier('undefined'), convert(context, typeParameter.get('default')));
  }
  return t.variableDeclarator(t.identifier(typeParameter.node.name), t.callExpression(t.memberExpression(t.identifier(name), t.identifier('typeParameter')), args));
}

converters.FunctionTypeParam = function (context, path) {
  var name = void 0;
  if (path.has('name')) {
    name = path.node.name.name;
  } else {
    name = '_arg' + path.key;
  }
  var optional = path.node.optional;
  var args = [t.stringLiteral(name), convert(context, path.get('typeAnnotation'))];
  if (optional) {
    args.push(t.booleanLiteral(true));
  }
  if (path.key === 'rest') {
    return context.call.apply(context, ['rest'].concat(args));
  } else {
    return context.call.apply(context, ['param'].concat(args));
  }
};

// ---- CONCRETE NODES ----
// Everything after here deals with converting "real" nodes instead of flow nodes.


function functionToArgs(context, path) {
  var params = path.get('params');

  var typeParameters = (0, _getTypeParameters2.default)(path);

  var shouldBox = typeParameters.length > 0;

  var invocations = [];

  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = params[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var param = _step3.value;

      var argumentIndex = +param.key;
      var argumentName = void 0;
      if (param.isAssignmentPattern()) {
        param = param.get('left');
      }

      if (param.isIdentifier()) {
        argumentName = param.node.name;
      } else if (param.isRestElement()) {
        argumentName = param.node.argument.name;
      } else {
        argumentName = '_arg' + (argumentIndex === 0 ? '' : argumentIndex);
      }

      if (!param.has('typeAnnotation')) {
        invocations.push(context.call('param', t.stringLiteral(argumentName), context.call('any')));
        continue;
      }

      var typeAnnotation = param.get('typeAnnotation');

      if (param.isIdentifier()) {
        invocations.push(context.call('param', t.stringLiteral(param.node.name), convert(context, typeAnnotation)));
      } else if (param.isRestElement()) {
        invocations.push(context.call('rest', t.stringLiteral(param.node.argument.name), convert(context, typeAnnotation)));
      } else {
        invocations.push(context.call('param', t.stringLiteral(argumentName), convert(context, typeAnnotation)));
      }
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  if (path.has('returnType')) {
    invocations.push(context.call('return', convert(context, path.get('returnType'))));
  }

  if (shouldBox) {
    var declarations = [];
    var fn = path.scope.generateUidIdentifier('fn');

    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = typeParameters[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var typeParameter = _step4.value;
        var _name2 = typeParameter.node.name;


        var args = [t.stringLiteral(_name2)];
        if (typeParameter.has('bound') && typeParameter.has('default')) {
          args.push(convert(context, typeParameter.get('bound')), convert(context, typeParameter.get('default')));
        } else if (typeParameter.has('bound')) {
          args.push(convert(context, typeParameter.get('bound')));
        } else if (typeParameter.has('default')) {
          args.push(t.identifier('undefined'), // make sure we don't confuse bound with default
          convert(context, typeParameter.get('default')));
        }

        declarations.push(t.variableDeclaration('const', [t.variableDeclarator(t.identifier(_name2), t.callExpression(t.memberExpression(fn, t.identifier('typeParameter')), args))]));
      }
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return) {
          _iterator4.return();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }

    return [t.arrowFunctionExpression([fn], t.blockStatement([].concat(declarations, [t.returnStatement(t.arrayExpression(invocations))])))];
  } else {
    return invocations;
  }
}

converters.Function = function (context, path) {
  var args = functionToArgs(context, path);
  return context.call.apply(context, ['function'].concat(_toConsumableArray(args)));
};

converters.Class = function (context, path) {

  var typeParameters = (0, _getTypeParameters2.default)(path);

  var name = path.has('id') ? path.node.id.name : 'AnonymousClass';

  var shouldBox = typeParameters.length > 0;

  var invocations = [];

  var superTypeParameters = path.has('superTypeParameters') ? path.get('superTypeParameters.params') : [];

  var hasSuperTypeParameters = superTypeParameters.length > 0;
  if (path.has('superClass')) {
    if (hasSuperTypeParameters) {
      invocations.push(context.call.apply(context, ['extends', path.node.superClass].concat(_toConsumableArray(superTypeParameters.map(function (item) {
        return convert(context, item);
      })))));
    } else {
      invocations.push(context.call('extends', path.node.superClass));
    }
  }

  var body = path.get('body');

  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    for (var _iterator5 = body.get('body')[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      var child = _step5.value;

      if (child.node.kind === 'constructor' && child.node.params.length === 0) {
        continue;
      }
      invocations.push(convert(context, child));
      if (!shouldBox && annotationReferencesId(child, name)) {
        shouldBox = true;
      }
    }
  } catch (err) {
    _didIteratorError5 = true;
    _iteratorError5 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion5 && _iterator5.return) {
        _iterator5.return();
      }
    } finally {
      if (_didIteratorError5) {
        throw _iteratorError5;
      }
    }
  }

  if (shouldBox) {
    var declarations = [];
    var classId = t.identifier(name);

    var _iteratorNormalCompletion6 = true;
    var _didIteratorError6 = false;
    var _iteratorError6 = undefined;

    try {
      for (var _iterator6 = typeParameters[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
        var typeParameter = _step6.value;
        var _name3 = typeParameter.node.name;


        var args = [t.stringLiteral(_name3)];
        if (typeParameter.has('bound') && typeParameter.has('default')) {
          args.push(convert(context, typeParameter.get('bound')), convert(context, typeParameter.get('default')));
        } else if (typeParameter.has('bound')) {
          args.push(convert(context, typeParameter.get('bound')));
        } else if (typeParameter.has('default')) {
          args.push(t.identifier('undefined'), // make sure we don't confuse bound with default
          convert(context, typeParameter.get('default')));
        }

        declarations.push(t.variableDeclaration('const', [t.variableDeclarator(t.identifier(_name3), t.callExpression(t.memberExpression(classId, t.identifier('typeParameter')), args))]));
      }
    } catch (err) {
      _didIteratorError6 = true;
      _iteratorError6 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion6 && _iterator6.return) {
          _iterator6.return();
        }
      } finally {
        if (_didIteratorError6) {
          throw _iteratorError6;
        }
      }
    }

    return context.call('class', t.stringLiteral(name), t.arrowFunctionExpression([classId], t.blockStatement([].concat(declarations, [t.returnStatement(t.arrayExpression(invocations))]))));
  } else {
    return context.call.apply(context, ['class', t.stringLiteral(name)].concat(invocations));
  }
};

converters.ClassProperty = function (context, path) {
  var typeAnnotation = path.has('typeAnnotation') ? convert(context, path.get('typeAnnotation')) : context.call('any');
  if (path.node.computed) {
    // make an object type indexer
    var keyType = context.call('union', context.call('number'), context.call('string'), context.call('symbol'));
    return context.call('indexer', t.stringLiteral('key'), keyType, typeAnnotation);
  } else if (path.get('key').isIdentifier()) {
    return context.call(path.node.static ? 'staticProperty' : 'property', t.stringLiteral(path.node.key.name), typeAnnotation);
  } else {
    return context.call(path.node.static ? 'staticProperty' : 'property', t.stringLiteral(path.node.key.value), typeAnnotation);
  }
};

converters.ClassMethod = function (context, path) {
  var args = functionToArgs(context, path);
  if (path.node.computed) {
    // make an object type indexer.
    var keyType = context.call('union', context.call('number'), context.call('string'), context.call('symbol'));
    return context.call('indexer', t.stringLiteral('key'), keyType, context.call.apply(context, ['function'].concat(_toConsumableArray(args))));
  } else {
    return context.call.apply(context, [path.node.static ? 'staticMethod' : 'method', t.stringLiteral(path.node.key.name)].concat(_toConsumableArray(args)));
  }
};

converters.ClassImplements = function (context, path) {
  var id = path.get('id');
  var name = void 0;
  var subject = void 0;
  if (id.isQualifiedTypeIdentifier()) {
    subject = qualifiedToMemberExpression(context, id);
    var outer = getMemberExpressionObject(subject);
    name = outer.name;
  } else {
    name = id.node.name;
    subject = t.identifier(name);
  }
  if (context.shouldSuppressTypeName(name)) {
    return context.call('any');
  }
  if (context.inTDZ(id.node)) {
    subject = context.call('tdz', t.arrowFunctionExpression([], subject), t.stringLiteral(name));
  }
  var typeParameters = (0, _getTypeParameters2.default)(path).map(function (item) {
    return convert(context, item);
  });
  var entity = context.getEntity(name, path);

  if (!entity) {
    if (name === 'Array') {
      return context.call.apply(context, ['array'].concat(_toConsumableArray(typeParameters)));
    } else if (name === 'Function') {
      return context.call('function');
    } else if (name === 'Object') {
      return context.call('object');
    }
  }

  var isTypeParameter = entity && entity.isTypeParameter || context.isAnnotating && entity && entity.isClassTypeParameter || annotationParentHasTypeParameter(path, name);

  if (isTypeParameter && typeParameterCanFlow(path)) {
    subject = context.call('flowInto', subject);
  }

  var isDirectlyReferenceable = isTypeParameter || entity && entity.isTypeAlias;

  if (isDirectlyReferenceable) {
    if (typeParameters.length > 0) {
      return context.call.apply(context, ['ref', subject].concat(_toConsumableArray(typeParameters)));
    } else {
      return subject;
    }
  } else if (!entity) {
    var flowTypeName = context.getFlowTypeName(name);
    if (flowTypeName) {
      return context.call.apply(context, [flowTypeName].concat(_toConsumableArray(typeParameters)));
    } else {
      return context.call.apply(context, ['ref', t.stringLiteral(name)].concat(_toConsumableArray(typeParameters)));
    }
  } else if (entity.isClassTypeParameter) {
    var target = void 0;
    var typeParametersUid = context.getClassData(path, 'typeParametersUid');
    var typeParametersSymbolUid = context.getClassData(path, 'typeParametersSymbolUid');
    if (typeParametersUid && parentIsStaticMethod(path)) {
      target = t.memberExpression(t.identifier(typeParametersUid), subject);
    } else if (typeParametersUid && parentIsClassConstructorWithSuper(path)) {
      target = t.memberExpression(t.identifier(typeParametersUid), subject);
    } else if (typeParametersSymbolUid) {
      target = t.memberExpression(t.memberExpression(t.thisExpression(), t.identifier(typeParametersSymbolUid), true), subject);
    } else {
      target = t.memberExpression(t.memberExpression(t.thisExpression(), t.memberExpression(t.thisExpression(), context.symbol('TypeParameters'), true), true), subject);
    }

    if (typeParameterCanFlow(path)) {
      target = context.call('flowInto', target);
    }

    if (typeParameters.length > 0) {
      return context.call.apply(context, ['ref', target].concat(_toConsumableArray(typeParameters)));
    } else {
      return target;
    }
  } else {
    return context.call.apply(context, ['ref', subject].concat(_toConsumableArray(typeParameters)));
  }
};

converters.ObjectMethod = function (context, path) {
  var args = functionToArgs(context, path);
  if (path.node.computed) {
    // make an object type indexer.
    var keyType = context.call('union', context.call('number'), context.call('string'), context.call('symbol'));
    return context.call('indexer', t.stringLiteral('key'), keyType, context.call.apply(context, ['function'].concat(_toConsumableArray(args))));
  } else {
    return context.call.apply(context, [path.node.static ? 'staticMethod' : 'method', t.stringLiteral(path.node.key.name)].concat(_toConsumableArray(args)));
  }
};

converters.RestElement = function (context, path) {
  if (!path.has('typeAnnotation')) {
    return context.call('array', context.call('any'));
  } else {
    return convert(context, path.get('typeAnnotation'));
  }
};

converters.RestProperty = function (context, path) {
  return context.call('object');
};

converters.Identifier = function (context, path) {
  if (!path.has('typeAnnotation')) {
    return context.call('any');
  } else {
    return convert(context, path.get('typeAnnotation'));
  }
};

converters.ArrayPattern = function (context, path) {
  if (!path.has('typeAnnotation')) {
    return context.call('array', context.call('any'));
  } else {
    return convert(context, path.get('typeAnnotation'));
  }
};

converters.ObjectPattern = function (context, path) {
  if (!path.has('typeAnnotation')) {
    return context.call('ref', t.identifier('Object'));
  } else {
    return convert(context, path.get('typeAnnotation'));
  }
};

converters.AssignmentPattern = function (context, path) {
  return convert(context, path.get('left'));
};

exports.default = convert;