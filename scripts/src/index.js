(function() {
    var Utils = window.Utils || {};
    var DialogModel = {
        init: function(options) {
            $.extend({
                panel: null,
                mask: null
            });
            $.extend(this, options);
            this.setOptions();
            this.bindEvents();
            this.create();
        },
        setOptions: function() {
            this.lintTextBtn = this.panel.find('#linktest');
            this.saveBtn = this.panel.find('#save');
            this.closeBtn = this.panel.find('.js-close');
            this.accessKeyInput = this.panel.find(".js-accesskey");
            this.secretKeyInput = this.panel.find(".js-secretkey");
            this.secretKeyInput = this.panel.find(".js-platform");
            this.rateInput = this.panel.find(".js-rate");
        },
        create: function() {
            this.mask.fadeIn();
            this.panel.fadeIn();
        },
        close: function() {
            this.panel.fadeOut();
            this.mask.fadeOut();
        },
        bindEvents: function() {
            var _this = this;
            this.closeBtn.on('click', function() {
                _this.close();
            });
            this.lintTextBtn.on('click', function(event) {
                event.stopPropagation();
                var _isvalid = _this.validation(false);
                if (!_isvalid) return;
                Utils.request(_this.lintTextBtn, {
                    type: 'post',
                    url: Utils.config.apiHost + Utils.config.rusherUrl,
                    dataType: 'json',
                    contentType: 'application/json',
                    data: _this.getData(false),
                    success: function(res) {
                        _this.tradeInfoHandler(res);
                    }
                });
            });
        },
        getData: function(hasRate) {
            var data = {};
            data.accessKey = this.accessKeyInput.val();
            data.secretKey = this.secretKeyInput.val();
            data.platform = this.platformsInput.val();
            if (hasRate) data.rate = this.rateInput.val();
            return data;
        },
        validation: function(hasRate) {
            var flag = true;
            flag = flag && this.check(this.accessKeyInput, /^\w+/);
            flag = flag && this.check(this.secretKeyInput, /^\w+/);
            if (hasRate) {
                flag = flag && this.check(this.rateInput, /^[1-9]?\d+$/);
            }
        },
        check: function(dom, regex) {
            var _val = dom.val();
            if (!regex.test(_val)) {
                Utils.createTips(dom, dom.data('error'));
                return false;
            }
            return true;
        }
    };
    var pageInterface = {
        init: function(options) {
            $.extend({
                rusherInfoBox: null,
                rusherInfoTemplate: null,
                tradeInfoBox: null,
                tradeInfoTemplate: null,
                tabContent: null,
                tabItems: null,
                setupDom: null,
                mask: null
            });
            $.extend(this, options);
            this.bindEvents();
        },
        bindEvents: function() {
            this.tabEvent();
            this.dialogEvent();

            //self rusher info 
            this.getRusherSefInfo();

            //rate get
            this.getExchangeRate();

            //trage event
            this.tradeEvent();

            //trade init
            this.tradeInfo();

        },
        tabEvent: function() {
            var _this = this;
            this.tabItems.on('click', function() {
                var index = $(this).index();
                $(this).addClass('current').siblings().removeClass('current');
                _this.tabContent.removeClass('current').eq(index).addClass('current');
            });
        },
        dialogEvent: function() {
            var _this = this;
            this.setupDom.on('click', function() {
                DialogModel.init({
                    panel: _this.dialog,
                    mask: _this.mask
                });
            });
        },
        //个人资产
        getRusherSefInfo: function() {
            var _this = this;
            var _box = this.rusherInfoBox.parents('div.tabItem');
            Utils.request(this.rusherInfoBox, {
                type: 'get',
                dataType: 'json',
                url: Utils.config.apiHost + Utils.config.rusherUrl,
                contentType: 'application/json',
                success: function(res) {
                    _this.rusherInfoHandler(res)
                }
            });
        },
        rusherInfoHandler: function(data) {
            var result = {};
            var keys = Utils.getKeys(data.detail);
            result.total = data.total;
            result.keys = keys;
            result.detail = data.detail;
            var _html = Utils.template(this.rusherInfoTemplate, result);
            this.rusherInfoBox.html(_html);
            Utils.removeLoading();
        },
        getExchangeRate: function() {
            //汇率获取
            Utils.request(null,{
                type: 'get',
                url: Utils.config.apiHost + Utils.config.exchange_rate,
                dataType: 'json',
                contentType: 'application/json',
                data: {},
                success: function(res) {
                    var date = res.exchangerate;
                    $('#exchangeRate').val(data[0].cnyusd);
                }
            });
        },
        tradeEvent: function() {
            var _this = this;
            //汇率设置
            $('#changeRate').on('click', function() {
                if ($(this).hasClass('load')) return;
                var _rate = $('#exchangeRate').val();
                if (!/^\d+(\.\d+)?$/.test(_rate)) {
                    Utils.createTips($('#exchangeRate'), $('#exchangeRate').data('error'));
                    return false;
                }
                $(this).addClass('load');
                Utils.request(null,{
                    type: 'post',
                    url: Utils.config.apiHost + Utils.config.exchange_rate,
                    dataType: 'json',
                    contentType: 'application/json',
                    data: {
                        "exchangerate": [{
                            "cnyusd": Utils.ToFixed(4, _rate)
                        }]
                    },
                    success: function(res) {
                        var date = res.exchangerate;
                        $('#exchangeRate').val(data[0].cnyusd);
                        $('#changeRate').removeClass('load');
                    },
                    error: function() {
                        $('#changeRate').removeClass('load');
                    }
                });
            });

            //自动交易
            $('.js-trade').on('click', function() {
                var _auto = $(this).data('auto');
                Utils.request(null,{
                    type: 'post',
                    url: Utils.config.apiHost + Utils.config.changeTradeWay,
                    dataType: 'json',
                    contentType: 'application/json',
                    data: {
                        "auto": _auto
                    },
                    success: function(res) {
                        if (res.status == 'success') {
                            Utils.createAlert('设置成功');
                        }
                    }
                });
            });

            this.tradeInfoBox.on('keydown', 'input.threshold', function(event) {
                if (event.keyCode == 13) {
                    if (!_this.checkThreshold()) {
                        return false;
                    }
                    Utils.request(null,{
                        type: 'post',
                        url: Utils.config.apiHost + Utils.config.threshold_url,
                        dataType: 'json',
                        contentType: 'application/json',
                        data: _this.getThresholdData(),
                        success: function(res) {
                            if (res.status == 'success') {
                                Utils.createAlert('设置成功');
                            }
                        }
                    });
                }
            });
        },
        getThresholdData: function(flag) {
            return {
                //国内最大买一／kraken卖一
                maxbuy_krakensell: $('#maxbuy_krakensell').val(),
                //国内最大卖一／kraken买一
                maxsell_krakenbuy: $('#maxsell_krakenbuy').val(),
                //国内最大买一／bitbinex卖一 
                maxbuy_bitbinexsell: $('#maxbuy_bitbinexsell').val(),
                //国内最大卖一／bitbinex买一
                maxsell_bitbinexbuy: $('#maxsell_bitbinexbuy').val(),
                //国内最大买一／国内最小卖一
                maxbuy_minsell: $('#maxbuy_minsell').val()
            }
        },
        setThreshold: function() {
            var _this = this;
            Utils.request({
                type: 'get',
                url: Utils.config.apiHost + Utils.config.threshold_url,
                dataType: 'json',
                contentType: 'application/json',
                data: {},
                success: function(res) {
                    if (res) {
                        _this.tresholdData = res;
                        if (_this.tradeInfoBox.find('tr').length) {
                            _this.setThresholdData();
                        }
                    }
                }
            });
        },
        checkThreshold: function() {
            var flag = true;
            flag = flag && this.check($('#maxbuy_minsell'), /^\d+(\.\d+)?$/);
            flag = flag && this.check($('#maxbuy_krakensell'), /^\d+(\.\d+)?$/);
            flag = flag && this.check($('#maxsell_krakenbuy'), /^\d+(\.\d+)?$/);
            flag = flag && this.check($('#maxbuy_bitbinexsell'), /^\d+(\.\d+)?$/);
            flag = flag && this.check($('#maxsell_bitbinexbuy'), /^\d+(\.\d+)?$/);
            return flag;
        },
        check: function(dom, regex) {
            var _val = dom.val();
            if (!regex.test(_val)) {
                Utils.createTips(dom, dom.data('error'));
                return false;
            }
            return true;
        },
        tradeInfo: function() {
            var _this = this;
            this.tradeRequest();
            setInterval(function() {
                _this.tradeRequest();
            }, Utils.config.speed);
        },
        tradeRequest: function() {
            var _this = this;
            var _box = this.tradeInfoBox.parents('div.tabItem');
            Utils.request(_this.tradeInfoBox, {
                type: 'post',
                url: Utils.config.apiHost + Utils.config.rusher_jcUrl,
                dataType: 'json',
                contentType: 'application/json',
                data: {},
                success: function(res) {
                    _this.tradeInfoHandler(res);
                }
            });
        },
        tradeInfoHandler: function(data) {
            this.cnyusdratio = data.cnyusdratio;
            var _html = Utils.template(this.tradeInfoTemplate, data);
            this.tradeInfoBox.html(_html);
            this.setThresholdData();
            Utils.removeLoading();
        },
        setThresholdData: function() {
            var data = this.tresholdData;
            if (data) {
                //国内最大买一／kraken卖一
                data.maxbuy_krakensell && $('#maxbuy_krakensell').val(data.maxbuy_krakensell);
                //国内最大卖一／kraken买一
                data.maxsell_krakenbuy && $('#maxsell_krakenbuy').val(data.maxsell_krakenbuy);
                //国内最大买一／bitbinex卖一 
                data.maxbuy_bitbinexsell && $('#maxbuy_bitbinexsell').val(data.maxbuy_bitbinexsell);
                //国内最大卖一／bitbinex买一
                data.maxsell_bitbinexbuy && $('#maxsell_bitbinexbuy').val(data.maxsell_bitbinexbuy);
                //国内最大买一／国内最小卖一
                data.maxbuy_minsell && $('#maxbuy_minsell').val(data.maxbuy_minsell);
            }
        }
    };

    $(document).ready(function() {
        pageInterface.init({
            tabItems: $('#js-tab li'),
            tabContent: $('#js-tabContent div.tabItem'),
            rusherInfoBox: $('#rusherInfoBox'),
            rusherInfoTemplate: $('#rusherInfo').html(),
            tradeInfoBox: $('#tradeInfoBox'),
            tradeInfoTemplate: $('#tradeInfo').html(),
            setupDom: $('#marketSetUp'),
            dialog: $('#dialog'),
            mask: $('#mask')
        });

        $('body').on("click", function() {
            var jsError = $('.js-error');
            if (jsError.length) {
                jsError.remove();
                $('.error').removeClass('error');
            }
        });

        $('.body').on('click','a.js-alertClose',function(){
            $('.js-alert').remove();
        });
    });
})();