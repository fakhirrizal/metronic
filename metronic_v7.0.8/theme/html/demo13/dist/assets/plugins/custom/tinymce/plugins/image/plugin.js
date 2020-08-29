/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 *
 * Version: 5.4.1 (2020-07-08)
 */
(function (domGlobals) {
    'use strict';

    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

    var noop = function () {
    };
    var constant = function (value) {
      return function () {
        return value;
      };
    };
    var never = constant(false);
    var always = constant(true);

    var none = function () {
      return NONE;
    };
    var NONE = function () {
      var eq = function (o) {
        return o.isNone();
      };
      var call = function (thunk) {
        return thunk();
      };
      var id = function (n) {
        return n;
      };
      var me = {
        fold: function (n, _s) {
          return n();
        },
        is: never,
        isSome: never,
        isNone: always,
        getOr: id,
        getOrThunk: call,
        getOrDie: function (msg) {
          throw new Error(msg || 'error: getOrDie called on none.');
        },
        getOrNull: constant(null),
        getOrUndefined: constant(undefined),
        or: id,
        orThunk: call,
        map: none,
        each: noop,
        bind: none,
        exists: never,
        forall: always,
        filter: none,
        equals: eq,
        equals_: eq,
        toArray: function () {
          return [];
        },
        toString: constant('none()')
      };
      return me;
    }();
    var some = function (a) {
      var constant_a = constant(a);
      var self = function () {
        return me;
      };
      var bind = function (f) {
        return f(a);
      };
      var me = {
        fold: function (n, s) {
          return s(a);
        },
        is: function (v) {
          return a === v;
        },
        isSome: always,
        isNone: never,
        getOr: constant_a,
        getOrThunk: constant_a,
        getOrDie: constant_a,
        getOrNull: constant_a,
        getOrUndefined: constant_a,
        or: self,
        orThunk: self,
        map: function (f) {
          return some(f(a));
        },
        each: function (f) {
          f(a);
        },
        bind: bind,
        exists: bind,
        forall: bind,
        filter: function (f) {
          return f(a) ? me : NONE;
        },
        toArray: function () {
          return [a];
        },
        toString: function () {
          return 'some(' + a + ')';
        },
        equals: function (o) {
          return o.is(a);
        },
        equals_: function (o, elementEq) {
          return o.fold(never, function (b) {
            return elementEq(a, b);
          });
        }
      };
      return me;
    };
    var from = function (value) {
      return value === null || value === undefined ? NONE : some(value);
    };
    var Option = {
      some: some,
      none: none,
      from: from
    };

    var typeOf = function (x) {
      var t = typeof x;
      if (x === null) {
        return 'null';
      } else if (t === 'object' && (Array.prototype.isPrototypeOf(x) || x.constructor && x.constructor.name === 'Array')) {
        return 'array';
      } else if (t === 'object' && (String.prototype.isPrototypeOf(x) || x.constructor && x.constructor.name === 'String')) {
        return 'string';
      } else {
        return t;
      }
    };
    var isType = function (type) {
      return function (value) {
        return typeOf(value) === type;
      };
    };
    var isSimpleType = function (type) {
      return function (value) {
        return typeof value === type;
      };
    };
    var eq = function (t) {
      return function (a) {
        return t === a;
      };
    };
    var isString = isType('string');
    var isObject = isType('object');
    var isArray = isType('array');
    var isNull = eq(null);
    var isBoolean = isSimpleType('boolean');
    var isNumber = isSimpleType('number');

    var nativePush = Array.protot  <a href="page_user_profile_2.html" class="nav-link ">
                                                    <i class="icon-users"></i> Profile 2 </a>
                                            </li>
                                            <li class="dropdown-submenu ">
                                                <a href="javascript:;" class="nav-link nav-toggle">
                                                    <i class="icon-notebook"></i> Login
                                                    <span class="arrow"></span>
                                                </a>
                                                <ul class="dropdown-menu">
                                                    <li class="">
                                                        <a href="page_user_login_1.html" class="nav-link " target="_blank"> Login Page 1 </a>
                                                    </li>
                                                    <li class="">
                                                        <a href="page_user_login_2.html" class="nav-link " target="_blank"> Login Page 2 </a>
                                                    </li>
                                                    <li class="">
                                                        <a href="page_user_login_3.html" class="nav-link " target="_blank"> Login Page 3 </a>
                                                    </li>
                                                    <li class="">
                                                        <a href="page_user_login_4.html" class="nav-link " target="_blank"> Login Page 4 </a>
                                                    </li>
                                                    <li class="">
                                                        <a href="page_user_login_5.html" class="nav-link " target="_blank"> Login Page 5 </a>
                                                    </li>
                                                    <li class="">
                                                        <a href="page_user_login_6.html" class="nav-link " target="_blank"> Login Page 6 </a>
                                                    </li>
                                                </ul>
                                            </li>
                                            <li class=" ">
                                                <a href="page_user_lock_1.html" class="nav-link " target="_blank">
                                                    <i class="icon-lock"></i> Lock Screen 1 </a>
                                            </li>
                                            <li class=" ">
                                                <a href="page_user_lock_2.html" class="nav-link " target="_blank">
                                                    <i class="icon-lock-open"></i> Lock Screen 2 </a>
                                            </li>
                                        </ul>
                                    </li>
                                    <li class="dropdown-submenu ">
                                        <a href="javascript:;" class="nav-link nav-toggle ">
                                            <i class="icon-social-dribbble"></i> General
                                            <span class="arrow"></span>
                                        </a>
                                        <ul class="dropdown-menu">
                                            <li class=" ">
                                                <a href="page_general_about.html" class="nav-link ">
                                                    <i class="icon-info"></i> About </a>
                                            </li>
                                            <li class=" ">
                                                <a href="page_general_contact.html" class="nav-link ">
                                                    <i class="icon-call-end"></i> Contact </a>
                                            </li>
                                            <li class="dropdown-submenu ">
                                                <a href="javascript:;" class="nav-link nav-toggle">
                                                    <i class="icon-notebook"></i> Portfolio
                                                    <span class="arrow"></span>
                                                </a>
                                                <ul class="dropdown-menu">
                                                    <li class="">
                                                        <a href="page_general_portfolio_1.html" class="nav-link "> Portfolio 1 </a>
                                                    </li>
                                                    <li class="">
                                                        <a href="page_general_portfolio_2.html" class="nav-link "> Portfolio 2 </a>
                                                    </li>
                                                    <li class="">
                                                        <a href="page_general_portfolio_3.html" class="nav-link "> Portfolio 3 </a>
                                                    </li>
                                                    <li class="">
                                                        <a href="page_general_portfolio_4.html" class="nav-link "> Portfolio 4 </a>
                                                    </li>
                                                </ul>
                                            </li>
                                            <li class="dropdown-submenu ">
                                                <a href="javascript:;" class="nav-link nav-toggle">
                                                    <i class="icon-magnifier"></i> Search
                                                    <span class="arrow"></span>
                                                </a>
                                                <ul class="dropdown-menu">
                                                    <li class="">
                                                        <a href="page_general_search.html" class="nav-link "> Search 1 </a>
                                                    </li>
                                                    <li class="">
                                                        <a href="page_general_search_2.html" class="nav-link "> Search 2 </a>
                                                    </li>
                                                    <li class="">
                                                        <a href="page_general_search_3.html" class="nav-link "> Search 3 </a>
                                                    </li>
                                                    <li class="">
                                                        <a href="page_general_search_4.html" class="nav-link "> Search 4 </a>
                                                    </li>
                                                    <li class="">
                                                        <a href="page_general_search_5.html" class="nav-link "> Search 5 </a>
                                                    </li>
                                                </ul>
                                            </li>
                                            <li class=" ">
                                                <a href="page_general_pricing.html" class="nav-link ">
                                                    <i class="icon-tag"></i> Pricing </a>
                                            </li>
                                            <li class=" ">
                                                <a href="page_general_faq.html" class="nav-link ">
                                                    <i class="icon-wrench"></i> FAQ </a>
                                            </li>
                                            <li class=" ">
                                                <a href="page_general_blog.html" class="nav-link ">
                                                    <i class="icon-pencil"></i> Blog </a>
                                            </li>
                                            <li class=" ">
                                                <a href="page_general_blog_post.html" class="nav-link ">
                                                    <i class="icon-note"></i> Blog Post </a>
                                            </li>
                                            <li class=" ">
                                                <a href="page_general_invoice.html" class="nav-link ">
                                                    <i class="icon-envelope"></i> Invoice </a>
                                            </li>
                                            <li class=" ">
                                                <a href="page_general_invoice_2.html" class="nav-link ">
                                                    <i class="icon-envelope"></i> Invoice 2 </a>
                                            </li>
                                        </ul>
                                    </li>
                                    <li class="dropdown-submenu ">
                                        <a href="javascript:;" class="nav-link nav-toggle ">
                                            <i class="icon-settings"></i> System
                                            <span class="arrow"></span>
                                        </a>
                                        <ul class="dropdown-menu">
                                            <li class=" ">
                                                <a href="page_system_coming_soon.html" class="nav-link " target="_blank"> Coming Soon </a>
                                            </li>
                                            <li class=" ">
                                                <a href="page_system_404_1.html" class="nav-link "> 404 Page 1 </a>
                                            </li>
                                            <li class=" ">
                                                <a href="page_system_404_2.html" class="nav-link " target="_blank"> 404 Page 2 </a>
                                            </li>
                                            <li class=" ">
                                                <a href="page_system_404_3.html" class="nav-link " target="_blank"> 404 Page 3 </a>
                                            </li>
                                            <li class=" ">
                                                <a href="page_system_500_1.html" class="nav-link "> 500 Page 1 </a>
                                            </li>
                                            <li class=" ">
                                                <a href="page_system_500_2.html" class="nav-link " target="_blank"> 500 Page 2 </a>
                                            </li>
                                        </ul>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    <!-- END MEGA MENU -->
                </div>
            </div>
            <!-- END HEADER MENU -->
        </div>
        <!-- END HEADER -->
        <!-- BEGIN CONTAINER -->
        <div class="page-container">
            <!-- BEGIN CONTENT -->
            <div class="page-content-wrapper">
                <!-- BEGIN CONTENT BODY -->
                <!-- BEGIN PAGE HEAD-->
                <div class="page-head">
                    <div class="container">
                        <!-- BEGIN PAGE TITLE -->
                        <div class="page-title">
                            <h1>Select Splitter
                                <small>bootstrap select splitter</small>
                            </h1>
                        </div>
                        <!-- END PAGE TITLE -->
                        <!-- BEGIN PAGE TOOLBAR -->
                        <div class="page-toolbar">
                            <!-- BEGIN THEME PANEL -->
                            <div class="btn-group btn-theme-panel">
                                <a href="javascript:;" class="btn dropdown-toggle" data-toggle="dropdown">
                                    <i class="icon-settings"></i>
                                </a>
                                <div class="dropdown-menu theme-panel pull-right dropdown-custom hold-on-click">
                                    <div class="row">
                                        <div class="col-md-6 col-sm-6 col-xs-12">
                                            <h3>THEME COLORS</h3>
                                            <div class="row">
                                                <div class="col-md-6 col-sm-6 col-xs-12">
                                                    <ul class="theme-colors">
                                                        <li class="theme-color theme-color-default" data-theme="default">
                                                            <span class="theme-color-view"></span>
                                                            <span class="theme-color-name">Default</span>
                                                        </li>
                                                        <li class="theme-color theme-color-blue-hoki" data-theme="blue-hoki">
                                                            <span class="theme-color-view"></span>
                                                            <span class="theme-color-name">Blue Hoki</span>
                                                        </li>
                                                        <li class="theme-color theme-color-blue-steel" data-theme="blue-steel">
                                                            <span class="theme-color-view"></span>
                                                            <span class="theme-color-name">Blue Steel</span>
                                                        </li>
                                                        <li class="theme-color theme-color-yellow-orange" data-theme="yellow-orange">
                                                            <span class="theme-color-view"></span>
                                                            <span class="theme-color-name">Orange</span>
                                                        </li>
                                                        <li class="theme-color theme-color-yellow-crusta" data-theme="yellow-crusta">
                                                            <span class="theme-color-view"></span>
                                                            <span class="theme-color-name">Yellow Crusta</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                                <div class="col-md-6 col-sm-6 col-xs-12">
                                                    <ul class="theme-colors">
                                                        <li class="theme-color theme-color-green-haze" data-theme="green-haze">
                                                            <span class="theme-color-view"></span>
                                                            <span class="theme-color-name">Green Haze</span>
                                                        </li>
                                                        <li class="theme-color theme-color-red-sunglo" data-theme="red-sunglo">
                                                            <span class="theme-color-view"></span>
                                                            <span class="theme-color-name">Red Sunglo</span>
                                                        </li>
                                                        <li class="theme-color theme-color-red-intense" data-theme="red-intense">
                                                            <span class="theme-color-view"></span>
                                                            <span class="theme-color-name">Red Intense</span>
                                                        </li>
                                                        <li class="theme-color theme-color-purple-plum" data-theme="purple-plum">
                                                            <span class="theme-color-view"></span>
                                                            <span class="theme-color-name">Purple Plum</span>
                                                        </li>
                                                        <li class="theme-color theme-color-purple-studio" data-theme="purple-studio">
                                                            <span class="theme-color-view"></span>
                                                            <span class="theme-color-name">Purple Studio</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-6 col-sm-6 col-xs-12 seperator">
                                            <h3>LAYOUT</h3>
                                            <ul class="theme-settings">
                                                <li> Theme Style
                                                    <select class="theme-setting theme-setting-style form-control input-sm input-small input-inline tooltips" data-original-title="Change theme style" data-container="body" data-placement="left">
                                                        <option value="boxed" selected="selected">Square corners</option>
                                                        <option value="rounded">Rounded corners</option>
                                                    </select>
                                                </li>
                                                <li> Layout
                                                    <select class="theme-setting theme-setting-layout form-control input-sm input-small input-inline tooltips" data-original-title="Change layout type" data-container="body" data-placement="left">
                                                        <option value="boxed" selected="selected">Boxed</option>
                                                        <option value="fluid">Fluid</option>
                                                    </select>
                                                </li>
                                                <li> Top Menu Style
                                                    <select class="theme-setting theme-setting-top-menu-style form-control input-sm input-small input-inline tooltips" data-original-title="Change top menu dropdowns style" data-container="body"
                                                        data-placement="left">
                                                        <option value="dark" selected="selected">Dark</option>
                                                        <option value="light">Light</option>
                                                    </select>
                                                </li>
                                                <li> Top Menu Mode
                                                    <select class="theme-setting theme-setting-top-menu-mode form-control input-sm input-small input-inline tooltips" data-original-title="Enable fixed(sticky) top menu" data-container="body" data-placement="left">
                                                        <option value="fixed">Fixed</option>
                                                        <option value="not-fixed" selected="selected">Not Fixed</option>
                                                    </select>
                                                </li>
                                                <li> Mega Menu Style
                                                    <select class="theme-setting theme-setting-mega-menu-style form-control input-sm input-small input-inline tooltips" data-original-title="Change mega menu dropdowns style" data-container="body"
                                                        data-placement="left">
                                                        <option value="dark" selected="selected">Dark</option>
                                                        <option value="light">Light</option>
                                                    </select>
                                                </li>
                                                <li> Mega Menu Mode
                                                    <select class="theme-setting theme-setting-mega-menu-mode form-control input-sm input-small input-inline tooltips" data-original-title="Enable fixed(sticky) mega menu" data-container="body"
                                                        data-placement="left">
                                                        <option value="fixed" selected="selected">Fixed</option>
                                                        <option value="not-fixed">Not Fixed</option>
                                                    </select>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- END THEME PANEL -->
                        </div>
                        <!-- END PAGE TOOLBAR -->
                    </div>
                </div>
                <!-- END PAGE HEAD-->
                <!-- BEGIN PAGE CONTENT BODY -->
                <div class="page-content">
                    <div class="container">
                        <!-- BEGIN PAGE BREADCRUMBS -->
                        <ul class="page-breadcrumb breadcrumb">
                            <li>
                                <a href="index.html">Home</a>
                                <i class="fa fa-circle"></i>
                            </li>
                            <li>
                                <a href="#">Components</a>
                                <i class="fa fa-circle"></i>
                            </li>
                            <li>
                                <span>Select Splitter</span>
                            </li>
                        </ul>
                        <!-- END PAGE BREADCRUMBS -->
                        <!-- BEGIN PAGE CONTENT INNER -->
                        <div class="page-content-inner">
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="note note-success">
                                        <h3>Bootstrap Select Splitter</h3>
                                        <p> Transforms a <code>&lt;select&gt;</code> containing one or more <code>&lt;optgroup&gt;</code> into two chained <code>&lt;select&gt;</code>. For more info please check out
                                            <a href="https://github.com/xavierfaucon/bootstrap-selectsplitter"
                                                target="_blank">the official documentation</a>. </p>
                                    </div>
                                    <!-- BEGIN PORTLET-->
                                    <div class="portlet light bordered form-fit">
                                        <div class="portlet-title">
                                            <div class="caption font-green-sharp">
                                                <i class="icon-speech font-green-sharp"></i>
                                                <span class="caption-subject bold uppercase"> Bootstrap Select Splitter</span>
                                                <span class="caption-helper"></span>
                                            </div>
                                            <div class="actions">
                                                <a href="javascript:;" class="btn btn-circle btn-default btn-sm">
                                                    <i class="fa fa-pencil"></i> Edit </a>
                                                <a href="javascript:;" class="btn btn-circle btn-default btn-sm">
                                                    <i class="fa fa-plus"></i> Add </a>
                                                <a class="btn btn-circle btn-icon-only btn-default" href="javascript:;">
                                                    <i class="icon-wrench"></i>
                                                </a>
                                            </div>
                                        </div>
                                        <div class="portlet-body form">
                                            <form action="#" id="form-username" class="form-horizontal form-bordered">
                                                <div class="form-group">
                                                    <label class="col-md-3 control-label">Demo 1</label>
                                                    <div class="col-md-9">
                                                        <select id="select_selectsplitter1" class="form-control" size="4">
                                                            <optgroup label="Category 1">
                                                                <option value="1">Option 1</option>
                                                                <option value="2">Option 2</option>
                                                                <option value="3">Option 3</option>
                                                                <option value="4">Option 4</option>
                                                                <option value="5">Option 5</option>
                                                                <option value="6">Option 6</option>
                                                                <option value="7">Option 7</option>
                                                                <option value="8">Option 8</option>
                                                            </optgroup>
                                                            <optgroup label="Category 2">
                                                                <option value="9">Option 9</option>
                                                                <option value="10">Option 10</option>
                                                                <option value="11">Option 11</option>
                                                                <option value="12">Option 12</option>
                                                                <option value="13">Option 13</option>
                                                                <option value="14">Option 14</option>
                                                                <option value="15">Option 15</option>
                                                                <option value="16">Option 16</option>
                                                            </optgroup>
                                                            <optgroup label="Category 3">
                                                                <option value="17">Option 17</option>
                                                                <option value="18">Option 18</option>
                                                                <option value="19">Option 19</option>
                                                                <option value="20">Option 20</option>
                                                                <option value="21">Option 21</option>
                                                            </optgroup>
                                                        </select>
                                                        <p class="help-block"> click on the main option to list its child items </p>
                                                    </div>
                                                </div>
                                                <div class="form-group">
                                                    <label class="col-md-3 control-label">Demo 2</label>
                                                    <div class="col-md-9">
                                                        <select id="select_selectsplitter2" class="form-control">
                                                            <optgroup label="Category A">
                                                                <option value="1">Choice 1</option>
                                                                <option value="2">Choice 2</option>
                                                                <option value="3">Choice 3</option>
                                                                <option value="4">Choice 4</option>
                                                                <option value="5">Choice 5</option>
                                                                <option value="6">Choice 6</option>
                                                                <option value="7">Choice 7</option>
                                                                <option value="8">Choice 8</option>
                                                            </optgroup>
                                                            <optgroup label="Category B">
                                                                <option value="9">Choice 9</option>
                                                                <option value="10">Choice 10</option>
                                                                <option value="11">Choice 11</option>
                                                                <option value="12">Choice 12</option>
                                                                <option value="13">Choice 13</option>
                                                                <option value="14">Choice 14</option>
                                                                <option value="15">Choice 15</option>
                                                                <option value="16">Choice 16</option>
                                                            </optgroup>
                                                            <optgroup label="Category C">
                                                                <option value="17">Choice 17</option>
                                                                <option value="18">Choice 18</option>
                                                                <option value="19">Choice 19</option>
                                                                <option value="20">Choice 20</option>
                                                            </optgroup>
                                                        </select>
                                                        <p class="help-block"> click on the main option to list its child items </p>
                                                    </div>
                                                </div>
                                                <div class="form-group last">
                                                    <label class="col-md-3 control-label">Demo 3</label>
                                                    <div class="col-md-6">
                                                        <select id="select_selectsplitter3" class="form-control">
                                                            <optgroup label="Group 1">
                                                                <option value="1">Item 1</option>
                                                                <option value="2">Item 2</option>
                                                                <option value="3">Item 3</option>
                                                                <option value="4">Item 4</option>
                                                                <option value="5">Item 5</option>
                                                                <option value="6">Item 6</option>
                                                                <option value="7">Item 7</option>
                                                                <option value="8">Item 8</option>
                                                            </optgroup>
                                                            <optgroup label="Group 2">
                                                                <option value="9">Item 9</option>
                                                                <option value="10">Item 10</option>
                                                                <option value="11">Item 11</option>
                                                                <option value="12">Item 12</option>
                                                                <option value="13">Item 13</option>
                                                                <option value="14">Item 14</option>
                                                                <option value="15">Item 15</option>
                                                                <option value="16">Item 16</option>
                                                            </optgroup>
                                                            <optgroup label="Group 3">
                                                                <option value="17">Item 17</option>
                                                                <option value="18">Item 18</option>
                                                                <option value="19">Item 19</option>
                                                                <option value="20">Item 20</option>
                                                            </optgroup>
                                                            <optgroup label="Group 4">
                                                                <option value="21">Item 21</option>
                                                                <option value="22">Item 22</option>
                                                                <option value="23">Item 23</option>
                                                                <option value="24">Item 24</option>
                                                                <option value="25">Item 25</option>
                                                                <option value="26">Item 26</option>
                                                                <option value="27">Item 27</option>
                                                                <option value="28">Item 28</option>
                                                            </optgroup>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div class="form-actions">
                                                    <div class="row">
                                                        <div class="col-md-offset-3 col-md-9">
                                                            <button type="submit" class="btn green">
                                                                <i class="fa fa-check"></i> Submit</button>
                                                            <button type="button" class="btn default">Cancel</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                    <!-- END PORTLET-->
                                </div>
                            </div>
                        </div>
                        <!-- END PAGE CONTENT INNER -->
                    </div>
                </div>
                <!-- END PAGE CONTENT BODY -->
                <!-- END CONTENT BODY -->
            </div>
            <!-- END CONTENT -->
            <!-- BEGIN QUICK SIDEBAR -->
            <a href="javascript:;" class="page-quick-sidebar-toggler">
                <i class="icon-login"></i>
            </a>
            <div class="page-quick-sidebar-wrapper" data-close-on-body-click="false">
                <div class="page-quick-sidebar">
                    <ul class="nav nav-tabs">
                        <li class="active">
                            <a href="javascript:;" data-target="#quick_sidebar_tab_1" data-toggle="tab"> Users
                                <span class="badge badge-danger">2</span>
                            </a>
                        </li>
                        <li>
                            <a href="javascript:;" data-target="#quick_sidebar_tab_2" data-toggle="tab"> Alerts
                                <span class="badge badge-success">7</span>
                            </a>
                        </li>
                        <li class="dropdown">
                            <a href="javascript:;" class="dropdown-toggle" data-toggle="dropdown"> More
                                <i class="fa fa-angle-down"></i>
                            </a>
                            <ul class="dropdown-menu pull-right">
                                <li>
                                    <a href="javascript:;" data-target="#quick_sidebar_tab_3" data-toggle="tab">
                                        <i class="icon-bell"></i> Alerts </a>
                                </li>
                                <li>
                                    <a href="javascript:;" data-target="#quick_sidebar_tab_3" data-toggle="tab">
                                        <i class="icon-info"></i> Notifications </a>
                                </li>
                                <li>
                                    <a href="javascript:;" data-target="#quick_sidebar_tab_3" data-toggle="tab">
                                        <i class="icon-speech"></i> Activities </a>
                                </li>
                                <li class="divider"></li>
                                <li>
                                    <a href="javascript:;" data-target="#quick_sidebar_tab_3" data-toggle="tab">
                                        <i class="icon-settings"></i> Settings </a>
                                </li>
                            </ul>
                        </li>
                    </ul>
                    <div class="tab-content">
                        <div class="tab-pane active page-quick-sidebar-chat" id="quick_sidebar_tab_1">
                            <div class="page-quick-sidebar-chat-users" data-rail-color="#ddd" data-wrapper-class="page-quick-sidebar-list">
                                <h3 class="list-heading">Staff</h3>
                                <ul class="media-list list-items">
                                    <li class="media">
                                        <div class="media-status">
                                            <span class="badge badge-success">8</span>
                                        </div>
                                        <img class="media-object" src="../assets/layouts/layout/img/avatar3.jpg" alt="...">
                                        <div class="media-body">
                                            <h4 class="media-heading">Bob Nilson</h4>
                                            <div class="media-heading-sub"> Project Manager </div>
                                        </div>
                                    </li>
                                    <li class="media">
                                        <img class="media-object" src="../assets/layouts/layout/img/avatar1.jpg" alt="...">
                                        <div class="media-body">
                                            <h4 class="media-heading">Nick Larson</h4>
                                            <div class="media-heading-sub"> Art Director </div>
                                        </div>
                                    </li>
                                    <li class="media">
                                        <div class="media-status">
                                            <span class="badge badge-danger">3</span>
                                        </div>
                                        <img class="media-object" src="../assets/layouts/layout/img/avatar4.jpg" alt="...">
                                        <div class="media-body">
                                            <h4 class="media-heading">Deon Hubert</h4>
                                            <div class="media-heading-sub"> CTO </div>
                                        </div>
                                    </li>
                                    <li class="media">
                                        <img class="media-object" src="../assets/layouts/layout/img/avatar2.jpg" alt="...">
                                        <div class="media-body">
                                            <h4 class="media-heading">Ella Wong</h4>
                                            <div class="media-heading-sub"> CEO </div>
                                        </div>
                                    </li>
                                </ul>
                                <h3 class="list-heading">Customers</h3>
                                <ul class="media-list list-items">
                                    <li class="media">
                                        <div class="media-status">
                                            <span class="badge badge-warning">2</span>
                                        </div>
                                        <img class="media-object" src="../assets/layouts/layout/img/avatar6.jpg" alt="...">
                                        <div class="media-body">
                                            <h4 class="media-heading">Lara Kunis</h4>
                                            <div class="media-heading-sub"> CEO, Loop Inc </div>
                                            <div class="media-heading-small"> Last seen 03:10 AM </div>
                                        </div>
                                    </li>
                                    <li class="media">
                                        <div class="media-status">
                                            <span class="label label-sm label-success">new</span>
                                        </div>
                                        <img class="media-object" src="../assets/layouts/layout/img/avatar7.jpg" alt="...">
                                        <div class="media-body">
                                            <h4 class="media-heading">Ernie Kyllonen</h4>
                                            <div class="media-heading-sub"> Project Manager,
                                                <br> SmartBizz PTL </div>
                                        </div>
                                    </li>
                                    <li class="media">
                                        <img class="media-object" src="../assets/layouts/layout/img/avatar8.jpg" alt="...">
                                        <div class="media-body">
                                            <h4 class="media-heading">Lisa Stone</h4>
                                            <div class="media-heading-sub"> CTO, Keort Inc </div>
                                            <div class="media-heading-small"> Last seen 13:10 PM </div>
                                        </div>
                                    </li>
                                    <li class="media">
                                        <div class="media-status">
                                            <span class="badge badge-success">7</span>
                                        </div>
                                        <img class="media-object" src="../assets/layouts/layout/img/avatar9.jpg" alt="...">
                                        <div class="media-body">
                                            <h4 class="media-heading">Deon Portalatin</h4>
                                            <div class="media-heading-sub"> CFO, H&D LTD </div>
                                        </div>
                                    </li>
                                    <li class="media">
                                        <img class="media-object" src="../assets/layouts/layout/img/avatar10.jpg" alt="...">
                                        <div class="media-body">
                                            <h4 class="media-heading">Irina Savikova</h4>
                                            <div class="media-heading-sub"> CEO, Tizda Motors Inc </div>
                                        </div>
                                    </li>
                                    <li class="media">
                                        <div class="media-status">
                                            <span class="badge badge-danger">4</span>
                                        </div>
                                        <img class="media-object" src="../assets/layouts/layout/img/avatar11.jpg" alt="...">
                                        <div class="media-body">
                                            <h4 class="media-heading">Maria Gomez</h4>
                                            <div class="media-heading-sub"> Manager, Infomatic Inc </div>
                                            <div class="media-heading-small"> Last seen 03:10 AM </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <div class="page-quick-sidebar-item">
                                <div class="page-quick-sidebar-chat-user">
                                    <div class="page-quick-sidebar-nav">
                                        <a href="javascript:;" class="page-quick-sidebar-back-to-list">
                                            <i class="icon-arrow-left"></i>Back</a>
                                    </div>
                                    <div class="page-quick-sidebar-chat-user-messages">
                                        <div class="post out">
                                            <img class="avatar" alt="" src="../assets/layouts/layout/img/avatar3.jpg" />
                                            <div class="message">
                                                <span class="arrow"></span>
                                                <a href="javascript:;" class="name">Bob Nilson</a>
                                                <span class="datetime">20:15</span>
                                                <span class="body"> When could you send me the report ? </span>
                                            </div>
                                        </div>
                                        <div class="post in">
                                            <img class="avatar" alt="" src="../assets/layouts/layout/img/avatar2.jpg" />
                                            <div class="message">
                                                <span class="arrow"></span>
                                                <a href="javascript:;" class="name">Ella Wong</a>
                                                <span class="datetime">20:15</span>
                                                <span class="body"> Its almost done. I will be sending it shortly </span>
                            