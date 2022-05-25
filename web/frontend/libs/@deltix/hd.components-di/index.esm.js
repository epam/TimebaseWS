/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

var ContainerException =
/** @class */
function (_super) {
  __extends(ContainerException, _super);

  function ContainerException() {
    return _super !== null && _super.apply(this, arguments) || this;
  }

  ContainerException.serviceNotFound = function (id) {
    return new ContainerException("Services with id: " + id + " not found.");
  };

  ContainerException.parameterNotFound = function (id) {
    return new ContainerException("Parameter with id: " + id + " not found.");
  };

  return ContainerException;
}(Error);

var containerId = "service_container";

var isContainerAware = function isContainerAware(obj) {
  return obj && undefined !== obj.setContainer;
};

var Container =
/** @class */
function () {
  function Container() {
    this.factories = {};
    this.services = {};
    this.parameters = {};
  }

  Container.prototype.has = function (id) {
    return this.factories.hasOwnProperty(id) || this.services.hasOwnProperty(id);
  };

  Container.prototype.getIds = function () {
    return Object.keys(this.factories);
  };

  Container.prototype.get = function (id) {
    var instance = this.doGet(id);

    if (isContainerAware(instance)) {
      instance.setContainer(this);
    }

    return instance;
  };

  Container.prototype.getOptionalParameter = function (id) {
    if (!this.parameters.hasOwnProperty(id)) return null;
    return this.parameters[id];
  };

  Container.prototype.getParameter = function (id) {
    if (!this.parameters.hasOwnProperty(id)) {
      throw new Error("Parameter with id: \"" + id + "\" not found.");
    }

    return this.parameters[id];
  };

  Container.prototype.setParameters = function (parameters) {
    this.parameters = parameters;
  };

  Container.prototype.setFactory = function (id, factory, shared) {
    this.factories[id] = {
      factory: factory,
      shared: shared
    };
  };

  Container.prototype.set = function (id, inst) {
    this.services[id] = inst;
  };

  Container.prototype.merge = function (container) {
    var _this = this;

    ['factories', 'services', 'parameters'].forEach(function (scope) {
      Object.entries(container[scope]).forEach(function (_a) {
        var id = _a[0],
            value = _a[1];
        return _this[scope][id] = value;
      });
    });
  };

  Container.prototype.doGet = function (id) {
    if (id === containerId) {
      return this;
    }

    if (!this.has(id)) {
      throw ContainerException.serviceNotFound(id);
    }

    if (this.services.hasOwnProperty(id)) {
      return this.services[id];
    }

    var _a = this.factories[id],
        factory = _a.factory,
        shared = _a.shared;
    var service = factory();

    if (!shared) {
      return service;
    }

    return this.services[id] = service;
  };

  return Container;
}();

