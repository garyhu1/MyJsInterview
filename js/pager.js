class Pager {
	constructor(options) {
		var defaultOptions = {
			currentPage: 1,
			element: null,
			buttonCount: 10,
			totalPage: 1,
			queryPage: "",
			template: {
				number: "<button>%page%</button>",
				next: "<button class="
				next ">下一页</button>",
				prev: "<button class="
				prev ">上一页</button>",
				first: "<button class="
				first ">首页</button>",
				last: "<button class="
				last ">末页</button>"
			}
		}
		this.options = Object.assign({}, defaultOptions, options);
		this.pageNum = {};
		this.currentPage = parseInt(this.options.currentPage, 10) || 1;
	}
	//所有方法的入口
	active() {
		this.checkOptions().initHtml().bindEvent();
	}
	//检查参数状态
	checkOptions() {
		if(!this.options.element) {
			throw new Error('element is required')
		}
		return this;
	}
	//绑定事件 
	bindEvent() {
		dom.on(this.options.element,'click','.page-num>li',(e,el) => {
			//暂时不理解
			this.goToPage(parseInt(el.dataset.page, 10))
		});
	}
	//设置被选中的页数
	goToPage(page) {
		if(!page||page === this.options.totalPage||page === this.currentPage){
			return ;
		}
		
		this.currentPage = page;
		//添加一个自定义的事件，给外部做监听使用
		this.options.element.dispatchEvent(new CustomEvent('pageChange', { detail: { page } }));
		this.resetPage();
	}
	//重新设置页数
	resetPage() {
		this.checkButtons();
		var newerPage = this.createNumbers();
		var olderPage = this.pageNum.num;
		olderPage.parentNode.replaceChild(newerPage,olderPage);
		this.pageNum.num = newerPage;
	}
	//初始化页面
	initHtml() {
		this.pageNum.first = dom.create(this.options.template.first);
		this.pageNum.prev = dom.create(this.options.template.prev);
		this.pageNum.next = dom.create(this.options.template.next);
		this.pageNum.last = dom.create(this.options.template.last);
		this.pageNum.num = this.createNumbers();
		this.checkButtons();
		this.options.element.appendChild(this.pageNum.first);
		this.options.element.appendChild(this.pageNum.prev);
		this.options.element.appendChild(this.pageNum.num);
		this.options.element.appendChild(this.pageNum.next);
		this.options.element.appendChild(this.pageNum.last);
		return this;
	}
	//根据页数的显示状态来设置按钮的状态
	checkButtons() {
		if(this.currentPage === 1) {
			this.pageNum.first.setAttribute("disabled", "");
			this.pageNum.prev.setAttribute("disabled", "");
		} else {
			this.pageNum.first.removeAttribute("disabled");
			this.pageNum.prev.removeAttribute("disabled");
		}
		if(this.currentPage === this.options.currentPage) {
			this.pageNum.last.setAttribute("disabled", "");
			this.pageNum.next.setAttribute("disabled", "");
		} else {
			this.pageNum.last.removeAttribute("disabled");
			this.pageNum.next.removeAttribute("disabled");
		}
	}
	//重新排列数字
	createNumbers() {
		var currentPage = this.currentPage;
		var buttonCount = this.options.buttonCount;
		var totalPage = this.options.totalPage;
		//接下来判断当前选中页数的位置，始终保持在中间的位置
		var start1 = Math.max(currentPage - Math.round(buttonCount / 2), 1)
		var end1 = Math.min(start1 + buttonCount - 1, totalPage)
		var end2 = Math.min(currentPage + Math.round(buttonCount / 2) - 1, totalPage)
		var start2 = Math.max(end2 - buttonCount + 1, 1)
		var start = Math.min(start1, start2)
		var end = Math.max(end1, end2)
		
		var ul = dom.create('<ul class="page-num"></ul>');
		var numbers = [];
		//添加页数
		for(var i = start;i <= end;i++){
			var li = dom.create(`<li>${this.options.templates.number.replace('%page%', i)}</li>`);
			if(i === currentPage){
				li.classList.add("active");
			}
			ul.appendChild(li);
		}
		return ul;
	}
}

var dom = {
	on: function(element, eventType, selector, fn) {
		element.addEventListener(eventType, e => {
			let el = e.target
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
	create: function(html, children) {
		var template = document.createElement('template')
		template.innerHTML = html.trim()
		let node = template.content.firstChild
		if(children) {
			dom.append(node, children)
		}
		return node
	},

	append: function(parent, children) {
		if(children.length === undefined) {
			children = [children]
		}
		for(let i = 0; i < children.length; i++) {
			parent.appendChild(children[i])
		}
		return parent
	}
}

var bom = {
	queryString: {
		get: function(name) {
			let getAll = searchString => {
				let query = searchString.replace(/^\?/, '')
				let queryObject = {}
				let queryArray = query.split('&').filter(i => i).forEach((string, index) => {
					let parts = string.split('=')
					queryObject[parts[0]] = decodeURIComponent(parts[1])
				})
				return queryObject
			}
			if(arguments.length === 0) {
				return getAll(location.search)
			} else {
				return getAll(location.search)[name]
			}
		},
		set: function(name, value) {
			let set = (search, name, value) => {
				let regex = new RegExp(`(${encodeURIComponent(name)})=([^&]*)`, '')
				if(regex.test(search)) {
					return search.replace(regex, (match, c1, c2) => `${c1}=${encodeURIComponent(value)}`)
				} else {
					return search.replace(/&?$/, `&${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
				}
			}
			if(arguments.length === 1 && typeof name === 'object' && name !== null) {
				let search = location.search
				for(let key in arguments[0]) {
					search = set(search, key, arguments[0][key])
				}
				location.search = search
			} else {
				location.search = set(location.search, name, value)
			}
		},
	},
}