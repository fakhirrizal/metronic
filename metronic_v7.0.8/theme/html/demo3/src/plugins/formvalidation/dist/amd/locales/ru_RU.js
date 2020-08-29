define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {
        base64: {
            default: 'Пожалуйста, введите корректную строку base64',
        },
        between: {
            default: 'Пожалуйста, введите значение от %s до %s',
            notInclusive: 'Пожалуйста, введите значение между %s и %s',
        },
        bic: {
            default: 'Пожалуйста, введите правильный номер BIC',
        },
        callback: {
            default: 'Пожалуйста, введите корректное значение',
        },
        choice: {
            between: 'Пожалуйста, выберите %s-%s опций',
            default: 'Пожалуйста, введите корректное значение',
            less: 'Пожалуйста, выберите хотя бы %s опций',
            more: 'Пожалуйста, выберите не больше %s опций',
        },
        color: {
            default: 'Пожалуйста, введите правильный номер цвета',
        },
        creditCard: {
            default: 'Пожалуйста, введите правильный номер кредитной карты',
        },
        cusip: {
            default: 'Пожалуйста, введите правильный номер CUSIP',
        },
        date: {
            default: 'Пожалуйста, введите правильную дату',
            max: 'Пожалуйста, введите дату перед %s',
            min: 'Пожалуйста, введите дату после %s',
            range: 'Пожалуйста, введите дату в диапазоне %s - %s',
        },
        different: {
            default: 'Пожалуйста, введите другое значение',
        },
        digits: {
            default: 'Пожалуйста, введите только цифры',
        },
        ean: {
            default: 'Пожалуйста, введите правильный номер EAN',
        },
        ein: {
            default: 'Пожалуйста, введите правильный номер EIN',
        },
        emailAddress: {
            default: 'Пожалуйста, введите правильный адрес эл. почты',
        },
        file: {
            default: 'Пожалуйста, выберите файл',
        },
        greaterThan: {
            default: 'Пожалуйста, введите значение большее или равное %s',
            notInclusive: 'Пожалуйста, введите значение больше %s',
        },
        grid: {
            default: 'Пожалуйста, введите правильный номер GRId',
        },
        hex: {
            default: 'Пожалуйста, введите правильное шестнадцатиричное число',
        },
        iban: {
            countries: {
                AD: 'Андорре',
                AE: 'Объединённых Арабских Эмиратах',
                AL: 'Албании',
                AO: 'Анголе',
                AT: 'Австрии',
                AZ: 'Азербайджане',
                BA: 'Боснии и Герцеговине',
                BE: 'Бельгии',
                BF: 'Буркина-Фасо',
                BG: 'Болгарии',
                BH: 'Бахрейне',
                BI: 'Бурунди',
                BJ: 'Бенине',
                BR: 'Бразилии',
                CH: 'Швейцарии',
                CI: "Кот-д'Ивуаре",
                CM: 'Камеруне',
      t          String(i), true));\n\t    } else {\n\t      output.push('');\n\t    }\n\t  }\n\t  keys.forEach(function(key) {\n\t    if (!key.match(/^\\d+$/)) {\n\t      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,\n\t          key, true));\n\t    }\n\t  });\n\t  return output;\n\t}\n\n\n\tfunction formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {\n\t  var name, str, desc;\n\t  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };\n\t  if (desc.get) {\n\t    if (desc.set) {\n\t      str = ctx.stylize('[Getter/Setter]', 'special');\n\t    } else {\n\t      str = ctx.stylize('[Getter]', 'special');\n\t    }\n\t  } else {\n\t    if (desc.set) {\n\t      str = ctx.stylize('[Setter]', 'special');\n\t    }\n\t  }\n\t  if (!hasOwnProperty(visibleKeys, key)) {\n\t    name = '[' + key + ']';\n\t  }\n\t  if (!str) {\n\t    if (ctx.seen.indexOf(desc.value) < 0) {\n\t      if (isNull(recurseTimes)) {\n\t        str = formatValue(ctx, desc.value, null);\n\t      } else {\n\t        str = formatValue(ctx, desc.value, recurseTimes - 1);\n\t      }\n\t      if (str.indexOf('\\n') > -1) {\n\t        if (array) {\n\t          str = str.split('\\n').map(function(line) {\n\t            return '  ' + line;\n\t          }).join('\\n').substr(2);\n\t        } else {\n\t          str = '\\n' + str.split('\\n').map(function(line) {\n\t            return '   ' + line;\n\t          }).join('\\n');\n\t        }\n\t      }\n\t    } else {\n\t      str = ctx.stylize('[Circular]', 'special');\n\t    }\n\t  }\n\t  if (isUndefined(name)) {\n\t    if (array && key.match(/^\\d+$/)) {\n\t      return str;\n\t    }\n\t    name = JSON.stringify('' + key);\n\t    if (name.match(/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)) {\n\t      name = name.substr(1, name.length - 2);\n\t      name = ctx.stylize(name, 'name');\n\t    } else {\n\t      name = name.replace(/'/g, \"\\\\'\")\n\t                 .replace(/\\\\\"/g, '\"')\n\t                 .replace(/(^\"|\"$)/g, \"'\");\n\t      name = ctx.stylize(name, 'string');\n\t    }\n\t  }\n\n\t  return name + ': ' + str;\n\t}\n\n\n\tfunction reduceToSingleString(output, base, braces) {\n\t  var numLinesEst = 0;\n\t  var length = output.reduce(function(prev, cur) {\n\t    numLinesEst++;\n\t    if (cur.indexOf('\\n') >= 0) numLinesEst++;\n\t    return prev + cur.replace(/\\u001b\\[\\d\\d?m/g, '').length + 1;\n\t  }, 0);\n\n\t  if (length > 60) {\n\t    return braces[0] +\n\t           (base === '' ? '' : base + '\\n ') +\n\t           ' ' +\n\t           output.join(',\\n  ') +\n\t           ' ' +\n\t           braces[1];\n\t  }\n\n\t  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];\n\t}\n\n\n\t// NOTE: These type checking functions intentionally don't use `instanceof`\n\t// because it is fragile and can be easily faked with `Object.create()`.\n\tfunction isArray(ar) {\n\t  return Array.isArray(ar);\n\t}\n\texports.isArray = isArray;\n\n\tfunction isBoolean(arg) {\n\t  return typeof arg === 'boolean';\n\t}\n\texports.isBoolean = isBoolean;\n\n\tfunction isNull(arg) {\n\t  return arg === null;\n\t}\n\texports.isNull = isNull;\n\n\tfunction isNullOrUndefined(arg) {\n\t  return arg == null;\n\t}\n\texports.isNullOrUndefined = isNullOrUndefined;\n\n\tfunction isNumber(arg) {\n\t  return typeof arg === 'number';\n\t}\n\texports.isNumber = isNumber;\n\n\tfunction isString(arg) {\n\t  return typeof arg === 'string';\n\t}\n\texports.isString = isString;\n\n\tfunction isSymbol(arg) {\n\t  return typeof arg === 'symbol';\n\t}\n\texports.isSymbol = isSymbol;\n\n\tfunction isUndefined(arg) {\n\t  return arg === void 0;\n\t}\n\texports.isUndefined = isUndefined;\n\n\tfunction isRegExp(re) {\n\t  return isObject(re) && objectToString(re) === '[object RegExp]';\n\t}\n\texports.isRegExp = isRegExp;\n\n\tfunction isObject(arg) {\n\t  return typeof arg === 'object' && arg !== null;\n\t}\n\texports.isObject = isObject;\n\n\tfunction isDate(d) {\n\t  return isObject(d) && objectToString(d) === '[object Date]';\n\t}\n\texports.isDate = isDate;\n\n\tfunction isError(e) {\n\t  return isObject(e) &&\n\t      (objectToString(e) === '[object Error]' || e instanceof Error);\n\t}\n\texports.isError = isError;\n\n\tfunction isFunction(arg) {\n\t  return typeof arg === 'function';\n\t}\n\texports.isFunction = isFunction;\n\n\tfunction isPrimitive(arg) {\n\t  return arg === null ||\n\t         typeof arg === 'boolean' ||\n\t         typeof arg === 'number' ||\n\t         typeof arg === 'string' ||\n\t         typeof arg === 'symbol' ||  // ES6 symbol\n\t         typeof arg === 'undefined';\n\t}\n\texports.isPrimitive = isPrimitive;\n\n\texports.isBuffer = __webpack_require__(61);\n\n\tfunction objectToString(o) {\n\t  return Object.prototype.toString.call(o);\n\t}\n\n\n\tfunction pad(n) {\n\t  return n < 10 ? '0' + n.toString(10) : n.toString(10);\n\t}\n\n\n\tvar months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',\n\t              'Oct', 'Nov', 'Dec'];\n\n\t// 26 Feb 16:19:34\n\tfunction timestamp() {\n\t  var d = new Date();\n\t  var time = [pad(d.getHours()),\n\t              pad(d.getMinutes()),\n\t              pad(d.getSeconds())].join(':');\n\t  return [d.getDate(), months[d.getMonth()], time].join(' ');\n\t}\n\n\n\t// log is just a thin wrapper to console.log that prepends a timestamp\n\texports.log = function() {\n\t  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));\n\t};\n\n\n\t/**\n\t * Inherit the prototype methods from one constructor into another.\n\t *\n\t * The Function.prototype.inherits from lang.js rewritten as a standalone\n\t * function (not on Function.prototype). NOTE: If this file is to be loaded\n\t * during bootstrapping this function needs to be rewritten using some native\n\t * functions as prototype setup using normal JavaScript does not work as\n\t * expected during bootstrapping (see mirror.js in r114903).\n\t *\n\t * @param {function} ctor Constructor function which needs to inherit the\n\t *     prototype.\n\t * @param {function} superCtor Constructor function to inherit prototype from.\n\t */\n\texports.inherits = __webpack_require__(62);\n\n\texports._extend = function(origin, add) {\n\t  // Don't do anything if add isn't an object\n\t  if (!add || !isObject(add)) return origin;\n\n\t  var keys = Object.keys(add);\n\t  var i = keys.length;\n\t  while (i--) {\n\t    origin[keys[i]] = add[keys[i]];\n\t  }\n\t  return origin;\n\t};\n\n\tfunction hasOwnProperty(obj, prop) {\n\t  return Object.prototype.hasOwnProperty.call(obj, prop);\n\t}\n\n\t/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(30)))\n\n/***/ },\n/* 61 */\n/***/ function(module, exports) {\n\n\tmodule.exports = function isBuffer(arg) {\n\t  return arg && typeof arg === 'object'\n\t    && typeof arg.copy === 'function'\n\t    && typeof arg.fill === 'function'\n\t    && typeof arg.readUInt8 === 'function';\n\t}\n\n/***/ },\n/* 62 */\n/***/ function(module, exports) {\n\n\tif (typeof Object.create === 'function') {\n\t  // implementation from standard node.js 'util' module\n\t  module.exports = function inherits(ctor, superCtor) {\n\t    ctor.super_ = superCtor\n\t    ctor.prototype = Object.create(superCtor.prototype, {\n\t      constructor: {\n\t        value: ctor,\n\t        enumerable: false,\n\t        writable: true,\n\t        configurable: true\n\t      }\n\t    });\n\t  };\n\t} else {\n\t  // old school shim for old browsers\n\t  module.exports = function inherits(ctor, superCtor) {\n\t    ctor.super_ = superCtor\n\t    var TempCtor = function () {}\n\t    TempCtor.prototype = superCtor.prototype\n\t    ctor.prototype = new TempCtor()\n\t    ctor.prototype.constructor = ctor\n\t  }\n\t}\n\n\n/***/ },\n/* 63 */\n/***/ function(module, exports, __webpack_require__) {\n\n\t// http://wiki.commonjs.org/wiki/Unit_Testing/1.0\n\t//\n\t// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!\n\t//\n\t// Originally from narwhal.js (http://narwhaljs.org)\n\t// Copyright (c) 2009 Thomas Robinson <280north.com>\n\t//\n\t// Permission is hereby granted, free of charge, to any person obtaining a copy\n\t// of this software and associated documentation files (the 'Software'), to\n\t// deal in the Software without restriction, including without limitation the\n\t// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or\n\t// sell copies of the Software, and to permit persons to whom the Software is\n\t// furnished to do so, subject to the following conditions:\n\t//\n\t// The above copyright notice and this permission notice shall be included in\n\t// all copies or substantial portions of the Software.\n\t//\n\t// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n\t// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n\t// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n\t// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN\n\t// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION\n\t// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n\n\t// when used in node, this will actually load the util module we depend on\n\t// versus loading the builtin util module as happens otherwise\n\t// this is a bug in node module loading as far as I am concerned\n\tvar util = __webpack_require__(60);\n\n\tvar pSlice = Array.prototype.slice;\n\tvar hasOwn = Object.prototype.hasOwnProperty;\n\n\t// 1. The assert module provides functions that throw\n\t// AssertionError's when particular conditions are not met. The\n\t// assert module must conform to the following interface.\n\n\tvar assert = module.exports = ok;\n\n\t// 2. The AssertionError is defined in assert.\n\t// new assert.AssertionError({ message: message,\n\t//                             actual: actual,\n\t//                             expected: expected })\n\n\tassert.AssertionError = function AssertionError(options) {\n\t  this.name = 'AssertionError';\n\t  this.actual = options.actual;\n\t  this.expected = options.expected;\n\t  this.operator = options.operator;\n\t  if (options.message) {\n\t    this.message = options.message;\n\t    this.generatedMessage = false;\n\t  } else {\n\t    this.message = getMessage(this);\n\t    this.generatedMessage = true;\n\t  }\n\t  var stackStartFunction = options.stackStartFunction || fail;\n\n\t  if (Error.captureStackTrace) {\n\t    Error.captureStackTrace(this, stackStartFunction);\n\t  }\n\t  else {\n\t    // non v8 browsers so we can have a stacktrace\n\t    var err = new Error();\n\t    if (err.stack) {\n\t      var out = err.stack;\n\n\t      // try to strip useless frames\n\t      var fn_name = stackStartFunction.name;\n\t      var idx = out.indexOf('\\n' + fn_name);\n\t      if (idx >= 0) {\n\t        // once we have located the function frame\n\t        // we need to strip out everything before it (and its line)\n\t        var next_line = out.indexOf('\\n', idx + 1);\n\t        out = out.substring(next_line + 1);\n\t      }\n\n\t      this.stack = out;\n\t    }\n\t  }\n\t};\n\n\t// assert.AssertionError instanceof Error\n\tutil.inherits(assert.AssertionError, Error);\n\n\tfunction replacer(key, value) {\n\t  if (util.isUndefined(value)) {\n\t    return '' + value;\n\t  }\n\t  if (util.isNumber(value) && !isFinite(value)) {\n\t    return value.toString();\n\t  }\n\t  if (util.isFunction(value) || util.isRegExp(value)) {\n\t    return value.toString();\n\t  }\n\t  return value;\n\t}\n\n\tfunction truncate(s, n) {\n\t  if (util.isString(s)) {\n\t    return s.length < n ? s : s.slice(0, n);\n\t  } else {\n\t    return s;\n\t  }\n\t}\n\n\tfunction getMessage(self) {\n\t  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +\n\t         self.operator + ' ' +\n\t         truncate(JSON.stringify(self.expected, replacer), 128);\n\t}\n\n\t// At present only the three keys mentioned above are used and\n\t// understood by the spec. Implementations or sub modules can pass\n\t// other keys to the AssertionError's constructor - they will be\n\t// ignored.\n\n\t// 3. All of the following functions must throw an AssertionError\n\t// when a corresponding condition is not met, with a message that\n\t// may be undefined if not provided.  All assertion methods provide\n\t// both the actual and expected values to the assertion error for\n\t// display purposes.\n\n\tfunction fail(actual, expected, message, operator, stackStartFunction) {\n\t  throw new assert.AssertionError({\n\t    message: message,\n\t    actual: actual,\n\t    expected: expected,\n\t    operator: operator,\n\t    stackStartFunction: stackStartFunction\n\t  });\n\t}\n\n\t// EXTENSION! allows for well behaved errors defined elsewhere.\n\tassert.fail = fail;\n\n\t// 4. Pure assertion tests whether a value is truthy, as determined\n\t// by !!guard.\n\t// assert.ok(guard, message_opt);\n\t// This statement is equivalent to assert.equal(true, !!guard,\n\t// message_opt);. To test strictly for the value true, use\n\t// assert.str