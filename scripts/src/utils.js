;
(function() {
    "use strict";
    var root = window;
    var Utils = root.Utils || function(obj) {
        if (obj instanceof Utils) return obj;
        if (!(this instanceof Utils)) return new Utils(obj);
        this._wrapped = obj;
    };
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = Utils;
        }
        exports.Utils = Utils;
    } else {
        root.Utils = Utils;
    }
})(this);

;
(function() {
    var breaker = {};
    var ArrayProto = Array.prototype;
    var slice = ArrayProto.slice;
    var ObjProto = Object.prototype
    var nativeForEach = ArrayProto.forEach;
    var toString = ObjProto.toString;
    var nativeKeys = Object.keys;

    Utils.isArray = function(obj) {
        return toString.call(obj) == '[object Array]';
    };
    Utils.ToFixed = function(num, obj) {
        return obj.toFixed(num);
    };
    Utils.templateSettings = {
        evaluate: /<%([\s\S]+?)%>/g,
        interpolate: /<%=([\s\S]+?)%>/g,
        escape: /<%-([\s\S]+?)%>/g
    };
    var keys = nativeKeys || function(obj) {
        if (obj !== Object(obj)) throw new TypeError('Invalid object');
        var keys = [];
        for (var key in obj)
            if (hasOwnProperty.call(obj, key)) keys[keys.length] = key;
        return keys;
    };
    var each = Utils.forEach = function(obj, iterator, context) {
        if (obj == null) return obj;
        if (nativeForEach && obj.forEach === nativeForEach) {
            obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
            for (var i = 0, length = obj.length; i < length; i++) {
                if (iterator.call(context, obj[i], i, obj) === breaker) return;
            }
        } else {
            var keys = keys(obj);
            for (var i = 0, length = keys.length; i < length; i++) {
                if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
            }


        }
        return obj;
    };
    Utils.defaults = function(obj) {
        each(slice.call(arguments, 1), function(source) {
            if (source) {
                for (var prop in source) {
                    if (obj[prop] === void 0) obj[prop] = source[prop];
                }
            }
        });
        return obj;
    };

    var noMatch = /(.)^/;
    var escapes = {
        "'": "'",
        '\\': '\\',
        '\r': 'r',
        '\n': 'n',
        '\t': 't',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };

    var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
    Utils.template = function(text, data, settings) {
        var render;
        settings = Utils.defaults({}, settings, Utils.templateSettings);

        var matcher = new RegExp([
            (settings.escape || noMatch).source, (settings.interpolate || noMatch).source, (settings.evaluate || noMatch).source
        ].join('|') + '|$', 'g');

        var index = 0;
        var source = "__p+='";

        text && text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
            source += text.slice(index, offset)
                .replace(escaper, function(match) {
                    return '\\' + escapes[match];
                });

            if (escape) {
                source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
            }
            if (interpolate) {
                source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
            }
            if (evaluate) {
                source += "';\n" + evaluate + "\n__p+='";
            }
            index = offset + match.length;
            return match;
        });
        source += "';\n";

        if (!settings.variable) source = 'with(data||{}){\n' + source + '}\n';

        source = "var __t,__p='',__j=Array.prototype.join," +
            "print=function(){__p+=__j.call(arguments,'');};\n" +
            source + "return __p;\n";

        try {

            render = new Function(settings.variable || 'data', '_', source);
        } catch (e) {
            e.source = source;
            throw e;
        }

        if (data) return render(data, Utils);
        var template = function(data) {
            return render.call(this, data, Utils);
        };

        template.source = 'function(' + (settings.variable || 'data') + '){\n' + source + '}';

        return template;
    };
})();

(function() {
    Utils.config = {
        speed: 10 * 1000,
        //个人资产
        apiHost: 'http://127.0.0.1:3000/',
        // apiHost: 'http://52.41.94.237/',
        rusherUrl: 'json/asset.json',
        // rusherUrl: 'rusher/json/asset',
        //差价套利
        //rusher_jcUrl: 'rusher/json/jiachadata',
        rusher_jcUrl: 'json/jiachadata.json',
        //设置
        settingsUrl: 'rusher/settings/platform',
        //连接测试
        linktest: 'rusher/settings/testconnection',
        //汇率设置
        exchange_rate: 'rusher/settings/exchange_rate',
        //交易自动化
        changeTradeWay: 'rusher/settings/auto',
        //交易阀值
        threshold_url: 'rusher/settings/threshold'
    };

    Utils.loading = function(dom) {
        if(!dom) return;
        var loadText = $('<div class="loading"></div>');
        var width = dom.width(),
            height = dom.height();
        width = width == 0 ? '100%' : width;
        height = height == 0 ? 40 : height;
        var offset = dom.offset();
        loadText.css({
            left: offset.left,
            top: offset.top,
            "width": width,
            "height": height,
            "z-index": "99"
        });
        dom.append(loadText);
    };

    Utils.removeLoading = function() {
        $('.loading').remove();
    };

    Utils.getKeys = function(obj) {
        if (obj !== Object(obj)) throw new TypeError('Invalid object');
        var keys = [];
        for (var key in obj) {
            keys.push(key);
        }
        return keys.sort();
    };

    Utils.request = function(box, opts) {
        var _this = this;
        this.loading(box);
        var _options = {
            error: function() {
                _this.removeLoading();
            }
        }
        $.extend(_options, opts);
        $.ajax(_options);
    };

    Utils.createTips = function(dom, msg) {
        var tipsDom = $('<div class="messbox js-error"><div class="arrow-outer"><div class="arrow-inner"></div></div><span>' + msg + '</span></div>').appendTo('body');
        var _offset = dom.offset();
        tipsDom.css({
            left: _offset.left,
            top: _offset.top - tipsDom.outerHeight(true) - 8
        });
        dom.addClass('error');
    };
    
    Utils.createAlert = function(msg) {
        var _alertBox = $('<div class="alertOuter js-alert"><div class="bg"></div><div class="alertBox"><h4>提示</h4><div>' + msg + '</div><div class="close-alert"><a href="javascript:;" class="btn js-alertClose">关闭</a></div></div></div>');
        $(_alertBox).appendTo('body');
    }
})();