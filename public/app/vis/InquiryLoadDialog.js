define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/Deferred',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/query',
		'dojo/request/xhr',
		'./Inquiry',
		'../util/Dialog'
], function(declare, lang, Deferred, domClass, domConstruct, query, xhr, Inquiry, Dialog) {
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

			Inquiry.loadAll().then(lang.hitch(this, function(inquiries) {
				this.inquiries = inquiries;
				if (inquiries.length === 0) {
					this.containerNode.innerHTML = 'No inquiries available';
				}
				else {
					this.containerNode.innerHTML = '';
					for (var i = 0; i < inquiries.length; i++) {

						if (this.datasetId && inquiries[i].datasetId != this.datasetId) {
							continue;
						}

						var row = domConstruct.create('div', {}, this.containerNode);

						domConstruct.create('input', {
							id: 'loadInquiry' + inquiries[i].id,
							name: 'inquiry',
							type: 'radio',
							value: inquiries[i].id
						}, row);

						domConstruct.create('label', {
							'for': 'loadInquiry' + inquiries[i].id,
							innerHTML: inquiries[i].toString()
						}, row);
					}
				}
			}));
		},

		postCreate: function() {
			this.inherited(arguments);
			this.addButton('load', 'Load');
			this.addButton('cancel', 'Cancel');
		},

		show: function() {
			this.inherited(arguments);

			var d = new Deferred();
			this.showPromise.then(lang.hitch(this, function(buttonId) {
				if (buttonId == 'load') {
					d.resolve(this.get('selectedInquiry'));
				}
				else {
					d.cancel();
				}
			}));

			return d.promise;
		},

		startup: function() {
			this.inherited(arguments);
			this.loadInquiries();
		}

	});
});
