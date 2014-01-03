define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-construct',
		'dojo/request/xhr',
		'dijit/_WidgetBase',
], function(declare, lang, domConstruct, xhr, WidgetBase) {
	return declare([WidgetBase], {

		'class': 'vis',

		// dataPromise: Object
		//     Promise for data being loaded from API. Used to cancel request if loadData is
		//     called again before the previous load was finished.
		dataPromise: null,

		// datasetId: Integer
		//     ID of dataset to run inquiry against.
		datasetId: null,

		// inquiry: Object
		//     Inquiry to run/display.
		inquiry: null,

		// data: Object
		//     Data received from API for current dataset/inquiry.
		data: null,

		// redrawOnResize: Boolean
		//     Whether or not to clear and redraw the visualization when this widget is resized.
		redrawOnResize: true,

		draw: function(data) {
			// summary:
			//     Subclasses should override this method to draw the visualization.
		},

		handleData: function(response) {
			this.dataPromise = null;
			this.set('data', response.data);
		},

		handleError: function(err) {
			this.dataPromise = null;
			if (err.dojoType !== 'cancel') {
				console.error(err);
			}
		},

		redraw: function() {
			domConstruct.empty(this.domNode);
			this.draw(this.data);
		},

		reload: function() {
			if (!this.datasetId) {
				console.error('Cannot load data without a dataset ID');
				return;
			}

			console.log('Vis load data for set ' + this.datasetId);

			if (this.dataPromise !== null) {
				this.dataPromise.cancel();
			}

			this.set('data', null);
			// TODO:
			//     this.dataPromise = xhr.post('/api/v0/inquiries', {
			this.dataPromise = xhr.post('/api/v0/datasets/' + this.datasetId + '/search', {
				data: JSON.stringify(this.inquiry),
				handleAs: 'json',
				headers: {
					'Content-Type': 'application/json'
				}
			}).response
			.then(lang.hitch(this, this.handleData), lang.hitch(this, this.handleError));
		},

		resize: function() {
			this.inherited(arguments);
			if (this.redrawOnResize && this.data) {
				this.redraw();
			}
		},

		_setDataAttr: function(/*Object*/data) {
			// summary:
			//     Redraw visualization with new data.
			this._set('data', data);
			if (data) {
				this.redraw();
			}
		}
	});
});
