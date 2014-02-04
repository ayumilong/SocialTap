define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/Deferred',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/query',
		'dojo/request/xhr',
		'../util/Dialog'
], function(declare, lang, Deferred, domClass, domConstruct, query, xhr, Dialog) {
	return declare([Dialog], {

		'class': 'inquiryLoadDialog',

		// datasetId: Integer
		//     The ID of the dataset to show inquiries for.
		datasetId: null,

		// inquiries: Object[]
		//     Inquiries available for the specified dataset.
		inquiries: null,

		title: 'Load Inquiry',

		_getSelectedInquiryAttr: function() {
			var id = query('input:checked', this.containerNode)[0].value;
			for (var i = 0; i < this.inquiries.length; i++) {
				if (this.inquiries[i].id == id) {
					return this.inquiries[i];
				}
			}
			return null;
		},

		loadInquiries: function() {
			domConstruct.empty(this.containerNode);

			this.containerNode.innerHTML = 'Loading...';

			xhr.get('/api/v0/inquiries?dataset_id=' + this.datasetId, {
				handleAs: 'json'
			}).response.then(
				lang.hitch(this, function(response) {
					this.inquiries = response.data;
					this.containerNode.innerHTML = '';
					for (var i = 0; i < response.data.length; i++) {
						domConstruct.create('input', {
							id: 'loadInquiry' + response.data[i].id,
							name: 'inquiry',
							type: 'radio',
							value: response.data[i].id
						}, this.containerNode);

						domConstruct.create('label', {
							'for': 'loadInquiry' + response.data[i].id,
							innerHTML: response.data[i].id
						}, this.containerNode);
					}
				}),
				function(err) {
					console.error(err);
				});
		},

		postCreate: function() {
			this.inherited(arguments);

			this.addButton('load', 'Load');
			this.addButton('cancel', 'Cancel');
		},

		show: function() {
			this.inherited(arguments);

			var d = new Deferred();
			this.showPromise.then(
				lang.hitch(this, function(buttonId) {
					if (buttonId == 'load') {
						d.resolve(this.get('selectedInquiry'));
					}
					else {
						d.cancel();
					}
				}),
				function(err) {
					if (err.dojoType == 'cancel') {
						d.cancel();
					}
					else {
						d.reject(err);
					}
				});

			return d.promise;
		},

		startup: function() {
			this.inherited(arguments);
			this.loadInquiries();
		}

	});
});
