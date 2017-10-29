/* @flow */
import * as t from 'babel-types';
import type {NodePath} from 'babel-traverse';
import type ConversionContext from './ConversionContext';


export default function preTransformVisitors (context: ConversionContext): Object {

  return {
    Function (path: NodePath) {
      // see if we have any annotated ObjectPatterns or ArrayPatterns
      // as arguments.
      foldComplexParamsIntoBody(path);
    },
    TypeCastExpression (path: NodePath) {
      if (context.shouldSuppressPath(path)) {
        path.skip();
        return;
      }
      const expression = path.get('expression');
      const name = expression.node.name;
      const binding = path.scope.getBinding(name);
      if (binding) {
        if (name === 'reify') {
          const typeAnnotation = path.get('typeAnnotation');
          if (typeAnnotation.isTypeAnnotation()) {
            const annotation = typeAnnotation.get('typeAnnotation');
            const isTypeWrapper = (
              annotation.isGenericTypeAnnotation() &&
              annotation.node.id.name === 'Type' &&
              annotation.node.typeParameters &&
              annotation.node.typeParameters.params &&
              annotation.node.typeParameters.params.length === 1
            );
            let typeName;
            if (isTypeWrapper) {
              typeName = annotation.get('typeParameters.params')[0].node.id.name;
            } else if (annotation.isGenericTypeAnnotation()) {
              typeName = annotation.node.id.name;
            }
            if (typeName) {
              const entity = context.getEntity(typeName, path);
              if (entity) {
                entity.reified = true;
              }
            }
          }
        }
      }
    },
  };
}

function foldComplexParamsIntoBody (path: NodePath) {
  let body = path.get('body');
  const params = path.get('params');
  const extra = [];
  let accumulating = false;
  for (let i = 0; i < params.length; i++) {
    const original = params[i];
    let param = original;
    let assignmentRight;
    if (param.isAssignmentPattern()) {
      assignmentRight = param.get('right');
      param = param.get('left');
    }
    if (!accumulating && !param.has('typeAnnotation')) {
      continue;
    }
    if (param.isObjectPattern() || param.isArrayPattern()) {
      if (body.type !== 'BlockStatement') {
        body.replaceWith(t.blockStatement([
          t.returnStatement(body.node)
        ]));
        body = path.get('body');
        path.node.expression = false;
      }
      const cloned = t.cloneDeep(param.node);
      const uid = body.scope.generateUidIdentifier(`arg${params[i].key}`);
      uid.__flowRuntime__wasParam = true;
      cloned.__flowRuntime__wasParam = true;
      param.node.__flowRuntime__wasParam = true;
      if (original.node.optional) {
        uid.optional = true;
      }
      if (accumulating && assignmentRight) {
        extra.push(t.ifStatement(
          t.binaryExpression(
            '===',
            uid,
            t.identifier('undefined')
          ),
          t.blockStatement([
            t.expressionStatement(t.assignmentExpression(
              '=',
              uid,
              assignmentRight.node
            ))
          ])
        ));
        extra.push(t.variableDeclaration('let', [t.variableDeclarator(cloned, uid)]));
        original.replaceWith(uid);
      }
      else {
        extra.push(t.variableDeclaration('let', [t.variableDeclarator(cloned, uid)]));
        param.replaceWith(uid);
      }
      accumulating = true;
    }
    else if (accumulating && assignmentRight && !isSimple(assignmentRight)) {
      extra.push(t.ifStatement(
        t.binaryExpression(
          '===',
          param.node,
          t.identifier('undefined')
        ),
        t.blockStatement([
          t.expressionStatement(t.assignmentExpression(
            '=',
            param.node,
            assignmentRight.node
          ))
        ])
      ));
      original.replaceWith(param.node);
    }
  }
  if (extra.length > 0) {
    body.unshiftContainer('body', extra);
  }
}

function isSimple (path: NodePath): boolean {
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