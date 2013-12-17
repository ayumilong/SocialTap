define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-construct',
		'dojo/request/xhr',
		'dojox/mobile/ProgressIndicator',
		'dojo-mama/util/ScrollablePane'],
function(declare, lang, domConstruct, xhr, ProgressIndicator, ScrollablePane) {
	return declare([ScrollablePane], {

		dataPromise: null,

		dataUrl: null,

		errorMessage: 'Error fetching data',

		noResultsMessage: 'No results found',

		buildRendering: function() {
			this.inherited(arguments);

			if (!this.contentNode) {
				this.contentNode = this.domNode;
			}
		},

		startup: function() {
			this.inherited(arguments);
			this.reloadData();
		},

		_setDataUrlAttr: function(dataUrl) {
			this._set('dataUrl', dataUrl);
			this.reloadData();
		},

		handleData: function(data) {
			console.log(data);
			this.contentNode.innerHTML = data.toString();
		},

		handleError: function(err) {
			domConstruct.empty(this.contentNode);

			domConstruct.create('div', {
				'class': 'dmDataPaneMessage',
				'innerHTML': this.errorMessage
			}, this.contentNode);
		},

		handleNoResults: function() {
			domConstruct.empty(this.contentNode);

			domConstruct.create('div', {
				'class': 'dmDataPaneMessage',
				'innerHTML': this.noResultsMessage
			}, this.contentNode);
		},

		reloadData: function() {

			if (this.dataPromise && !this.dataPromise.isFulfilled()) {
				this.dataPromise.cancel();
			}

			domConstruct.empty(this.contentNode);

			var pi = new ProgressIndicator();
			pi.placeAt(this.contentNode);
			pi.startup();

			this.dataPromise = xhr.get(this.dataUrl, {
				handleAs: 'json'
			}).response.then(
				lang.hitch(this, function(response) {
					pi.stop();

					if (Object.keys(response.data).length === 0) {
						this.handleNoResults();
					}
					else {
						this.handleData(response.data);
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
