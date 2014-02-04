define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/Deferred',
		'dojo/request/xhr',
		'../util/Dialog'
], function(declare, lang, Deferred, xhr, Dialog) {
	return declare([], {

		// lastInquiry: Object
		//     The last inquiry to be loaded or saved.
		lastInquiry: null,

		// lastInquiryId: Integer
		//     The ID of the last inquiry to be loaded or saved.
		lastInquiryId: null,

		clearLast: function() {
			// summary:
			//     Forget the last loaded/saved inquiry.
			this.lastInquiry = null;
			this.lastInquiryId = null;
		},

		load: function() {
			// summary:
			//     Prompt the user to choose from a list of saved inquiries.
			// returns:
			//     Promise fulfilled with the inquiry the user chooses.

			var d = new Deferred();

			return d.promise;
		},

		_overwriteSavedInquiry: function(inquiryId, inquiry, notes) {
			// summary:
			//     Update a saved inquiry.
			// inquiryId: Integer
			//     The ID of the inquiry to update.
			// inquiry: Object
			//     The updated inquiry.
			// notes: String
			//     The updated notes on the inquiry.

			var d = new Deferred();

			xhr.put('/api/v0/inquiries/' + inquiryId, {
				data: JSON.stringify({
					inquiry: {
						definition: inquiry,
						description: notes
					}
				}),
				handleAs: 'json',
				headers: { 'Content-Type': 'application/json' }
			}).response.then(
				function() { d.resolve(inquiryId); },
				function(err) { d.reject(err); });

			return d.promise;
		},

		save: function(inquiry, datasetId, keep, notes) {
			// summary:
			//     Save an inquiry.
			// inquiry: Object
			//     The inquiry to save.
			// datasetId: Integer
			//     The ID of the dataset the inquiry is associated with.
			// keep: Boolean
			//     Whether or not to keep the inquiry permanently.

			var d = new Deferred();

			if (this.lastInquiry !== null && keep) {
				// Prompt to save or overwrite
				var dlg = new Dialog();
				dlg.containerNode.innerHTML = 'Overwrite last inquiry or create new one?';
				dlg.addButton('overwrite', 'Overwrite');
				dlg.addButton('new', 'Create New');
				dlg.addButton('cancel', 'Cancel');
				dlg.show().then(lang.hitch(this, function(buttonId) {
					if (buttonId == 'overwrite') {
						this._overwriteSavedInquiry(this.lastInquiryId, inquiry, notes)
						.then(
							lang.hitch(this, function() {
								this.lastInquiry = inquiry;
								d.resolve(this.lastInquiryId);
							}),
							function(err) { d.reject(err); });
					}
					else if (buttonId == 'new') {
						this._saveNewInquiry(inquiry, datasetId, keep, notes).then(
							lang.hitch(this, function(id) {
								this.lastInquiry = inquiry;
								this.lastInquiryId = id;
								d.resolve(id);
							}),
							function(err) { d.reject(err); });
					}
					else {
						d.cancel();
					}
				}));
			}
			else {
				this._saveNewInquiry(inquiry, datasetId, keep, notes).then(
					lang.hitch(this, function(id) {
						if (keep) {
							this.lastInquiry = inquiry;
							this.lastInquiryId = id;
						}
						d.resolve(id);
					}),
					function(err) { d.reject(err); });
			}

			return d.promise;
		},

		_saveNewInquiry: function(inquiry, datasetId, keep, notes) {
			// summary:
			//     Save a new inquiry.

			var d = new Deferred();

			xhr.post('/api/v0/inquiries', {
					data: JSON.stringify({
						inquiry: {
							dataset_id: datasetId,
							definition: inquiry,
							description: notes,
							saved: keep
						}
					}),
					handleAs: 'json',
					headers: { 'Content-Type': 'application/json' }
				}).response.then(
					function(response) {
						if (response.status == 201) {
							d.resolve(response.data.id);
						}
						else {
							d.reject(response.text);
						}
					},
					function(err) {
						d.reject(err);
					});

			return d.promise;
		}

	});
});
