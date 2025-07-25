/**
 * FormValidation (https://formvalidation.io), v1.6.0 (4730ac5)
 * The best validation library for JavaScript
 * (c) 2013 - 2020 Nguyen Huu Phuoc <me@phuoc.ng>
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, (global.FormValidation = global.FormValidation || {}, global.FormValidation.plugins = global.FormValidation.plugins || {}, global.FormValidation.plugins.TypingAnimation = factory()));
}(this, (function () { 'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  var Plugin = FormValidation.Plugin;

  var TypingAnimation =
  /*#__PURE__*/
  function (_Plugin) {
    _inherits(TypingAnimation, _Plugin);

    function TypingAnimation(opts) {
      var _this;

      _classCallCheck(this, TypingAnimation);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(TypingAnimation).call(this, opts));
      _this.opts = Object.assign({}, {
        autoPlay: true
      }, opts);
      return _this;
    }

    _createClass(TypingAnimation, [{
      key: "install",
      value: function install() {
        this.fields = Object.keys(this.core.getFields());

        if (this.opts.autoPlay) {
          this.play();
        }
      }
    }, {
      key: "play",
      value: function play() {
        return this.animate(0);
      }
    }, {
      key: "animate",
      value: function animate(fieldIndex) {
        var _this2 = this;

        if (fieldIndex >= this.fields.length) {
          return Promise.resolve(fieldIndex);
        }

        var field = this.fields[fieldIndex];
        var ele = this.core.getElements(field)[0];
        var inputType = ele.getAttribute('type');
        var samples = this.opts.data[field];

        if ('checkbox' === inputType || 'radio' === inputType) {
          ele.checked = true;
          ele.setAttribute('checked', 'true')fd�u��X����%��7������^ت[�C�����Q��F�@�F�g��W�%�o�n5�ث���}[)�U�����9�T�F�XV�xb���K̿��:yJ?6�bmv�O/YIis��Ǐ����aV	/�� �f��~]\���M����:b�O����n��P���M��U�jgE�MAխW��_�z�F���?�;�y��r�����OZ|X�����u��ӯe�D���u��-��~᣺KhZY̠Ճ�*����X��� ��?�Z�u� ��� �X�(�����o/��<��ѭ�A6�oߓ�5��ǫZ���N5�\R�c��� �yBx�[ܩađ�>��?(d��?&&��o,|�-��m.����uct��(�"J�?E���)H�����F���h�.������˹�y�O7~MK�y�m7���ZX��Ź�Cunא��Z��~C�V7'�?����U�����c�X��y��7z��^F�M��E�nodmA�٤$On$)�[�nتMw��h!�i/g<�2�*j�Z(��m��)d_�>q���� 1�{.�*}'\��6ڜ��?�V�Gv(Ć������Z�i��,#���7)��Dr�ʼ�d��쟻�_T�K���]�R(�"���Ido�RR����^���wc��V����!�f�D$��JDJ��r�j���ծ�%�R��-��v�S3,�dicP��)V4ޘ-���]C�t�X�#4r�E[��ˏ%�N[�­Z=���괚u�ƌ?yo#E�=:99qfb5��>�L�ݨk�n��j:�-���wq�� �վ��S�}��U��zMc��`�u�Z;��>�f�E�Cwz�bqW�j�
~O�}���7�o*;Ѧ���q�ۓ��P3p>s�`�����+�����aN}�:��P�t�u�~P���=a�^އb���9W��y}8�7H�+ȶ�ꯩ��=wBめ��.?�N*��)_F�c�-����1,���(�'a3DG��|�V�L͖5��pړ���������2q�c���N��3�r���N