var ContainerBuilder =
/** @class */
function () {
  function ContainerBuilder(compiler, parameters, env) {
    this.compiler = compiler;
    this.parameters = parameters;
    this.env = env;
    this.definitions = {};
    this.factories = {};
    this.loading = [];
    this.container = new Container();
    var envParameters = parameters.hasOwnProperty(env) ? parameters[env].hasOwnProperty('@@parameters') ? parameters[env]['@@parameters'] : {} : {};
    this.container.setParameters(envParameters);
  }

  ContainerBuilder.prototype.has = function (id) {
    // todo hasDefinition
    return this.definitions.hasOwnProperty(id) || this.container.has(id);
  };

  ContainerBuilder.prototype.getParameters = function () {
    return this.parameters;
  };

  ContainerBuilder.prototype.setParameters = function (parameters) {
    this.parameters = parameters;
  };

  ContainerBuilder.prototype.getParameter = function (id) {
    if (!this.parameters.hasOwnProperty(this.env)) {
      throw ContainerException.parameterNotFound(id);
    }

    if (!this.parameters[this.env].hasOwnProperty('@@parameters')) {
      throw ContainerException.parameterNotFound(id);
    }

    if (this.parameters[this.env]['@@parameters'][id] === undefined) {
      if (this.parameters[id] !== undefined) {
        return this.parameters[id];
      }

      throw ContainerException.parameterNotFound(id);
    }

    return this.parameters[this.env]['@@parameters'][id];
  };

  ContainerBuilder.prototype.getOptionalParameter = function (id) {
    var _a, _b, _c, _d;

    var value = (_c = (_b = (_a = this.parameters) === null || _a === void 0 ? void 0 : _a[this.env]) === null || _b === void 0 ? void 0 : _b['@@parameters']) === null || _c === void 0 ? void 0 : _c[id];

    if (value === void 0) {
      return (_d = this.parameters) === null || _d === void 0 ? void 0 : _d[id];
    }

    return value;
  };

  ContainerBuilder.prototype.getParametersFor = function (extensionName) {
    if (!this.parameters.hasOwnProperty(this.env)) {
      return {};
    }

    if (!this.parameters[this.env].hasOwnProperty(extensionName)) {
      return {};
    }

    return this.parameters[this.env][extensionName];
  };

  ContainerBuilder.prototype.getEnv = function () {
    return this.env;
  };

  ContainerBuilder.prototype.get = function (id) {
    if (!this.container.has(id) && this.hasDefinition(id)) {
      this.createService(id);
    }

    return this.container.get(id);
  };

  ContainerBuilder.prototype.getIds = function () {
    return this.container.getIds();
  };

  ContainerBuilder.prototype.setFactory = function (id, factory, shared) {
    this.container.setFactory(id, this.createDecoratedFactory(factory, id), shared);
  };

  ContainerBuilder.prototype.set = function (id, inst) {
    this.setFactory(id, function () {
      return inst;
    }, true);
  };

  ContainerBuilder.prototype.addDefinitions = function () {
    var _this = this;

    var definitions = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      definitions[_i] = arguments[_i];
    }

    definitions.forEach(function (definition) {
      return _this.definitions[definition.getId()] = definition;
    });
  };

  ContainerBuilder.prototype.getDefinitions = function () {
    return Object.values(this.definitions);
  };

  ContainerBuilder.prototype.findDefinition = function (id) {
    return this.getDefinitions().find(function (d) {
      return d.getId() === id;
    });
  };

  ContainerBuilder.prototype.getCompiler = function () {
    return this.compiler;
  };

  ContainerBuilder.prototype.removeDefinition = function (id) {
    delete this.definitions[id];
  };

  ContainerBuilder.prototype.hasDefinition = function (id) {
    return this.definitions.hasOwnProperty(id);
  };

  ContainerBuilder.prototype.getServiceIds = function () {
    return Object.keys(this.definitions);
  };

  ContainerBuilder.prototype.findTaggedServiceIds = function (name) {
    return this.getDefinitions().filter(function (def) {
      return -1 !== def.getTags().findIndex(function (t) {
        return t.name === name;
      });
    }).map(function (def) {
      return def.getId();
    });
  };

  ContainerBuilder.prototype.findTags = function () {
    var allTags = {};
    this.getDefinitions().forEach(function (def) {
      return def.getTags().forEach(function (tag) {
        return allTags[tag.name] = tag;
      });
    });
    return Object.values(allTags);
  };

  ContainerBuilder.prototype.findUnusedTags = function () {// todo
  };

  ContainerBuilder.prototype.build = function () {
    return __awaiter(this, void 0, void 0, function () {
      var _i, _a, id;

      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            return [4
            /*yield*/
            , this.compiler.compile(this)];

          case 1:
            _b.sent();

            for (_i = 0, _a = Object.keys(this.definitions); _i < _a.length; _i++) {
              id = _a[_i];

              if (!this.container.has(id)) {
                this.createService(id);
              }
            }

            return [2
            /*return*/
            , this.container];
        }
      });
    });
  };

  ContainerBuilder.prototype.merge = function (builder) {
    var _this = this;

    Object.entries(builder.definitions).forEach(function (_a) {
      var id = _a[0],
          definition = _a[1];
      return _this.definitions[id] = definition;
    });
    Object.entries(builder.factories).forEach(function (_a) {
      var id = _a[0],
          factory = _a[1];
      return _this.factories[id] = factory;
    });
    this.container.merge(builder.container);
  };

  ContainerBuilder.prototype.createService = function (id) {
    var factory = this.getFactory(id);
    this.container.setFactory(id, this.createDecoratedFactory(factory, id), this.definitions[id].isShared());
  };

  ContainerBuilder.prototype.createDecoratedFactory = function (factory, id) {
    var _this = this;

    return function () {
      var instance = factory();

      _this.container.set(id, instance); // todo shared


      _this.container.set(id + ".inner", instance);

      _this.getDecoratorsFor(id).forEach(function (decoratorId) {
        var decoratedInstances = _this.get(decoratorId);

        _this.container.set(id, decoratedInstances);
      });

      return _this.container.get(id);
    };
  };

  ContainerBuilder.prototype.getDecoratorsFor = function (id) {
    return Object.values(this.definitions).filter(function (definition) {
      return definition.getDecorates() === id;
    }).sort(function (a, b) {
      return b.getDecorationPriority() - a.getDecorationPriority();
    }).map(function (definition) {
      return definition.getId();
    });
  };

  ContainerBuilder.prototype.getFactory = function (id) {
    var _this = this;

    if (id === containerId) {
      return function () {
        return _this.container;
      };
    }

    if (-1 !== this.loading.findIndex(function (c) {
      return c === id;
    })) {
      throw new Error('Circle reference.');
    }

    if (this.factories.hasOwnProperty(id)) {
      return this.factories[id];
    }

    this.loading.push(id);
    var definition = this.definitions[id];
    this.factories[id] = definition.getFactoryBuilder().createFactory(definition, this);
    this.loading = this.loading.filter(function (c) {
      return c !== id;
    });
    return this.factories[id];
  };

  return ContainerBuilder;
}();

