define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-construct',
		'dojo/request/xhr',
		'dojox/mobile/Pane',
		'dojox/mobile/ProgressIndicator'
], function(declare, lang, domConstruct, xhr, Pane, ProgressIndicator) {
	return declare([Pane], {

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

		_setDataUrlAttr: function(dataUrl) {
			this._set('dataUrl', dataUrl);
			if (dataUrl) {
				this.reloadData();
			}
		},

		beforeLoad: function() {
			domConstruct.empty(this.contentNode);
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

			if (this.dataPromise) {
				this.dataPromise.cancel();
			}

			this.beforeLoad();

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

					this.dataPromise = null;
				}),
				lang.hitch(this, function(err) {
					pi.stop();
					if (err.dojoType !== 'cancel') {
						console.error(err);
						this.handleError(err);
					}
					this.dataPromise = null;
				}));
		}

	});
});
