class Tabs {
	constructor(options){
		var defaultOptions = {
			element: '',
			tabTiles: '.table-title',
			tabContent: '.table-content',
			activeClassName: 'active'
		}
		this.options = Object.assign({},defaultOptions,options);
	}
	//执行函数的入口
	active() {
		this.checkOPtion().bindEvent();
	}
	//检查options
	checkOptions() {
		if(!this.options.element){
			throw new Error('Not have element');
		}
		return this;
	}
	//绑定事件
	bindEvent() {
		dom.on(this.options.element,'click',`${this.options.tabTiles}>li`,(e,el) => {
			var index = dom.index(el);
			var children = this.options.element.querySelector(this.options.tabContent).children;
			dom.handleClassName(el,this.options.activeClassName);
			dom.handleClassName(children[index],this.options.activeClassName);
		});
	}
}

var dom = {
	//处理点击的元素
	on: function(element,eventType,selector,fn){
		element.addEventListener(eventType,e => {
			var el = e.target;
			while(!el.matches(selector)){
				if(el === element){
					el = null;
					break;
				}
				el = el.parentNode;
			}
			el&&fn.call(el,e,el);
		});
		return element;
	},
	//处理元素的类名
	handleClassName: function(element,className){
		var children = element.parentNode.children;
		for(var i=0;i < children.length;i++){
			children[i].classList.remove(className);
		}
		element.classList.add(className);
		return element;
	},
	//返回点击元素的索引
	index:function(element){
		var children = element.parentNode.children;
		for(var i=0;i < children.length;i++){
			if(children[i] === element){
				return i;
			}
		}
		return -1;
	}
}
