'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = preTransformVisitors;

var _babelTypes = require('babel-types');

var t = _interopRequireWildcard(_babelTypes);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function preTransformVisitors(context) {

  return {
    Function: function Function(path) {
      // see if we have any annotated ObjectPatterns or ArrayPatterns
      // as arguments.
      foldComplexParamsIntoBody(path);
    },
    TypeCastExpression: function TypeCastExpression(path) {
      if (context.shouldSuppressPath(path)) {
        path.skip();
        return;
      }
      var expression = path.get('expression');
      var name = expression.node.name;
      var binding = path.scope.getBinding(name);
      if (binding) {
        if (name === 'reify') {
          var typeAnnotation = path.get('typeAnnotation');
          if (typeAnnotation.isTypeAnnotation()) {
            var annotation = typeAnnotation.get('typeAnnotation');
            var isTypeWrapper = annotation.isGenericTypeAnnotation() && annotation.node.id.name === 'Type' && annotation.node.typeParameters && annotation.node.typeParameters.params && annotation.node.typeParameters.params.length === 1;
            var typeName = void 0;
            if (isTypeWrapper) {
              typeName = annotation.get('typeParameters.params')[0].node.id.name;
            } else if (annotation.isGenericTypeAnnotation()) {
              typeName = annotation.node.id.name;
            }
            if (typeName) {
              var entity = context.getEntity(typeName, path);
              if (entity) {
                entity.reified = true;
              }
            }
          }
        }
      }
    }
  };
}


function foldComplexParamsIntoBody(path) {
  var body = path.get('body');
  var params = path.get('params');
  var extra = [];
  var accumulating = false;
  for (var i = 0; i < params.length; i++) {
    var original = params[i];
    var param = original;
    var assignmentRight = void 0;
    if (param.isAssignmentPattern()) {
      assignmentRight = param.get('right');
      param = param.get('left');
    }
    if (!accumulating && !param.has('typeAnnotation')) {
      continue;
    }
    if (param.isObjectPattern() || param.isArrayPattern()) {
      if (body.type !== 'BlockStatement') {
        body.replaceWith(t.blockStatement([t.returnStatement(body.node)]));
        body = path.get('body');
        path.node.expression = false;
      }
      var cloned = t.cloneDeep(param.node);
      var uid = body.scope.generateUidIdentifier('arg' + params[i].key);
      uid.__flowRuntime__wasParam = true;
      cloned.__flowRuntime__wasParam = true;
      param.node.__flowRuntime__wasParam = true;
      if (original.node.optional) {
        uid.optional = true;
      }
      if (accumulating && assignmentRight) {
        extra.push(t.ifStatement(t.binaryExpression('===', uid, t.identifier('undefined')), t.blockStatement([t.expressionStatement(t.assignmentExpression('=', uid, assignmentRight.node))])));
        extra.push(t.variableDeclaration('let', [t.variableDeclarator(cloned, uid)]));
        original.replaceWith(uid);
      } else {
        extra.push(t.variableDeclaration('let', [t.variableDeclarator(cloned, uid)]));
        param.replaceWith(uid);
      }
      accumulating = true;
    } else if (accumulating && assignmentRight && !isSimple(assignmentRight)) {
      extra.push(t.ifStatement(t.binaryExpression('===', param.node, t.identifier('undefined')), t.blockStatement([t.expressionStatement(t.assignmentExpression('=', param.node, assignmentRight.node))])));
      original.replaceWith(param.node);
    }
  }
  if (extra.length > 0) {
    body.unshiftContainer('body', extra);
  }
}

function isSimple(path) {
  switch (path.type) {
    case 'NullLiteral':
    case 'NumericLiteral':
    case 'StringLiteral':
    case 'BooleanLiteral':
    case 'RegExpLiteral':
    case 'ThisExpression':
      return true;
    case 'Identifier':
      return path.node.name === 'undefined';
    default:
      return false;
  }
}