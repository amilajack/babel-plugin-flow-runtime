'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _assert = require('assert');

var _fixtures = require('./fixtures');

var _fixtures2 = _interopRequireDefault(_fixtures);

var _transform = require('../transform');

var _transform2 = _interopRequireDefault(_transform);

var _babylon = require('babylon');

var babylon = _interopRequireWildcard(_babylon);

var _babelGenerator = require('babel-generator');

var _babelGenerator2 = _interopRequireDefault(_babelGenerator);

var _babelTraverse = require('babel-traverse');

var _babelTraverse2 = _interopRequireDefault(_babelTraverse);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('transform', function () {
  var _loop = function _loop(name, input, expected, annotated, combined, reifiedOnly) {
    it('should transform ' + name, function () {
      var parsed = parse(input);
      var transformed = stripFlowTypes((0, _transform2.default)(parsed, {
        assert: true,
        annotate: false
      }));
      var generated = (0, _babelGenerator2.default)(transformed).code;
      (0, _assert.equal)(normalize(generated), normalize(expected));
    });
    if (annotated) {
      it('should transform ' + name + ' with decorations', function () {
        var parsed = parse(input);
        var transformed = stripFlowTypes((0, _transform2.default)(parsed, {
          assert: false,
          annotate: true
        }));
        var generated = (0, _babelGenerator2.default)(transformed).code;
        (0, _assert.equal)(normalize(generated), normalize(annotated));
      });
    }
    if (combined) {
      it('should transform ' + name + ' with decorations and assertions', function () {
        var parsed = parse(input);
        var transformed = stripFlowTypes((0, _transform2.default)(parsed, {
          assert: true,
          annotate: true
        }));
        var generated = (0, _babelGenerator2.default)(transformed).code;
        (0, _assert.equal)(normalize(generated), normalize(combined));
      });
    }
    if (reifiedOnly) {
      it('should transform ' + name + ' with only reified types generated', function () {
        var parsed = parse(input);
        var transformed = stripFlowTypes((0, _transform2.default)(parsed, {
          assert: false,
          annotate: false,
          generateReifiedOnly: true
        }));
        var generated = (0, _babelGenerator2.default)(transformed).code;
        (0, _assert.equal)(normalize(generated), normalize(reifiedOnly));
      });
    }
  };

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = _fixtures2.default[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _ref = _step.value;

      var _ref2 = _slicedToArray(_ref, 2);

      var name = _ref2[0];
      var _ref2$ = _ref2[1];
      var input = _ref2$.input;
      var expected = _ref2$.expected;
      var annotated = _ref2$.annotated;
      var combined = _ref2$.combined;
      var reifiedOnly = _ref2$.reifiedOnly;

      _loop(name, input, expected, annotated, combined, reifiedOnly);
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
});

function stripFlowTypes(program) {
  (0, _babelTraverse2.default)(program, {
    Flow: function Flow(path) {
      path.remove();
    },
    TypeCastExpression: function TypeCastExpression(path) {
      var node = path.node;

      do {
        node = node.expression;
      } while (node.type === 'TypeCastExpression');
      path.replaceWith(node);
    },
    Class: function Class(path) {
      path.node.implements = null;
    }
  });
  return program;
}

function parse(source) {
  return babylon.parse(source, {
    filename: 'unknown',
    sourceType: 'module',
    plugins: ['jsx', 'flow', 'doExpressions', 'objectRestSpread', 'decorators', 'classProperties', 'exportExtensions', 'asyncGenerators', 'functionBind', 'functionSent']
  });
}

function normalize(input) {
  return input.trim().replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\{\s+/g, '{\n').replace(/\s+\}/g, '\n}').replace(/\[\s+/g, '[').replace(/\s+]/g, ']').replace(/\}\s+([A-Za-z])/g, '\n}\n$1').split(';').join(';\n').trim();
}