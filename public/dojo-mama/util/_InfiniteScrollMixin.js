define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-geometry',
		'dojo/on',
		'./_ScrollableMixin'
], function(declare, lang, domGeom, on, Scrollable) {
	return declare([Scrollable], {
		// summary:
		//     Adds infinite scrolling to a widget, requesting new data when the widget
		//     is scrolled to the end of its content.  Classes using this mixin should
		//     override handlePageData and requestForPage.

		// _isData: Array
		//     Array containing data returned by page requests, indexed by page number.
		//     A value in the array is false if a request has been made for that page but
		//     data has not yet been returned and true if data for that page has already
		//     been handled.
		_isData: null,

		// _isPageRequests: Array
		//     Promises for page requests.
		_isPageRequests: null,

		_isOnScrollHandle: null,

		constructor: function() {
			this.resetInfiniteScroll();
		},

		destroy: function() {
			if (this._isOnScrollHandle) {
				this._isOnScrollHandle.remove();
			}
			this.inherited(arguments);
		},

		handlePageData: function(/*Object*/data, /*Integer*/pageNumber) {
			/*jslint unparam: true*/
			// summary:
			//     Display data received from a page request. Subclasses should override this.
			console.warn('Classes using InfiniteScrollMixin must override handlePageData');
		},

		handleError: function(err) {
			// summary:
			//     Handle error in the event a page fails to load.
			console.error(err);
		},

		handleScroll: function() {
			// summary:
			//     When the widget is scrolled, check to see if it's been scrolled to the end
			//     of it's content. If so, load the next page of data.

			var scrollPos = this.domNode.scrollTop;

			var containerHeight = domGeom.getContentBox(this.domNode).h;

			// Find total height of all immediate child nodes.
			var containedHeight = 0;
			var i;
			for (i = 0; i < this.domNode.childNodes.length; i++) {
				containedHeight += domGeom.getMarginBox(this.domNode.childNodes[i]).h;
			}

			if (scrollPos >= (containedHeight - containerHeight)) {
				// At the end of content.
				// Load the next page, if it's not already in the process of loading.
				if (this._isData[this._isData.length - 1] !== false) {
					this.loadPage(this._isData.length);
				}
			}
		},

		loadPage: function(/*Integer*/pageNumber) {
			// summary:
			//     Load data for the given page.

			// Do not attempt to load a page more than once
			if (this._isData[pageNumber] !== undefined) {
				return;
			}

			// Fill _isData array with null values up to the current page number.
			if (this._isData.length <= pageNumber) {
				var i;
				for (i = 0; i <= (pageNumber - this._isData.length); i++) {
					this._isData.push(false);
				}
			}

			console.log('Requesting page ' + pageNumber);

			var request = this.requestForPage(pageNumber)
			.then(lang.hitch(this, function(response) {

				console.log('Received data for page ' + pageNumber);

				this._isData[pageNumber] = response.data;

				// Handle data in order of page up to the last page
				// whose data has been received.
				var j;
				var lastPageIndex = this._isData.indexOf(false);
				if (lastPageIndex === -1) {
					lastPageIndex = this._isData.length;
				}
				console.log('handling data up to page ' + lastPageIndex);
				for (j = 0; j < lastPageIndex; j++) {

					// Do not handle a page's data twice
					if (this._isData[j] !== true) {

						this.handlePageData(this._isData[j], j);

						// Mark page j as already handled
						this._isData[j] = true;
					}
				}
			}),
			lang.hitch(this, function(err) {
				// Don't call the error handler if this request was cancelled.
				if (err.dojoType !== 'cancel') {
					this.handleError(err);
				}
			}));

			this._isPageRequests.push(request);
		},

		postCreate: function() {
			this.inherited(arguments);

			this._isOnScrollHandle = on(this.domNode, 'scroll', lang.hitch(this, this.handleScroll));
		},

		requestForPage: function(/*Integer*/pageNumber) {
			/*jslint unparam: true*/
			// summary:
			//     The XHR request for data for the given page number. This should return an
			//     XHR response promise.
			// ex:
			//     return xhr.get('/api/url').response
			console.warn('Classes using InfiniteScrollMixin must override requestForPage');
		},

		resetInfiniteScroll: function() {
			// summary:
			//     Reset data and page requests.  Call this before starting to load data
			//     from another source.

			// Cancel all requests
			if (this._isPageRequests) {
				var i = 0;
				for (i = 0; i < this._isPageRequests.length; i++) {
					this._isPageRequests[i].cancel();
				}
			}
			this._isPageRequests = [];

			// Clear stored data
			this._isData = [];
		}

	});
});
