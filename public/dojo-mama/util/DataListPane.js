define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/request/xhr',
		'dojox/mobile/EdgeToEdgeList',
		'dojox/mobile/ProgressIndicator',
		'dojo-mama/util/BaseListItem',
		'dojo-mama/util/ScrollablePane'],
function(declare, lang, xhr, EdgeToEdgeList, ProgressIndicator, BaseListItem, ScrollablePane) {
	return declare([ScrollablePane], {

		dataPromise: null,

		dataUrl: null,

		list: null,

		noItemsMessage: 'No data found',

		buildRendering: function() {
			this.inherited(arguments);
			this.list = new EdgeToEdgeList();
			this.list.placeAt(this.domNode);
			this.list.startup();
		},

		startup: function() {
			this.inherited(arguments);
			this.reloadData();
		},

		_setDataUrlAttr: function(dataUrl) {
			this._set('dataUrl', dataUrl);

			this.reloadData();
		},

		buildListItem: function(dataObj) {
			console.warn('Subclasses must override DataList#buildListItem');

			return new BaseListItem();
		},

		handleError: function(err) {

		},

		handleNoItems: function() {
			var li = new BaseListItem({
				text: this.noItemsMessage
			});
			this.list.addChild(li);
			li.startup();
		},

		reloadData: function() {

			if (this.dataPromise && !this.dataPromise.isFulfilled()) {
				this.dataPromise.cancel();
			}

			this.list.destroyDescendants();

			var pi = new ProgressIndicator();
			pi.placeAt(this.domNode);
			pi.startup();

			this.dataPromise = xhr.get(this.dataUrl, {
				handleAs: 'json'
			}).response.then(
				lang.hitch(this, function(response) {
					pi.stop();

					if (response.data.length === 0) {
						this.handleNoItems();
					}
					else {
						var i, li;
						for (i = 0; i < response.data.length; i++) {
							li = this.buildListItem(response.data[i]);
							this.list.addChild(li);
							li.startup();
						}
					}
				}),
				lang.hitch(this, function(err) {
					pi.stop();
					if (err.dojoType !== 'cancel') {
						console.error(err);
						this.handleError(err);
					}
				}));
		}

	});
});
