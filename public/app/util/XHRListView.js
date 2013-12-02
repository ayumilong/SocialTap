define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/request/xhr',
		'dojox/mobile/EdgeToEdgeList',
		'dojo-mama/util/BaseListItem',
		'dojo-mama/util/toaster',
		'dojo-mama/views/ModuleScrollableView'
], function(declare, lang, xhr, EdgeToEdgeList, BaseListItem, toaster, ModuleScrollableView) {

	return declare([ModuleScrollableView], {

		dataPromise: null,

		// dataUrl: String
		//     The default URL to retrieve data from.
		dataUrl: null,

		// fetchErrorMessage: String
		//     Message displayed when an error occurs when attempting to load data.
		fetchErrorMessage: 'Unable to load data',

		// noResultsMessage: String
		//     Message displayed when data is loaded successfully, but the data list is empty.
		noResultsMessage: 'No results found',

		list: null,

		buildRendering: function() {
			this.inherited(arguments);

			this.list = new EdgeToEdgeList();
			this.list.placeAt(this.domNode);
			this.list.startup();
		},

		dataUrlFromRoute: function(e) {
			// summary:
			//     Build the data URL from the router event. Views that retrieve data from a URL
			//     that is dependent on route parameters should override this method.
			// e: Object
			//     The router event passed from activate
			return this.dataUrl;
		},

		formatData: function(data) {
			// summary:
			//     Rearrange the data returned from the XHR request.
			//     The array returned by this function will be iterated over and buildListItem
			//     will be called on each element to create the list.
			// data: array
			//     Data returned from the XHR request.
			return data;
		},

		buildListItem: function(obj) {
			console.warn('Using default XHRListView#buildListItem');
			var li = new BaseListItem({
				text: JSON.stringify(obj)
			});
			return li;
		},

		onNoResults: function() {
			// summary:
			//     Callback for when no results are retrieved.
			console.warn('No results found');
			var li = new BaseListItem({
				text: this.noResultsMessage
			});
			this.list.addChild(li);
			li.startup();
		},

		onFetchError: function(err) {
			// summary:
			//     Callback for when an error occurs when fetching data.
			console.error(err);
			toaster.displayMessage({
				text: this.fetchErrorMessage,
				type: 'error',
				time: -1
			});
		},

		activate: function(e) {
			this.inherited(arguments);

			var dataUrl = this.dataUrlFromRoute(e);

			if (this.dataPromise !== null) {
				this.dataPromise.cancel();
			}

			toaster.clearMessages();
			this.list.destroyDescendants();
			this.dataPromise = xhr.get(dataUrl, {
				handleAs: 'json'
			})
				.then(lang.hitch(this, function(data) {

					if (data.length == 0) {
						this.onNoResults();
					}
					else {
						var formattedData = this.formatData(data);
						var i, li;
						for (i = 0; i < formattedData.length; i++) {
							li = this.buildListItem(formattedData[i]);
							this.list.addChild(li);
							li.startup();
						}
					}

					this.dataPromise = null;
				}),
				lang.hitch(this, function(err) {
					this.onFetchError(err);
					this.dataPromise = null;
				}));
		}

	});
});
