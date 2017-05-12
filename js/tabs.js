class Tabs {
	constructor(options) {
		var defaultOptions = {
			element: '',
			tabTitles: '.tabs-title',
			tabContent: '.tabs-content',
			activeClassName: 'active'
		}
		this.options = Object.assign({}, defaultOptions, options);
	}
	//执行函数的入口
	active() {
		this.checkOptions().bindEvent();
	}
	//检查options
	checkOptions() {
		if(!this.options.element) {
			throw new Error('Not have element');
		}
		return this;
	}
	//绑定事件
	bindEvent() {
		handleDom.addEvent(this.options.element, 'click', `${this.options.tabTitles}>li`, (e, el) => {
			var getIndex = handleDom.index(el);
			var children = this.options.element.querySelector(this.options.tabContent).children;
			handleDom.handleClassName(el, this.options.activeClassName);
			handleDom.handleClassName(children[index], this.options.activeClassName);
		});
		return this;
	}
}

var handleDom = {
	//处理点击的元素
	addEvent: function(element, eventType, selector, fn) {
		element.addEventListener(eventType, e => {
			var el = e.target
			while(!el.matches(selector)) {
				if(element === el) {
					el = null
					break
				}
				el = el.parentNode
			}
			el && fn.call(el, e, el)
		})
		return element
	},
	//处理元素的类名
	handleClassName: function(element, className) {
		var children = element.parentNode.children;
		for(var i = 0;i < children.length;i++){
			children[i].classList.remove(className);
		}
		element.classList.add(className);
		return element;
	},
	//返回点击元素的索引
	getIndex: function(element) {
		var children = element.parentNode.children;
		for(var i = 0; i < children.length; i++) {
			if(children[i] === element) {
				return i;
			}
		}
		return -1;
	},
	every: function(nodeList, fn) {
		for(var i = 0; i < nodeList.length; i++) {
			fn.call(null, nodeList[i], i)
		}
		return nodeList
	}
}