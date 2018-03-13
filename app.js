/**
 * Created by VigoXu on 2016/6/27.
 */
(function () {
    /**
     * 定义视图渲染需要的变量
     * 其它变量请定义在App或App.global对象上
     */
    var data = function () {
        var r = {
            /* 以下是数据变量定义 */
            list: [], //列表数据
            item: {}, //一行数据
            total: 0, //记录行数
            totalPage: 0, //总页数
            search: {}, //搜索表单的数据
            modal: {
                view: 0, //详情对话框控制变量
                save: 0 //保存对话框控制变量
            },
            act: {}, //保存的动作列表

            /*  以下是全局变量定义 */
            availablePageSize: App.AVAILABLE_PAGE_SIZE
        };

        r.search = App.http.getQuery();

        if (App.moduel == false) {
            App.moduel = r.search.r.split('/')[0];
        }
        r.search.page = r.search.page || 1;
        r.search.pageSize = r.search.pageSize || App.PAGE_SIZE;
        return r;
    };

    var el = function () {
        return "#app";
    };

    var methods = {

        /* 得到数据列表 */
        getList: function () {
            var s = this;
            s.$set('list', []);
            s.$set('totalPage', 0); //清空
            App.http.get(s.act.index, s.search, function (r) {
                s.$set('list', r.data.list);
                s.$set('total', r.data.total);
                s.$set('totalPage', Math.ceil(r.data.total / s.search.pageSize));
            })
        },

        /* 删除数据 */
        del: function (pk) {
            var s = this;
            App.ui.confirm("确定要删除当前数据吗？", function () {
                App.http.get(s.act.del, {pk: pk}, function (r) {
                    if (r.flag == App.SUCCESS) {
                        App.ui.alert("删除成功！", function () {
                            s.getList()
                        }, this);
                    } else {
                        App.ui.alert("删除失败：" + JSON.stringify(r))
                    }
                })
            }, this);
        },

        /* 保存对话框 */
        saveModal: function (pk) {
            var s = this;
            App.global.removeValidatorError();
            s.$set('item', {}); //清空上一次的数据
            App.http.get(s.act.find, {pk: pk}, function (r) {
                s.$set('modal.save', 1);
                s.$set("item", r.data.item || {});
            })
        },
        /**
         * 复制数据
         * @param {string} pkName 主键名称
         * @param {string} pk 主键的值
         */
        copyModal: function (pkName, pk) {
            var s = this;
            App.global.removeValidatorError();
            App.http.get(s.act.find, {pk: pk}, function (r) {
                s.$set('modal.save', 1);
                r.data.item[pkName] = '';
                s.item = r.data.item;
            })
        },

        /* 保存动作 */
        save: function (formId, act) {
            var s = this;
            if (act == undefined) {
                act = s.act.save;
            }
            if (App.global.getValidator(formId).form() == false) {
                return null;
            }
            var method = App.http.get;
            if ($(formId).attr('method') == 'post') {
                method = App.http.post;
            }
            method(act, formId, function (r) {
                if (r.flag != App.SUCCESS) {
                    App.ui.alert("提交失败：" + JSON.stringify(r));
                    return null;
                }
                s.$set('modal.save', 0);
                App.ui.alert("提交成功！", function () {
                    s.getList()
                }, this);
            })
        },

        /* 查看一行数据的信息 */
        view: function (pk) {
            var s = this;
            App.http.get(s.act.find, {pk: pk}, function (r) {
                s.$set('modal.view', 1);
                s.$set("item", r.data.item);
            })
        },

        /* 数据校验的方法 */
        valid: function (formId) {
            return $(formId).valid();
        },
        /**
         * 显示时间日期选择器
         * @param event
         */
        showDate: function (event) {
            $(event.target).datetimepicker({
                language: 'zh-CN',
                autoclose: true,
                todayBtn: true,
                pickerPosition: "bottom-left",
                minView: "month",
                format: 'yyyy-mm-dd'
            }).datetimepicker('show');
        },

        /**
         * 显示时间日期选择器
         * @param event
         */
        showDateHour: function (event) {
            $(event.target).datetimepicker({
                language: 'zh-CN',
                autoclose: true,
                todayBtn: true,
                pickerPosition: "bottom-left",
                minView: "day",
                format: 'yyyy-mm-dd hh:00:00'
            }).datetimepicker('show');
        },
        /**
         * 显示时间
         * @param event
         */
        showTimeClock: function (event) {
            $(event.target).clockpicker({
                autoclose: true
            }).clockpicker('show');
        },

        showDateRange: function (event, callback) {
            var s = this;
            var picker = $(event.target).data('daterangepicker');
            if (picker == undefined) {
                $(event.target).daterangepicker(mdc.dateOperating.dpinit($(event.target)));
                $(event.target).data('daterangepicker').show();
                if (callback != undefined) {
                    $(event.target).on('apply.daterangepicker', function () {
                        callback.apply(s)
                    });
                }
            }
        },

        /**
         * 复制一个节点
         * @param {object} data 一个数组
         * @param {int} index 要插入的位置
         * @param {*} node 节点值
         * @returns {null}
         */
        copy: function (data, index, node) {
            if (index == -1) {
                index = data.length;
            }
            data.splice(index + 1, 0, node);
        },

        /**
         * 删除节点
         * @param data
         * @param index
         */
        remove: function (data, index) {
            if (index == -1) {
                index = data.length;
            }
            if (data.length > 1) {
                data.splice(index, 1);
            }
        }
    };
    var App = Vue.extend({
        data: data,
        el: el,
        methods: methods
    });

    App.global = {
        /* vue 全局配置选项*/
        vueOptions: function () {
            /* 添加对话框指令 */
            Vue.directive('modal', function (value) {
                if ($(this.el).is(":hidden") != value) {
                    return null;
                }
                if (value == 1) {
                    $(this.el).modal("show");
                } else {
                    $(this.el).modal("hide");
                }
            });

            /* 分页指令 */
            Vue.directive("page", function (value) {
                var s = this;
                $(this.el).html(''); //先清空
                if (parseInt(value) <= 0) {
                    return null;
                }
                var params = $.extend({}, s.vm.search);
                delete params.page;
                $(this.el).Paginator({
                    totalCounts: parseInt(s.vm.total),
                    pageSize: parseInt(s.vm.search.pageSize),
                    currentPage: parseInt(s.vm.search.page),
                    baseUrl: "?" + App.http.buildQuery(params)
                });
            });

            /* 时间戳变成标准格式过滤器 */
            Vue.filter('timetostr', function (value) {
                return v2.helper.timetostr(value);
            });

            //vue默认全局参数
            Vue.config.silent = true;
            Vue.config.debug = false;

            /* 计算数组元素指令 */
            Vue.filter('count', function (o, x) {
                if (x == undefined) {
                    x = 1;
                }
                var t = typeof o;
                if (t == 'string') {
                    return x * o.length;
                } else if (t == 'object') {
                    var n = 0;
                    for (var i in o) {
                        n++;
                    }
                    return x * n;
                }
                return false;
            });

            /* 计算百分比 */
            Vue.filter('percent', function (now, total, fixed) {
                if (fixed == undefined) {
                    fixed = 2;
                }
                if (isNaN(total) || isNaN(now)) {
                    return '';
                }
                var rate = (now / total) * 100;
                rate = rate.toFixed(fixed);
                return rate + '%';
            });
            Vue.filter('formatMoney', function (num) {
                return App.f.formatMoney(num);
            });

            return this;
        },

        /* 设置ajax全局属性 */
        ajaxOptions: function () {
            $.ajaxSetup({
                error: function (xhr) {
                    $.unblockUI();
                    App.ui.msg("服务器错误：" + xhr.responseText)
                }
            });
            return this;
        },

        /* 数据校对相关插件 */
        validOptions: function () {
            $.extend(jQuery.validator.defaults, {ignore: ""}); //设置不忽略hidden表单
            jQuery.extend(jQuery.validator.messages, {
                required: "必填字段",
                remote: "请修正该字段",
                email: "请输入正确格式的电子邮件",
                url: "请输入合法的网址",
                date: "请输入合法的日期",
                dateISO: "请输入合法的日期 (ISO).",
                number: "请输入合法的数字",
                digits: "只能输入整数",
                creditcard: "请输入合法的信用卡号",
                equalTo: "请再次输入相同的值",
                accept: "请输入拥有合法后缀名的字符串",
                maxlength: jQuery.validator.format("请输入一个 长度最多是 {0} 的字符串"),
                minlength: jQuery.validator.format("请输入一个 长度最少是 {0} 的字符串"),
                rangelength: jQuery.validator.format("请输入 一个长度介于 {0} 和 {1} 之间的字符串"),
                range: jQuery.validator.format("请输入一个介于 {0} 和 {1} 之间的值"),
                max: jQuery.validator.format("请输入一个最大为{0} 的值"),
                min: jQuery.validator.format("请输入一个最小为{0} 的值")
            });

            return this;
        },

        /**
         * 设置debug vue.js的debug模式
         * @param debug
         * @returns {App.global}
         */
        setDebug: function (debug) {
            Vue.config.debug = debug;
            return this;
        },

        /**
         * 得到真实的act。添加上模块名称。
         * @param act
         * @returns {*}
         */
        getRealAct: function (act) {
            var sp = '/';
            if (act.indexOf(App.SP_GAME) >= 0) {
                sp = '.';
            }
            if (act.split(sp).length < 3 && App.moduel) {
                act = App.moduel + sp + act;
            }
            return act;
        },

        /**
         * 得到校验器对象
         * @param formId
         * @returns {*}
         */
        getValidator: function (formId) {
            if (App.validators[formId] == undefined) {
                App.validators[formId] = $(formId).validate();
            }
            App.validators[formId].resetForm();
            $('.has-error').removeClass('.has-error');
            return App.validators[formId];
        },

        /**
         * 移出所有校验错误消息
         */
        removeValidatorError: function () {
            $(".has-error").removeClass('has-error');
            for (var i in App.validators) {
                App.validators[i].resetForm();
            }
        }
    };

    /* 定义一些常量 */
    App.SUCCESS = 1; //请求成功的标识
    App.API_JSON = 'json'; //使用本地json请求
    App.API_JSONP = 'jsonp';
    App.SP_LOCAL = '/';
    App.SP_GAME = '.';
    App.PAGE_SIZE = 10; //每页大小
    App.AVAILABLE_PAGE_SIZE = [10, 20, 50, 100]; //可选的每页数量

    /* 定义的全局变量 */
    App.moduel = ''; //当前请求的模块名称
    App.validators = []; //所有校验器对象

    /* 其它功能类封装 */
    App.http = {
        /**
         * 将一个form数据转化一个object
         * @param selector
         * @returns {{}}
         */
        formData: function (selector) {
            var data = $(selector).serializeArray();
            var r = {};
            $.each(data, function (index, item) {
                if (item.name in r) {
                    if (!(r[item.name] instanceof Array)) {
                        r[item.name] = new Array(r[item.name]);
                    }
                    r[item.name].push(item.value)
                } else {
                    r[item.name] = item.value;
                }
            });
            return r;
        },

        /**
         * 请求数据
         * @param act
         * @param args
         * @param callback
         */
        get: function (act, args, callback) {
            if ((typeof args) == 'string') {
                args = App.http.formData(args);
            }
            act = App.global.getRealAct(act);
            if (act.indexOf(App.SP_GAME) >= 0) { //以 “.”区分表示远程api
                /**
                 * 如果请求的模板和当前模块一致，直接请求。
                 * 如果不一致，使用本地php代理发起请求
                 */
                if (act.split(App.SP_GAME)[0] == App.moduel) {
                    act = act.split(".").slice(1).join(App.SP_GAME);
                    var data = {'act': act, 'sessid': $SESS_ID};
                    for (var i in args) {
                        data[i] = args[i];
                    }
                    $.get($API_URL, data, callback, 'jsonp');
                } else {
                    App.http.proxyGet(act, args, callback);
                }

            } else if (act.indexOf(App.SP_LOCAL) >= 0) {
                $.get("?r=" + act, args, callback, 'json');
            }
        },

        /**
         * post提交，支持文件上传。
         * 注意jsonp只支持get。post只能提交到本域名
         * @param act
         * @param {*} args 如果是一个对象，则是参数，否则认为是一个表单选择器
         * @param callback
         */
        post: function (act, args, callback) {
            if ((typeof args) == 'string') {
                args = new FormData($(args)[0]);
            }

            var param = {};
            act = App.global.getRealAct(act);
            param.url = '?r=' + act;
            param.data = args;
            param.type = 'post';
            param.success = callback;
            param.processData = false;
            param.contentType = false;
            param.dataType = 'json';
            $.ajax(param)
        },

        /**
         * 这里使用php代理的方式使用实现同步请求。
         * 用于解决jsonp不能同步请求的问题。
         * @param {string} act 请求的动作
         * @param {object} args 请求时的参数
         * @param {function} callback 请求成功的回调函数
         * @param {bool} async 是否异步。
         */
        proxyGet: function (act, args, callback, async) {
            args = $.extend({}, args);
            delete args.r;
            args.act = App.global.getRealAct(act);
            if (async == undefined) {
                async = true;
            }
            var url = '';
            if (act.indexOf(App.SP_GAME) >= 0) {
                url = '?r=Navi/proxy';
            } else {
                url = '?r=' + act;
            }
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                async: async,
                data: args,
                success: callback
            })
        },

        /**
         * 使用ajax提交文件
         * @param {string} formSelecter 表单选择器
         * @param {object} param 对象
         */
        ajax: function (formSelecter, param) {
            var formData = new FormData($(formSelecter)[0]);
            if (param.data != undefined) {
                for (var i in param.data) {
                    formData.append(i, param.data[i]);
                }
            }
            param.data = formData;
            param.type = 'post';
            param.processData = false;
            param.contentType = false;
            $.ajax(param)
        },

        /**
         * 得到查询参数
         * @returns {{}}
         */
        getQuery: function () {
            var name, value;
            var str = location.href; //取得整个地址栏
            var num = str.indexOf("?");
            str = str.substr(num + 1); //取得所有参数   stringvar.substr(start [, length ]
            str = decodeURIComponent(str);
            var arr = str.split("&"); //各个参数放到数组里
            var r = {};
            for (var i = 0; i < arr.length; i++) {
                num = arr[i].indexOf("=");
                if (num > 0) {
                    name = arr[i].substring(0, num);
                    value = arr[i].substr(num + 1);
                    r[name] = value;
                } else {
                    r[name] = false;
                }
            }
            return r;
        },

        /**
         * 创建一个查询参数
         * @param query
         * @returns {string}
         */
        buildQuery: function (query) {
            var arr = [];
            for (var key in query) {
                arr.push(key + "=" + query[key]);
            }
            var str = arr.join("&");
            str = decodeURIComponent(str); //解决浏览器兼容问题
            return str;
        }
    };

    App.ui = {
        /**
         * 警告框。
         * @param {string} msg 错误消息
         * @param {function} callback 执行的回调函数
         * @param {object} context 执行的上下文环境。数据通过此对象传
         */
        alert: function (msg, callback, context) {
            if (typeof(msg) == 'object') {
                return bootbox.alert(msg);
            }
            return bootbox.alert({
                message: msg == undefined ? '操作成功' : msg,
                callback: function () {
                    if (callback == undefined) {
                        return true;
                    } else {
                        if (context == undefined) {
                            callback();
                        } else {
                            callback.apply(context);
                        }
                    }
                }
            })
        },

        /**
         * 确认对话框
         * @param {string|object} msg 消息或者object选项
         * @param {function} trueCallback 选择确认的回调函数
         * @param {object} trueContext 回调函数下上文
         * @param falseCallback
         * @param falseContext
         * @returns {*}
         */
        confirm: function (msg, trueCallback, trueContext, falseCallback, falseContext) {
            if (typeof(msg) == 'object') {
                return bootbox.confirm(msg);
            }
            return bootbox.confirm({
                message: msg == undefined ? '你真的要这样做么？' : msg,
                callback: function (r) {
                    if (r == true) {
                        if (trueCallback == undefined) {
                            return true;
                        } else {
                            if (trueContext == undefined) {
                                trueCallback();
                            } else {
                                trueCallback.apply(trueContext);
                            }
                        }
                    } else {
                        if (falseCallback == undefined) {
                            return true;
                        } else {
                            if (falseContext == undefined) {
                                trueCallback();
                            } else {
                                falseCallback.apply(falseContext);
                            }
                        }
                    }
                }
            });
        },

        /**
         * 全屏幕加载ui
         * @param msg
         */
        block: function (msg) {
            $.blockUI({
                message: msg == undefined ? '<h1>系统处理中，请稍后！</h1>' : msg,
                css: {}
            });
        },
        /**
         * 关闭全屏幕加载ui
         */
        unblock: function () {
            $.unblockUI();
        },

        /**
         * 信息框，会自动消失
         * @param msg
         */
        msg: function (msg) {
            layer.msg(msg);
        },

        /**
         * vue.js dom是异步更新了。在设置的变量后，请用如下方式调用
         *
         * vue.js 和 dataTable 集成方法
         * 1. 调用 App.ui.removeDataTable("#app")，清空dataTable
         * 2. 获取数据
         * 3. s.$nextTick(function() {
         *      App.ui.dataTable('#app', false);
         * })
         * @param selector
         * @param options
         */
        dataTable: function (selector, options) {
            if ((typeof options) == 'boolean') {
                //如果是一个布尔类型，表示是否设置分页
                var tmp = {};
                tmp['bPaginate'] = options;
                options = tmp;
            } else if (options == undefined) {
                options = {
                    bPaginate: true
                };
            }
            var def = {
                "sDom": '<"table-header"Tlf><"table-body"t><"table-footer clearfix"ip>',
                "bPaginate": options.bPaginate,
                'aaSorting': [], //关闭初始化排序
                "oLanguage": {
                    "sProcessing": "正在加载中......",
                    "sLengthMenu": options.bPaginate ? "每页显示 _MENU_ 条记录" : '',
                    "sZeroRecords": "对不起，查询不到相关数据！",
                    "sEmptyTable": "表中无数据存在！",
                    "sInfo": options.bPaginate ? "当前显示 _START_ 到 _END_ 条，共 _TOTAL_ 条记录" : '',
                    "sInfoFiltered": "数据表中共为 _MAX_ 条记录",
                    "oPaginate": {
                        "sFirst": "首页",
                        "sPrevious": "上一页",
                        "sNext": "下一页",
                        "sLast": "末页"
                    }
                },
                "tableTools": {
                    "sSwfPath": "swf/copy_csv_xls_pdf.swf",
                    "aButtons": [
                        {"sExtends": "copy", "sButtonText": "复制",},
                        {"sExtends": "xls", "sButtonText": "导出Excel"},
                    ]
                }
            };

            $(selector +  " table").dataTable($.extend({}, def, options));
            $(selector +  " .dataTables_filter input").attr('placeholder', '搜索');
            $(selector +  " .dataTables_length").css('display', 'inline');
            $(selector +  " .dataTables_filter").css('display', 'inline');
            $(selector +  " .dataTables_info").css('float', 'left');
            $(selector +  " .dataTables_paginate").css('float', 'right');
        },

        /**
         * 删除dataTable
         * @param selector
         */
        removeDataTable: function(selector) {
            selector = selector + " table";
            if ($.fn.dataTable.isDataTable(selector)) {
                $(selector).DataTable().clear().destroy();
            }
        }
    };
    /**
     * 封装常用的函数
     * @type {{}}
     */
    App.f = {
        /**
         * 校验函数接受3个参数， value：当前表单值，element：当前表单元素，param：参数列表
         * 添加一个校验函数
         * @param {{string}} name 校验名称
         * @param {{function}} fun 函数，。
         * @param {{string}} msg 错误消息
         */
        addCheck: function (name, fun, msg) {
            jQuery.validator.addMethod(name, fun, msg);
        },

        /**
         * 数组格式化 100,100的形式
         * @param number
         * @param places
         * @param symbol
         * @param thousand
         * @param decimal
         * @returns {string}
         */
        formatMoney: function(number, places, symbol, thousand, decimal) {
            var tmp = (number + '').split('.');
            number = parseInt(tmp[0]) || 0;
            var dec = parseInt(tmp[1]) || 0;
            places = !isNaN(places = Math.abs(places)) ? places : 0;
            symbol = symbol !== undefined ? symbol : "";
            thousand = thousand || ",";
            decimal = decimal || ".";
            var negative = number < 0 ? "-" : "",
                i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "",
                j = (j = i.length) > 3 ? j % 3 : 0;
            var ret = symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
            if (dec == 0) {
                return ret;
            } else {
                return ret + '.' + dec;
            }
        },
        timetostr: function (unixtime) {
            if (parseInt(unixtime) <= 0 || unixtime == undefined) {
                return '';
            }
            var date = new Date(unixtime * 1000); //获取一个时间对象
            var year = date.getFullYear();//获取完整的年份(4位,1970)
            var month = date.getMonth() + 1;//获取月份(0-11,0代表1月,用的时候记得加上1)
            var day = date.getDate();//获取日(1-31)
            var hour = date.getHours();//获取小时数(0-23)
            var min = date.getMinutes();//获取分钟数(0-59)
            var second = date.getSeconds();//获取秒数(0-59)

            if (month < 10) {
                month = "0" + month;
            }
            if (day < 10) {
                day = "0" + day;
            }
            if (hour < 10) {
                hour = "0" + hour;
            }
            if (min < 10) {
                min = "0" + min;
            }
            if (second < 10) {
                second = "0" + second;
            }

            return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + second;
        }
    };
    App.global.validOptions().vueOptions().ajaxOptions();
    window.App = App;
})();