var Parameter =
/** @class */
function () {
  function Parameter(id) {
    this.id = id;
  }

  return Parameter;
}();

var Reference =
/** @class */
function () {
  function Reference(id) {
    this.id = id;
  }

  return Reference;
}();

var AbstractFactoryBuilder =
/** @class */
function () {
  function AbstractFactoryBuilder() {}

  AbstractFactoryBuilder.prototype.resolveArguments = function (args, containerBuilder) {
    return args.map(function (arg) {
      if (arg instanceof Reference) {
        return containerBuilder.get(arg.id);
      }

      if (arg instanceof Parameter) {
        return containerBuilder.getParameter(arg.id);
      }

      return arg;
    });
  };

  return AbstractFactoryBuilder;
}();

var ClassFactoryBuilder =
/** @class */
function (_super) {
  __extends(ClassFactoryBuilder, _super);

  function ClassFactoryBuilder() {
    return _super !== null && _super.apply(this, arguments) || this;
  }

  ClassFactoryBuilder.prototype.createFactory = function (definition, containerBuilder) {
    var _this = this;

    return function () {
      var classCtr = definition.getResource().resolve();

      var args = _this.resolveArguments(definition.getArguments(), containerBuilder);

      var instance = new (classCtr.bind.apply(classCtr, __spreadArray([void 0], args)))();
      definition.getCalls().forEach(function (_a) {
        var methodName = _a.methodName,
            args = _a.args;
        instance[methodName].apply(instance, _this.resolveArguments(args, containerBuilder));
      });
      return instance;
    };
  };

  return ClassFactoryBuilder;
}(AbstractFactoryBuilder);

var FactoryFactoryBuilder =
/** @class */
function (_super) {
  __extends(FactoryFactoryBuilder, _super);

  function FactoryFactoryBuilder() {
    return _super !== null && _super.apply(this, arguments) || this;
  }

  FactoryFactoryBuilder.prototype.createFactory = function (definition, containerBuilder) {
    var _this = this;

    return function () {
      var _a = definition.getFactory(),
          resource = _a.resource,
          method = _a.method;

      var factoryCtr = resource.resolve();
      var factory = new factoryCtr();

      var args = _this.resolveArguments(definition.getArguments(), containerBuilder);

      return factory[method].apply(factory, args);
    };
  };

  return FactoryFactoryBuilder;
}(AbstractFactoryBuilder);

var ObjectResource =
/** @class */
function () {
  function ObjectResource(object) {
    this.object = object;
  }

  ObjectResource.prototype.resolve = function () {
    return this.object;
  };

  return ObjectResource;
}();

var Factory =
/** @class */
function () {
  function Factory(resource, method) {
    this.resource = resource;
    this.method = method;
  }

  return Factory;
}();

