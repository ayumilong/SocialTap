define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojox/mobile/Button',
		'dojox/mobile/Pane',
		'dojo-mama/util/BaseListItem',
		'dojo-mama/util/DataListPane'],
function(declare, lang, domClass, domConstruct, Button, Pane, BaseListItem, DataListPane) {
	return declare([Pane], {
		'class': 'stQuerySelector',

		queryNameNode: null,

		queryListPane: null,

		toggleListButton: null,

		selectedQuery: null,

		buildRendering: function() {
			this.inherited(arguments);

			var datasetsLink = domConstruct.create('a', {
				'class': 'datasetsLink fa fa-folder-o',
				'href': '#/datasets',
				'title': 'View Datasets'
			}, this.domNode);

			var querySelector = this;
			this.queryListPane = new DataListPane({
				'class': 'stQueryListPane hidden',
				'dataUrl': '/api/v0/datasets',
				buildListItem: function(dataObj) {
					console.log(this);
					var li = new BaseListItem({
						'text': dataObj.name,
						'onClick': function() {
							querySelector.set('selectedQuery', dataObj);
							querySelector.closeQueryList();
						}
					});
					return li;
				}
			});
			this.queryListPane.placeAt(this.domNode);
			this.queryListPane.startup();

			this.toggleListButton = new Button({
				'class': 'stToggleListButton fa fa-search-plus',
				'duration': 0,
				'title': 'View Available Queries'
			});
			this.toggleListButton.placeAt(this.domNode);
			this.toggleListButton.startup();
			this.toggleListButton.set('onClick', lang.hitch(this, this.openQueryList));

			this.queryNameNode = domConstruct.create('span', {
				'innerHTML': 'Select Query'
			}, this.domNode);
		},

		startup: function() {
			this.inherited(arguments);
		},

		openQueryList: function() {
			domClass.remove(this.queryListPane.domNode, 'hidden');
			domClass.replace(this.toggleListButton.domNode, 'fa-search-minus', 'fa-search-plus');
			this.toggleListButton.set('onClick', lang.hitch(this, this.closeQueryList));
		},

		closeQueryList: function() {
			domClass.add(this.queryListPane.domNode, 'hidden');
			domClass.replace(this.toggleListButton.domNode, 'fa-search-plus', 'fa-search-minus');
			this.toggleListButton.set('onClick', lang.hitch(this, this.openQueryList));
		},

		_setSelectedQueryAttr: function(selectedQuery) {
			this._set('selectedQuery', selectedQuery);

			this.queryNameNode.innerHTML = selectedQuery.name;
		}
	});
});
