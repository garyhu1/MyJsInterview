(function ($) {
    $(function () {
        $('body').click(function (event) {
            var clickEle = $(event.target);
            var canRemoveClass = clickEle.parents('.departSelect').length === 0;
            var canEmptySearch = clickEle.parents('.deptSearchList').length === 0;
            if (canRemoveClass) {
                $('.dropBtn').css('transform', 'rotate(0)');
                $('.departSelect .select-drop').removeClass('show');
            }
            if (canEmptySearch) {
                $('.departSelect .deptSearchList').empty();
            }
        });
    });
    $.fn.departSelect = function (options) {
        var _options = {
            data: [],
            dataUrl: '',
            searchUrl: '',
            searchPlaceholder: '输入搜索',
            defaults: []  //只接受[{name: '', id: ''}, {name: '', id: ''}]这种格式   
        };
        $.extend(_options, options);
        var that = this;

        //判断是否已存在departSelect，存在即销毁
        function destory() {
            //remove方法会自动移除绑定的事件
            $(that).find('.departSelect').remove();
        }
        var existDepartSelect = $(that).find('.eMulSelect').length > 0;
        if (existDepartSelect) {
            destory();
        }
        //初始化
        function init() {

            //个人无部门树
            if ($("#IsManager").val() == 1) {
                renderMainBox();
                bindEvent();

                if (_options.defaults.length == 0) {
                    renderDeptTree(0);
                } else {
                    renderDeptTree(1, _options.defaults);
                }

            } else {
                var jobNum = $("#JobNumber").val();
                var jobName = $("#JobName").val();
                if (_options.defaults.length == 1) {
                    jobNum = _options.defaults[0].id;
                    jobName = _options.defaults[0].name;
                }
                var jobNameShow = jobName + '(' + jobNum + ')';
                var userHtml = $('<div class="departSelect">\
	            		            <div class="select-result">\
				                        <ul>\
				                            <li data-id="' + jobNum + '" name="' + jobNameShow + '"><span>' + jobNameShow + '</span></li>\
                                        </ul>\
			                        </div>\
                                </div>');
                $(that).append(userHtml);
                $('#SearchScope').val(jobNum);
                $('#SearchScopeName').val(jobName);
                //个人自动查询
                //Search();
            }
        }
        init();

        //绑定事件
        function bindEvent() {
            //切换考核方式
            $("input[name='RelationType']").change(function () {
                //清除已选
                if ($('#selectedDepts li').length > 0) {
                    $('#selectedDepts').empty();
                    for (var i = 0; i <= 6; i++) {
                        var treeObj = $.fn.zTree.getZTreeObj("departTree" + i);
                        if (treeObj) {
                            treeObj.checkAllNodes(false);
                        }
                    }
                    $('.departSelect .select-result>ul').empty();
                    $('.selectAll .checkIcon').removeClass('selected');

                    $('#SearchScope').val("");
                    $('#SearchScopeName').val("");
                }
                //清除现有的部门树
                $('.ztree li').remove();
                //当前选中区域
                var deptType = $('.tabList .active').attr('data-deptType');
                if (deptType == null) {
                    deptType = 0;
                }
                renderDeptTree(deptType);
            });
            //下拉 toggle
            $('.departSelect').on('click', '.select-result', function (event) {
                var departDrop = $(that).find('.select-drop');
                if (departDrop.hasClass('show')) {
                    $('.dropBtn').css('transform', 'rotate(180deg)');
                    departDrop.removeClass('show');
                } else {
                    $('.dropBtn').css('transform', 'rotate(0)');
                    departDrop.addClass('show');
                }
                event.stopPropagation();
            });
            //切换区域
            $('.tabList').on('click', 'li', function (event) {
                $(this).addClass('active').siblings('li').removeClass('active');
                $('.departSelect .treeView>.treeWrap').eq($(this).index()).addClass('show').siblings('.treeWrap').removeClass('show');
                /*$('.selectAll .checkIcon').removeClass('selected');*/
                var deptType = $(this).attr('data-deptType');
                renderDeptTree(deptType);
            });
            //已选移除
            $('.departSelect').on('click', '#selectedDepts .removeSeletedDept', function (event) {
                if (typeof getIndicatorData != 'undefined') {
                    //手动删掉考核对象时判断是否只剩一个考核对象，如果只剩一个，则检测该对象是否有设置指标
                    getIndicatorData();
                }
                $(this).parent('li').remove();
                $('.select-result ul #' + $(this).parent('li').attr('id')).remove();
                var tId = $(this).parent('li').attr('tId');

                for (var i = 0; i <= 6; i++) {
                    var treeObj = $.fn.zTree.getZTreeObj("departTree" + i);
                    if (treeObj) {
                        var nodes = treeObj.getCheckedNodes();
                        for (var j = 0, l = nodes.length; j < l; j++) {
                            if (nodes[j].tId == tId) {
                                treeObj.checkNode(nodes[j], false, false);
                                //关联全选（取消）
                                var treeId = treeObj.setting.treeId;
                                $('#' + treeId).prev('.selectAll').find('.checkIcon').removeClass('selected');
                            }
                        }
                    }
                }

                event.stopPropagation();
            });
            //模糊搜索
            $('.departSelect').on('input', '.select-search input', function () {
                var curDeptType = $('.tabList li.active').attr('data-depttype');
                var searchValue = $(this).val();
                setTimeout(function () {
                    var curSearchValue = $(this).val();
                    if (curSearchValue == searchValue) {
                        getSearchData(curDeptType, searchValue);
                    }
                }.bind(this), 500);
            });
            //搜索框获取焦点，发送异步请求，显示列表
            $('.departSelect').on('focus', '.select-search input', function (event) {
                var obj = $(event.target);
                var curDeptType = $('.tabList li.active').attr('data-depttype');
                var searchValue = obj.val();
                if (searchValue !== "") {
                    getSearchData(curDeptType, searchValue);
                }
            });
            //点击模糊搜索条目定位到树部门
            $('.departSelect').on('click', '.deptSearchList li', function (event) {
                $(this).parents(".select-search").find("input").val($(this).text());
                var curDeptType = $('.departSelect .tabList li.active').attr('data-depttype');
                var deptId = $(this).attr('id');
                var treeObj = $.fn.zTree.getZTreeObj("departTree" + curDeptType);
                var node = treeObj.getNodeByParam("id", deptId, null);
                treeObj.selectNode(node);
                $(this).parents('.deptSearchList').empty();
                event.stopPropagation();
            });
            //重选
            $('.departSelect').on('click', '#btnReselect', function (event) {
                $('#selectedDepts').empty();

                for (var i = 0; i <= 6; i++) {
                    var treeObj = $.fn.zTree.getZTreeObj("departTree" + i);
                    if (treeObj) {
                        treeObj.checkAllNodes(false);
                    }
                }
                $('.departSelect .select-result>ul').empty();

                $('.selectAll .checkIcon').removeClass('selected');
            });
            //全选
            $('.departSelect').on('click', '.selectAll', function (event) {
                var curDeptType = $('.departSelect .tabList li.active').attr('data-depttype');
                var treeObj = $.fn.zTree.getZTreeObj("departTree" + curDeptType);
                if (!$(this).find('.checkIcon').hasClass('selected')) {
                    $(this).find('.checkIcon').addClass('selected');

                    treeObj.checkAllNodes(true);
                    var nodes = treeObj.getCheckedNodes(true);

                    $(nodes).each(function () {
                        var selectedDeptItem = $('<li id="' + $(this).attr('id') + '" name="' + $(this).attr('name') + '" tId="' + $(this).attr('tId') + '">\
                            <p>'+ $(this).attr('name') + '</p><span class="removeSeletedDept"></span>\
                        </li>');
                        if ($('#selectedDepts #' + $(this).attr('id')).length == 0) {
                            $('#selectedDepts').append(selectedDeptItem);
                        }
                    });
                } else {
                    $(this).find('.checkIcon').removeClass('selected');

                    treeObj.checkAllNodes(false);
                    var nodes = treeObj.getCheckedNodes(false);
                    $(nodes).each(function () {
                        $('#selectedDepts #' + $(this).attr('id')).remove();
                    });
                }
            });
            //确定
            $('.departSelect').on('click', '#btnConfirm', function (event) {
                $('.dropBtn').css('transform', 'rotate(180deg)');
                var selectedDeptItems = $('#selectedDepts li');
                var selectedDeptIds = [];
                var selectedDeptNames = [];
                $('.select-result>ul').empty();
                selectedDeptItems.each(function () {

                    var selectedDeptId = $(this).attr('id');
                    var selectedDeptName = $(this).attr('name');

                    selectedDeptIds.push(selectedDeptId);
                    selectedDeptNames.push(selectedDeptName);

                    var selectResultItem = $('<li data-id="' + selectedDeptId + '" name="' + selectedDeptName + '"><span>' + selectedDeptName + '</span><i>x</i></li>');
                    $('.select-result>ul').append(selectResultItem);
                });
                $('.select-drop').removeClass('show');

                $('#SearchScope').val(selectedDeptIds.join());
                $('#SearchScopeName').val(selectedDeptNames.join());

                if (typeof getIndicatorData != 'undefined') {
                    //手动删掉考核对象时判断是否只剩一个考核对象，如果只剩一个，则检测该对象是否有设置指标
                    getIndicatorData();
                }

            });
            //部门搜索结果条目移除
            $('.departSelect').on('click', '.select-result>ul li i', function (event) {
                $(this).parent('li').remove();
                var deptId = $(this).parent('li').attr('data-id');
                $('.selectedDeptView #' + deptId).find('.removeSeletedDept').trigger('click');

                var id = $(this).parent('li').attr('data-id');
                var name = $(this).parent('li').attr('name');

                //隐藏input val移除
                var selectReusltItems = $('.select-result>ul li');
                var selectedDeptIds = [];
                var selectedDeptNames = [];
                selectReusltItems.each(function () {
                    var selectedDeptId = $(this).attr('data-id');
                    var selectedDeptName = $(this).attr('name');

                    selectedDeptIds.push(selectedDeptId);
                    selectedDeptNames.push(selectedDeptName);
                });
                $('#SearchScope').val(selectedDeptIds.join());
                $('#SearchScopeName').val(selectedDeptNames.join());

                event.stopPropagation();
            });
        }
        //渲染部门树
        function renderDeptTree(deptType, defaultsData) {
            $('.selectAll').show();
            var reqUrl = '/Sell/Statistics/RegionTargetExam/GetTargetDepartTree';
            if ($("input[name='RelationType']:checked").val() == 1) {
                reqUrl = '/Sell/Statistics/RegionTargetExam/GetTargetUserDepartTree';//人员树
                //选择人员时全选隐藏
                // $('.selectAll').hide();
            }

            //有默认部门
            if (defaultsData) {
                var setting = {
                    data: {
                        simpleData: {
                            enable: true,
                            idKey: "id",
                        },
                        key: {
                            name: 'name'
                        }
                    },
                    check: {
                        enable: true,
                        chkboxType: { "Y": "", "N": "" }
                    },
                    view: {
                        showLine: false
                    },
                    callback: {
                        beforeAsync: zTreeBeforeAsync,
                        onAsyncSuccess: zTreeOnAsyncSuccess,
                        onClick: zTreeOnClick,
                        onCheck: zTreeOnCheck
                    }
                };
                $('.departSelect .select-tree .tabList').hide();
                $('.departSelect .selectedDeptView').width($('.departSelect .selectedDeptView').width() + 40);
                var zTreeObj = $.fn.zTree.init($("#departTree0"), setting, defaultsData);
                //模拟全选
                $('.departSelect .selectAll').trigger('click');
                $('.departSelect #btnConfirm').trigger('click');
                //无默认部门
            } else {
                var setting = {
                    data: {
                        simpleData: {
                            enable: true,
                            idKey: "id",
                            pIdKey: "pId",
                            rootPId: 0,
                        },
                        key: {
                            name: 'name'
                        }
                    },
                    check: {
                        enable: true,
                        chkboxType: { "Y": "", "N": "" }
                    },
                    view: {
                        showLine: false
                    },
                    callback: {
                        beforeAsync: zTreeBeforeAsync,
                        onAsyncSuccess: zTreeOnAsyncSuccess,
                        onClick: zTreeOnClick,
                        onCheck: zTreeOnCheck
                    },
                    async: {
                        enable: true,
                        url: reqUrl + '?deptType=' + deptType,
                        dataFilter: ajaxDataFilter,
                        type: 'post'
                    }
                };
                if ($("#departTree" + deptType + " li").length == 0) {
                    var zTreeObj = $.fn.zTree.init($("#departTree" + deptType), setting);
                }
            }
        }

        function ajaxDataFilter(treeId, parentNode, responseData) {
            return responseData;
        };
        //渲染默认部门
        function renderDefaultDept(data) {
            $(data).each(function () {
                var defaultResultItem = $('<li data-id="' +
                    $(this).attr('id') +
                    '" name="' +
                    $(this).attr('name') +
                    '"><span>' +
                    $(this).attr('name') +
                    '</span><i>x</i></li>');
                var defaultSelectItem = $('<li id="' + $(this).attr('id') + '" name="' + $(this).attr('name') + '" tid="departTree0_1"><p>' + $(this).attr('name') + '</p><span class="removeSeletedDept"></span></li>')
                $('.select-result ul').append(defaultResultItem);
                $('#selectedDepts').append(defaultSelectItem);
            });
        }
        //ztree异步前
        function zTreeBeforeAsync() {
            showLoading();
        }
        //ztree异步成功后
        function zTreeOnAsyncSuccess() {
            hideLoading();
        }
        //ztree点击节点
        function zTreeOnClick(event, treeId, treeNode) {
        }
        //ztree选中节点
        function zTreeOnCheck(event, treeId, treeNode) {
            var selectedLi = $('<li id="' + treeNode.id + '" name="' + treeNode.name + '" tId="' + treeNode.tId + '">\
                <p>'+ treeNode.name + '</p><span class="removeSeletedDept"></span>\
            </li>');
            if (treeNode.checked && $('#selectedDepts #' + treeNode.id).length == 0) {
                $('#selectedDepts').append(selectedLi);
            } else if (!treeNode.checked && $('#selectedDepts #' + treeNode.id).length != 0) {
                $('#selectedDepts #' + treeNode.id).remove();
            }
            //关联全选
            var treeObj = $.fn.zTree.getZTreeObj(treeId);

            var nodes = treeObj.transformToArray(treeObj.getNodes());
            var isAllChecked = true;

            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].nocheck == false && nodes[i].checked == false) {
                    isAllChecked = false;
                }
            }

            if (isAllChecked) {
                $('#' + treeId).prev('.selectAll').find('.checkIcon').addClass('selected');
            } else {
                $('#' + treeId).prev('.selectAll').find('.checkIcon').removeClass('selected');
            }

        }
        //获取模糊搜索数据
        function getSearchData(deptType, searchValue) {
            //异步
            var reqUrl = '/Sell/Statistics/RegionTargetExam/GetDataByDepartName';
            if ($("input[name='RelationType']:checked").val() == 1) {
                reqUrl = '/Sell/Statistics/RegionTargetExam/GetDepartUserDataByUserName';//人员
            }

            if (_options.defaults.length == 0) {
                var ajaxObj = $.ajax({
                    url: reqUrl,
                    dataType: 'json',
                    data: {
                        deptType: deptType,
                        searchValue: searchValue
                    },
                    type: 'post',
                    timeout: 15000,
                    success: function (data) {
                        if (typeof data != 'object') {
                            data = eval('(' + data + ')');
                        }
                        $('.deptSearchList').empty();
                        for (var i = 0; i < data.length; i++) {
                            var deptSearchItem = $('<li id="' + data[i].dataID + '" name="' + data[i].dataName + '">' + data[i].dataName + '</li>');
                            $('.deptSearchList').append(deptSearchItem);
                        }
                    },
                    complete: function (XMLHttpRequest, status) {
                        if (status == 'timeout') {
                            ajaxObj.abort();
                            layer.msg('请求超时，请稍后再试~', function () {
                                time: 3000
                            });
                        }
                    },
                    error: function (error) {
                        if (error.statusText != 'abort') {
                        }
                    }
                });
            } else {
                $('.deptSearchList').empty();
                var data = _options.defaults;
                for (var i = 0; i < data.length; i++) {
                    if (searchValue != '' && data[i].name.indexOf(searchValue) != -1) {
                        var deptSearchItem = $('<li id="' + data[i].id + '" name="' + data[i].name + '">' + data[i].name + '</li>');
                        $('.deptSearchList').append(deptSearchItem);
                    }
                }
            }
        }
        //渲染html主框架
        function renderMainBox() {
            var mainHtml = $(`<div class="departSelect">
	            		<div class="select-result">
				            <ul>
				            </ul>
				            <i class="dropIcon dropBtn"></i>
			            </div>
			            <div class="select-drop">
				            <div class="select-search">
					            <i></i>
					            <input type="text" placeholder="输入关键字模糊查询">
                                <ul class="deptSearchList"></ul>
				            </div>
				            <div class="select-tree">
					            <ul class="tabList">
						            <li class="active" data-deptType="0">区域中心</li>
						            <li data-deptType="1">区域总部</li>
						            <li data-deptType="2">大区</li>
						            <li data-deptType="3">片区</li>
						            <li data-deptType="4">旅顾</li>
						            <li data-deptType="5">门店</li>
						            <li data-deptType="6">大客户</li>
					            </ul>
					            <div class="treeView">
                                    <div class="treeWrap show">
                                        <span class="selectAll"><b class="checkIcon"></b>全选</span>
                                        <ul id="departTree0" class="ztree"></ul>
                                    </div>
                                    <div class="treeWrap">
                                        <span class="selectAll"><b class="checkIcon"></b>全选</span>
                                        <ul id="departTree1" class="ztree"></ul>
                                    </div>
                                    <div class="treeWrap">
                                        <span class="selectAll"><b class="checkIcon"></b>全选</span>
                                        <ul id="departTree2" class="ztree"></ul>
                                    </div>
                                    <div class="treeWrap">
                                        <span class="selectAll"><b class="checkIcon"></b>全选</span>
                                        <ul id="departTree3" class="ztree"></ul>
                                    </div>
                                    <div class="treeWrap">
                                        <span class="selectAll"><b class="checkIcon"></b>全选</span>
                                        <ul id="departTree4" class="ztree"></ul>
                                    </div>
                                    <div class="treeWrap">
                                        <span class="selectAll"><b class="checkIcon"></b>全选</span>
                                        <ul id="departTree5" class="ztree"></ul>
                                    </div>
                                    <div class="treeWrap">
                                        <span class="selectAll"><b class="checkIcon"></b>全选</span>
                                        <ul id="departTree6" class="ztree"></ul>
                                    </div>
                                    <div class="deptLoading"></div>
					            </div>
                                <div class="selectedDeptView">
                                    <span class="hasSelect">已选</span>
                                    <ul id="selectedDepts"></ul>
                                </div>
				            </div>
                            <div class="select-bottom">
                                <button  type="button" id="btnConfirm">确定</button>
                                <button  type="button" id="btnReselect">重选</button>
                            </div>
			            </div>
		            </div>`);
            $(that).css('border', 'none');
            $(that).append(mainHtml);
        }
        //显示loading
        function showLoading() {
            $('.departSelect .deptLoading').show();
        }
        //隐藏loading
        function hideLoading() {
            $('.departSelect .deptLoading').hide();
        }
    };
})(jQuery);