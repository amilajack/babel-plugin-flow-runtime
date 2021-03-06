'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = collectProgramOptions;

var _babelTypes = require('babel-types');

var t = _interopRequireWildcard(_babelTypes);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Collects the program level pragmas which override the plugin options.
 * Pragmas are specified via comments like `-runtime ignore`
 * and `@flow-runtime warn, annotate`.
 * Collected options are applied to the conversion context, if the program
 * has a `@flow-runtime ignore` comment or doesn't use any flow types this function
 * will return `false`, if any other flow-runtime pragmas are present or the file
 * does use flow, the function returns `true`.
 */
function collectProgramOptions(context, node) {
  if (t.isFile(node)) {
    node = node.program;
  }
  var options = collectOptionsFromPragma(context, node);
  if (!options) {
    // if we have no options, check to see whether flow is in use in this file
    return hasFlowNodes(node);
  } else if (options.ignore) {
    return false;
  }

  if (options.assert) {
    context.shouldAssert = true;
  }
  if (options.warn) {
    context.shouldWarn = true;
  }
  if (options.annotate) {
    context.shouldAnnotate = true;
  }
  if (options.generateReifiedOnly) {
    context.shouldGenerateReifiedOnly = true;
  }
  return true;
}


var HAS_FLOW = new Error('This is not really an error, we use it to bail out of t.traverseFast() early when we find a flow element, and yes, that is ugly.');

function collectOptionsFromPragma(context, node) {
  var comments = node.leadingComments || node.comments;
  if (comments && comments.length > 0) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = comments[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var comment = _step.value;

        var matches = /^\s*@flow-runtime\s*([\w,\s]+)?$/i.exec(comment.value);
        if (matches) {
          var raw = matches[1] && matches[1].trim() || '';
          var keys = raw.split(/[\s,]+/g);
          if (!raw || keys.length === 0) {
            // we have a comment but no options, this is strict by default.
            return {
              assert: true,
              annotate: true
            };
          } else {
            var options = {};
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = keys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var key = _step2.value;

                options[key] = true;
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

            return options;
          }
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
  }
  if (t.isProgram(node)) {
    var body = node.body;

    if (body.length > 0) {
      return collectOptionsFromPragma(context, body[0]);
    }
  }
}

function hasFlowNodes(node) {
  try {
    throwIfFlow(node);
    t.traverseFast(node, throwIfFlow);
    return false;
  } catch (e) {
    if (e === HAS_FLOW) {
      return true;
    } else {
      throw e;
    }
  }
}

function throwIfFlow(node) {
  if (t.isFlow(node)) {
    throw HAS_FLOW;
  } else if (t.isImportDeclaration(node) && (node.importKind === 'type' || node.importKind === 'typeof')) {
    throw HAS_FLOW;
  }
}