var Definition =
/** @class */
function () {
  function Definition() {
    this.arguments = [];
    this.shared = true;
    this.calls = [];
    this.tags = [];
    this.decorationPriority = 0;
  }
  /**
   * @param ctr Construct of class.
   */


  Definition.prototype.setClass = function (ctr) {
    this.resource = new ObjectResource(ctr);
    this.factoryBuilder = new ClassFactoryBuilder();
    return this;
  };
  /**
   * @param method    Method name of factory.
   * @param ctr       Constructor function of factory.
   */


  Definition.prototype.setFactory = function (method, ctr) {
    this.factory = new Factory(new ObjectResource(ctr), method);
    this.factoryBuilder = new FactoryFactoryBuilder();
    return this;
  };

  Definition.prototype.setId = function (id) {
    this.id = id;
    return this;
  };

  Definition.prototype.setDecorates = function (wrappedId) {
    this.decorates = wrappedId;
    return this;
  };

  Definition.prototype.setDecorationPriority = function (priority) {
    this.decorationPriority = priority;
    return this;
  };

  Definition.prototype.markAsNotShared = function () {
    this.shared = false;
    return this;
  };

  Definition.prototype.addArguments = function () {
    var _a;

    var args = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }

    (_a = this.arguments).push.apply(_a, args);

    return this;
  };

  Definition.prototype.addMethodCalls = function () {
    var _a;

    var calls = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      calls[_i] = arguments[_i];
    }

    (_a = this.calls).push.apply(_a, calls);

    return this;
  };

  Definition.prototype.addTags = function () {
    var _a;

    var tags = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      tags[_i] = arguments[_i];
    }

    (_a = this.tags).push.apply(_a, tags);

    return this;
  };

  Definition.prototype.getResource = function () {
    return this.resource;
  };

  Definition.prototype.getArguments = function () {
    return this.arguments;
  };

  Definition.prototype.getId = function () {
    return this.id;
  };

  Definition.prototype.getCalls = function () {
    return this.calls;
  };

  Definition.prototype.getTags = function () {
    return this.tags;
  };

  Definition.prototype.getTagsWithName = function (name) {
    return this.tags.filter(function (tag) {
      return tag.name === name;
    });
  };

  Definition.prototype.getFactoryBuilder = function () {
    return this.factoryBuilder;
  };

  Definition.prototype.getFactory = function () {
    return this.factory;
  };

  Definition.prototype.isShared = function () {
    return this.shared;
  };

  Definition.prototype.getDecorates = function () {
    return this.decorates;
  };

  Definition.prototype.getDecorationPriority = function () {
    return this.decorationPriority;
  };

  Definition.prototype.clone = function () {
    // todo deep clone
    var inst = new Definition();
    inst.arguments = __spreadArray([], this.arguments);
    inst.shared = this.shared;
    inst.id = this.id;
    inst.calls = __spreadArray([], this.calls);
    inst.tags = __spreadArray([], this.tags);
    inst.factoryBuilder = this.factoryBuilder;
    inst.resource = this.resource;
    inst.factory = this.factory;
    inst.decorates = this.decorates;
    return inst;
  };

  return Definition;
}();

var Compiler =
/** @class */
function () {
  function Compiler() {
    this.passes = [];
  }

  Compiler.prototype.addPass = function (pass, extensionName) {
    this.passes.push({
      pass: pass,
      extensionName: extensionName
    });
    return this;
  };

  Compiler.prototype.compile = function (containerBuilder) {
    return __awaiter(this, void 0, void 0, function () {
      var _i, _a, _b, pass, extensionName;

      return __generator(this, function (_c) {
        switch (_c.label) {
          case 0:
            _i = 0, _a = this.passes;
            _c.label = 1;

          case 1:
            if (!(_i < _a.length)) return [3
            /*break*/
            , 4];
            _b = _a[_i], pass = _b.pass, extensionName = _b.extensionName;
            return [4
            /*yield*/
            , pass.process(containerBuilder, containerBuilder.getParametersFor(extensionName))];

          case 2:
            _c.sent();

            _c.label = 3;

          case 3:
            _i++;
            return [3
            /*break*/
            , 1];

          case 4:
            return [2
            /*return*/
            ];
        }
      });
    });
  };

  return Compiler;
}();

var MethodCall =
/** @class */
function () {
  function MethodCall(methodName, args) {
    this.methodName = methodName;
    this.args = args;
  }

  return MethodCall;
}();

export { Compiler, Container, ContainerBuilder, Definition, MethodCall, Reference };
