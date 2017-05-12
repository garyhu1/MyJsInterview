class FullPage {
	constructor(options){
		var defaultOPts = {
			element: "",
			duration: '1s'
		}
		this.currentIndex = 0;
		this.options = Object.assign({},defaultOPts,options);
		this.animating = false;
	}
	
	//方法的执行入口
	active(){
		this.checkOPtion().initHtml().bindEvent();
	}
	
	//检查options
	checkOPtion() {
		if(!this.options.element){
			throw new Error("No have such element");
		}
		return this;
	}
	
	//初始化html
	initHtml() {
		
		this.options.element.style.overflow = 'hidden';
		//添加动画执行时间
		dom.each(this.options.element.children,section => {
			section.style.transition = `transform ${this.options.duration}`;
		});
		return this;
	}
	
	//移动模块
	moveToSection(targetIndex) {
		return new Promise((resolve,reject) => {
			if(this.animating){
				reject();
			}else if(targetIndex<0){
				reject();
			}else if(targetIndex>=this.options.element.children.length){
				reject();
			}else {
				this.animating = true;
				var that = this;
				//动画执行结束时的监听，改变动画的状态，并且设置currentIndex的值
				this.options.element.addEventListener("transitionend",function callback(){
					this.removeEventListener("tansitionend",callback);
					that.animating = false;
					resolve();
				})
				dom.each(this.options.element.children,section => {
					//注意该动画运动是相对初始的位置
					section.style.transform = `translateY(-${100*targetIndex}%)`;
				});
			}
		});
	}
	
	//绑定事件
	bindEvent() {
		//监听鼠标的滚轮事件
		this.options.element.addEventListener("wheel",e => {
			//e.deltaY大于0表示鼠标向下滚动
			var targetIndex = this.currentIndex + (e.deltaY>0?1:-1);
			this.moveToSection(targetIndex).then(
			() => {
				this.currentIndex = targetIndex;
			},
			() => {});
		});
		//针对移动设备的触屏的监听
		dom.handleWheel(this.options.element,(e,direction) => {
			var targetIndex;
			if(direction === "down"){
				targetIndex = this.currentIndex - 1; 
			}else if(direction === "up"){
				targetIndex = this.currentIndex + 1; 
			}else {
				return ;
			}
			this.moveToSection(targetIndex).then(
			() => {
				this.currentIndex = targetIndex;
			},
			() => {});
		});
		return this;
	}
}

var dom = {
	//遍历节点
	each: function(nodeList,fn){
		for(var i = 0;i < nodeList.length;i++){
			fn.call(null,nodeList[i],i);
		}
		return nodeList;
	},
	
	//处理滑动事件
	handleWheel: function(element,fn) {
		var x1,y1;
		element.addEventListener("touchstart",function(e){
			x1 = e.touches[0].clientX;
			y1 = e.touches[0].clientY;
		});
		
		element.addEventListener("touchmove",function(e){
			if(!x1||!y1){
				return;
			}
			
			var moveX = e.touches[0].clientX-x1;
			var moveY = e.touches[0].clientY-y1;
			
			if(Math.abs(moveX)>Math.abs(MoveY)){
				if(moveX>0){
					fn.call(element,e,"right");
				}else {
					fn.call(element,e,"left");
				}
			}else {
				if(moveY>0){
					fn.call(element,e,"down");
				}else {
					fn.call(element,e,"up");
				}
			}
			
			x1 = undefined;
			y1 = undefined;
		});
		
	}
}