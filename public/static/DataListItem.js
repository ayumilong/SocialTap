var DataList = function() {
	this.items = [];
	this.add = function(item) {
		this.items.push(item);
	}
	this.draw = function(domConstruct, loc) {
		var i = 0;
		domConstruct.empty(loc);
		while (i < this.items.length) {
			this.items[i].draw(domConstruct,loc);
			i++;
		}
	}
}

var DataListItem = function(data) {
	this.body = data.body;
	this.name = data.name;
	this.draw = function(domConstruct, loc) {
		var mainDiv = domConstruct.create('div', {
			class: "listItem",
		}, loc);
		var name = domConstruct.create('div', {
			class: "listItem author",
			innerHTML: this.name
		}, mainDiv);
		var name = domConstruct.create('div', {
			class: "listItem body",
			innerHTML: this.body
		}, mainDiv);
	}
}
