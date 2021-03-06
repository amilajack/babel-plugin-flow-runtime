'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _babelTypes = require('babel-types');

var t = _interopRequireWildcard(_babelTypes);

var _Entity = require('./Entity');

var _Entity2 = _interopRequireDefault(_Entity);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var tdzIdentifiers = new WeakSet();

var FLOW_TYPENAMES = {
  $Diff: '$diff',
  $Keys: '$keys',
  $ObjMapi: '$objMapi',
  $ObjMap: '$objMap',
  $PropertyType: '$propertyType',
  $Shape: '$shape',
  $Subtype: '$subtype',
  $Supertype: '$supertype',
  $TupleMap: '$tupleMap',
  Class: 'Class'
};

var ConversionContext = function () {
  function ConversionContext() {
    _classCallCheck(this, ConversionContext);

    this.libraryName = 'flow-runtime';
    this.libraryId = 't';
    this.shouldImport = true;
    this.shouldAssert = true;
    this.shouldWarn = false;
    this.shouldAnnotate = true;
    this.isAnnotating = false;
    this.suppressCommentPatterns = [/\$FlowFixMe/];
    this.suppressTypeNames = ['$FlowFixMe'];
    this.visited = new WeakSet();
  }

  /**
   * A set of nodes that have already been visited.
   */


  _createClass(ConversionContext, [{
    key: 'markTDZIssue',


    /**
     * Mark a particular node (an Identifier) as boxed.
     * Only applies to identifiers.
     * Boxed identifiers are wrapped in `t.box()` to avoid
     * Temporal Dead Zone issues.
     */
    value: function markTDZIssue(node) {
      tdzIdentifiers.add(node);
    }

    /**
     * Determine whether the given node exists in a
     * temporal dead zone.
     */

  }, {
    key: 'inTDZ',
    value: function inTDZ(node) {
      return tdzIdentifiers.has(node);
    }

    /**
     * Define a type alias with the given name and path.
     */

  }, {
    key: 'defineTypeAlias',
    value: function defineTypeAlias(name, path) {
      return this.defineEntity(name, 'TypeAlias', path);
    }

    /**
     * Define a type alias with the given name and path.
     */

  }, {
    key: 'defineImportedType',
    value: function defineImportedType(name, path) {
      return this.defineEntity(name, 'ImportedType', path);
    }

    /**
     * Define a type parameter with the given name and path.
     */

  }, {
    key: 'defineTypeParameter',
    value: function defineTypeParameter(name, path) {
      return this.defineEntity(name, 'TypeParameter', path);
    }

    /**
     * Define a class type parameter with the given name and path.
     */

  }, {
    key: 'defineClassTypeParameter',
    value: function defineClassTypeParameter(name, path) {
      return this.defineEntity(name, 'ClassTypeParameter', path);
    }

    /**
     * Define a value with the given name and path.
     */

  }, {
    key: 'defineValue',
    value: function defineValue(name, path) {
      return this.defineEntity(name, 'Value', path);
    }

    /**
     * Determines whether the given node path should be ignored
     * based on its comments.
     */

  }, {
    key: 'shouldSuppressPath',
    value: function shouldSuppressPath(path) {
      var comments = getPathComments(path);
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.suppressCommentPatterns[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var pattern = _step.value;
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = comments[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var comment = _step2.value;

              if (pattern.test(comment)) {
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
     * Determine whether we should suppress types with the given name.
     */

  }, {
    key: 'shouldSuppressTypeName',
    value: function shouldSuppressTypeName(name) {
      return this.suppressTypeNames.indexOf(name) !== -1;
    }

    /**
     * Determine whether the given identifier has TDZ issues.
     * e.g. referencing a `TypeAlias` before it has been defined.
     */

  }, {
    key: 'hasTDZIssue',
    value: function hasTDZIssue(name, path) {
      var existingEntity = this.getEntity(name, path);
      if (existingEntity) {
        // We have an entity but we don't know whether it clashes
        // with another entity in this scope that hasn't been defined yet.
        var existingFunctionParent = existingEntity.path && existingEntity.path.getFunctionParent();
        var functionParent = path.getFunctionParent();
        if (existingEntity.scope === path.scope) {
          // if the scopes are identical this cannot clash.
          return false;
        } else if (existingFunctionParent && functionParent && existingFunctionParent.node === functionParent.node) {
          // flow doesn't allow block scoped type aliases
          // so if the scopes are in the same function this must be
          // an identical reference
          return false;
        } else {
          // We need to see if any of the block statements
          // between this node and the existing entity have
          // unvisited type aliases that override the entity we're looking at.
          return existingEntity.isGlobal ? this.hasForwardTypeDeclaration(name, path) : this.hasForwardTypeDeclaration(name, path, existingEntity.path.findParent(filterBlockParent));
        }
      } else {
        // There's no entity defined with that name yet
        return this.hasForwardTypeDeclaration(name, path);
      }
    }

    /**
     * Find a named type declaration which occurs "after" the `startPath`.
     */

  }, {
    key: 'hasForwardTypeDeclaration',
    value: function hasForwardTypeDeclaration(name, startPath, endBlockPath) {
      var subject = startPath.getStatementParent();
      var block = subject.parentPath;
      var body = void 0;
      while (block !== endBlockPath) {
        while (block && !block.isBlockStatement() && !block.isProgram()) {
          subject = block;
          block = subject.parentPath;
        }
        if (!block || block === endBlockPath) {
          return false;
        }
        body = block.get('body');
        for (var i = subject.key + 1; i < body.length; i++) {
          var path = body[i];
          if (path.isExportNamedDeclaration() || path.isExportDefaultDeclaration()) {
            if (!path.has('declaration')) {
              continue;
            }
            path = path.get('declaration');
          }
          var hasSameName = path.node.id && path.node.id.name === name;
          var isDeclaration = path.type === 'TypeAlias' || path.type === 'InterfaceDeclaration' || path.type === 'FunctionDeclaration' || path.type === 'ClassDeclaration';
          if (hasSameName && isDeclaration) {
            return true;
          }
        }
        if (block.isProgram()) {
          // nothing left to do
          return false;
        }
        subject = block.getStatementParent();
        block = subject.parentPath;
      }
      return false;
    }

    /**
     * Define an entity with the given name, type and path.
     */

  }, {
    key: 'defineEntity',
    value: function defineEntity(name, type, path) {
      var entity = new _Entity2.default();
      entity.name = name;
      entity.path = path;
      entity.type = type;
      path.scope.setData('Entity:' + name, entity);
      return entity;
    }

    /**
     * Get an entity with the given name in the given path.
     */

  }, {
    key: 'getEntity',
    value: function getEntity(name, path) {
      return path.scope.getData('Entity:' + name);
    }

    /**
     * Get a named symbol from the library.
     */

  }, {
    key: 'symbol',
    value: function symbol(name) {
      return t.memberExpression(t.identifier(this.libraryId), t.identifier(name + 'Symbol'));
    }

    /**
     * Returns a `CallExpression` node invoking the given named method
     * on the runtime library, passing in the given arguments.
     */

  }, {
    key: 'call',
    value: function call(name) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      return t.callExpression(t.memberExpression(t.identifier(this.libraryId), t.identifier(name)), args);
    }

    /**
     * Call `type.assert(...args)` on the given node, or `t.warn(type, ...args)`
     * if `shouldWarn` is true.
     */

  }, {
    key: 'assert',
    value: function assert(subject) {
      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      if (this.shouldWarn) {
        return this.call.apply(this, ['warn', subject].concat(_toConsumableArray(args)));
      } else {
        return t.callExpression(t.memberExpression(subject, t.identifier('assert')), args);
      }
    }

    /**
     * Replace the given path with a node,
     * and ensure the node won't be visited again.
     */

  }, {
    key: 'replacePath',
    value: function replacePath(path, replacement) {
      this.visited.add(replacement);
      path.replaceWith(replacement);
    }
  }, {
    key: 'getClassData',
    value: function getClassData(path, key) {
      var candidates = path.scope.getData('classData:' + key);
      if (candidates instanceof Map) {
        var declaration = path.isClass() ? path : path.findParent(function (item) {
          return item.isClass();
        });

        if (declaration) {
          return candidates.get(declaration.node);
        } else {
          console.warn('Could not find class declaration to get data from:', key);
        }
      }
    }
  }, {
    key: 'setClassData',
    value: function setClassData(path, key, value) {
      var scope = path.scope;

      var qualifiedKey = 'classData:' + key;
      var declaration = path.isClass() ? path : path.findParent(function (item) {
        return item.isClass();
      });
      if (!declaration) {
        console.warn('Could not find class declaration to set data on:', key);
        return;
      }

      var map = scope.data[qualifiedKey];
      if (!(map instanceof Map)) {
        map = new Map();
        scope.data[qualifiedKey] = map;
      }

      map.set(declaration.node, value);
    }
  }, {
    key: 'getFlowTypeName',
    value: function getFlowTypeName(name) {
      return FLOW_TYPENAMES[name];
    }
  }]);

  return ConversionContext;
}();

exports.default = ConversionContext;


function filterBlockParent(item) {
  return item.isBlockStatement() || item.isProgram();
}

function getPathComments(path) {
  //"leadingComments", "trailingComments", "innerComments"
  var comments = [];
  if (path.node.comments) {
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = path.node.comments[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var comment = _step3.value;

        comments.push(comment.value || '');
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
  }
  if (path.node.leadingComments) {
    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = path.node.leadingComments[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var _comment = _step4.value;

        comments.push(_comment.value || '');
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
  }
  if (path.node.innerComments) {
    var _iteratorNormalCompletion5 = true;
    var _didIteratorError5 = false;
    var _iteratorError5 = undefined;

    try {
      for (var _iterator5 = path.node.innerComments[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
        var _comment2 = _step5.value;

        comments.push(_comment2.value || '');
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
  }
  return comments;
}