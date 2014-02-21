define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-class',
		'dojo/Evented',
		'dojo/keys',
		'dojo/on',
		'dojo/query',
		'dojo/request/xhr',
		'dojo/router',
		'dojo/text!./InquiryForm.html',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'./Inquiry',
		'./InquiryLoadDialog',
		'../auth/user',
		'../util/Dialog'
], function(declare, lang, domAttr, domClass, Evented, keys, on, query, xhr, router, template,
	_WidgetBase, _TemplatedMixin, Inquiry, InquiryLoadDialog, user, Dialog)
{
	return declare([_WidgetBase, _TemplatedMixin, Evented], {

		// advancedMode: Boolean
		//     Whether or not to show advanced filter controls.
		advancedMode: false,

		baseClass: 'inquiryForm',

		// datasetId: Integer
		//     ID of the dataset currently being visualized.
		datasetId: null,

		// lastSavedInquiry: Object
		//     The last inquiry saved or loaded.
		lastSavedInquiry: null,

		templateString: template,

		clear: function() {
			// summary:
			//     Clear form and remove filter from visualization.
			this.clearForm();
			this.set('lastSavedInquiry', null);
			this.emit('inquiry', this.get('elasticsearchQuery'));
		},

		clearForm: function() {
			var inputs = [this.textQueryNode, this.dateRangeStartNode, this.dateRangeEndNode,
				this.geoLatNode, this.geoLonNode, this.geoDistanceNode];
			inputs.forEach(function(node) {
				node.value = '';
			});

			inputs = query('input[type="checkbox"]', this.textQueryFieldsNode);
			inputs.forEach(function(check, i) {
				check.checked = (i === 0);
			});

			inputs = query('input[type="checkbox"]', this.dateFilterNode);
			inputs.forEach(function(check) {
				check.checked = false;
			});
		},

		generateReport: function() {
			domAttr.set(this.exportButton, 'disabled', 'disabled');
			xhr.post('/api/v0/reports', {
				data: JSON.stringify({
					report: {
						dataset_id: this.get('datasetId'),
						inquiry_definition: this.get('inquiry').definition
					}
				}),
				handleAs: 'json',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				}
			}).response.then(
				lang.hitch(this, function() {
					domAttr.remove(this.exportButton, 'disabled');
					var dlg = new Dialog({
						title: 'Generating Report'
					});
					dlg.addButton('ok', 'OK');
					dlg.addButton('view', 'View My Reports');
					dlg.show().then(function(buttonId) {
						if (buttonId == 'view') {
							router.go('/reports');
						}
					});
				}),
				lang.hitch(this, function(err) {
					domAttr.remove(this.exportButton, 'disabled');
					if (err.dojoType != 'cancel') {
						console.error(err);
						var dlg = new Dialog({
							title: 'Error'
						});
						dlg.containerNode.innerHTML = 'Unable to generate report';
						dlg.show();
					}
				}));
		},

		loadInquiry: function() {
			var dlg = new InquiryLoadDialog({
				datasetId: this.get('datasetId')
			});
			dlg.show().then(lang.hitch(this, function(inquiry) {
				this.set('lastSavedInquiry', inquiry);
				this.set('inquiry', inquiry);
			}), function(err) {
				if (err.dojoType != 'cancel') {
					console.error(err);
				}
			});
		},

		postCreate: function() {
			this.inherited(arguments);

			on(this.domNode, 'keydown', lang.hitch(this, function(e) {
				if (e.keyCode == keys.ENTER) {
					this.submit();
				}
			}));

			if (user.isLoggedIn()) {
				domClass.remove(this.saveContainer, 'hidden');
			}

			// Only show the save/load buttons when a user is logged in.
			user.on('logout', lang.hitch(this, function() {
				domClass.add(this.saveContainer, 'hidden');
			}));
			user.on('login', lang.hitch(this, function() {
				domClass.remove(this.saveContainer, 'hidden');
			}));
		},

		_saveInquiry: function(inquiry) {
			inquiry.save().then(
				lang.hitch(this, function(inq) {
					this.set('lastSavedInquiry', inq);
				}),
				function(err) {
					console.error(err);
				});
		},

		saveInquiry: function() {
			var inquiry = this.get('inquiry');
			inquiry.keep = true;

			if (this.get('lastSavedInquiry')) {
				var dlg = new Dialog();
				dlg.containerNode.innerHTML = 'Overwrite last inquiry or create new one?<br>' + this.get('lastSavedInquiry').toString();
				dlg.addButton('overwrite', 'Overwrite');
				dlg.addButton('new', 'Create New');
				dlg.addButton('cancel', 'Cancel');
				dlg.show().then(lang.hitch(this, function(buttonId) {
					if (buttonId == 'overwrite') {
						inquiry.id = this.get('lastSavedInquiry').id;
						this._saveInquiry(inquiry);
					}
					else if (buttonId == 'new') {
						this._saveInquiry(inquiry);
					}
				}));
			}
			else {
				this._saveInquiry(inquiry);
			}
		},

		submit: function() {
			// summary:
			//     Set filter on visualization.
			var inquiry = this.get('inquiry');

			if (inquiry) {
				this.emit('inquiry', inquiry.elasticsearchQuery());

				// Keep track of recent inquiries submitted by each user.
				if (user.isLoggedIn()) {
					inquiry.save();
				}
			}
		},

		toggleAdvancedMode: function() {
			// summary:
			//     Show/hide advanced filter controls.
			this.set('advancedMode', !this.get('advancedMode'));
		},

		_setAdvancedModeAttr: function(advancedMode) {
			this._set('advancedMode', advancedMode);

			if (advancedMode) {
				domClass.remove(this.advancedFiltersNode, 'hidden');
				this.advancedModeToggle.innerHTML = 'Basic';
			}
			else {
				domClass.add(this.advancedFiltersNode, 'hidden');
				this.advancedModeToggle.innerHTML = 'Advanced';
			}
		},

		_getInquiryAttr: function() {
			// summary:
			//     Get inquiry object from form contents.

			var inquiry = new Inquiry();

			// Text
			inquiry.definition.textFilter.value = this.textQueryNode.value || null;
			var nodes = query('input[type="checkbox"]', this.textQueryFieldsNode);
			for (var i = 0; i < nodes.length; i++) {
				if (nodes[i].checked) {
					inquiry.definition.textFilter.fields.push(nodes[i].value);
				}
			}

			// Date
			inquiry.definition.dateFilter.field = 'postedTime';
			inquiry.definition.dateFilter.range.start = this.dateRangeStartNode.value || null;
			inquiry.definition.dateFilter.range.end = this.dateRangeEndNode.value || null;
			var dayNodes = query('input[type="checkbox"]:checked', this.dateFilterNode);
			for (i = 0; i < dayNodes.length; i++) {
				inquiry.definition.dateFilter.days.push(parseInt(dayNodes[i].value, 10));
			}

			// Geo
			inquiry.definition.geoFilter.field = 'socialtap.geo_coordinate';
			inquiry.definition.geoFilter.lat = this.geoLatNode.value || null;
			inquiry.definition.geoFilter.lon = this.geoLonNode.value || null;
			inquiry.definition.geoFilter.distance.value = this.geoDistanceNode.value || null;
			inquiry.definition.geoFilter.distance.unit = this.geoDistanceUnitsNode.value || null;

			inquiry.description = this.descriptionField.value || null;

			inquiry.datasetId = this.get('datasetId');

			return inquiry;
		},

		_setDatasetIdAttr: function(datasetId) {
			this._set('datasetId', datasetId);
			this.clearForm();
			this.set('lastSavedInquiry', null);
		},

		_setInquiryAttr: function(inquiry) {
			this.clearForm();

			if (inquiry === null) {
				inquiry = new Inquiry();
			}

			if (inquiry.datasetId && inquiry.datasetId != this.get('datasetId')) {
				console.warn('Setting inquiry with wrong dataset ID');
			}

			// Text
			this.textQueryNode.value = inquiry.definition.textFilter.value;
			var nodes = query('input[type="checkbox"]', this.textQueryFieldsNode);
			for (var i = 0; i < nodes.length; i++) {
				nodes[i].checked = (inquiry.definition.textFilter.fields && inquiry.definition.textFilter.fields.indexOf(nodes[i].value) !== -1);
			}

			// Date
			this.dateRangeStartNode.value = inquiry.definition.dateFilter.range.start || '';
			this.dateRangeEndNode.value = inquiry.definition.dateFilter.range.end || '';
			nodes = query('input[type="checkbox"]', this.dateFilterNode);
			for (var j = 0; j < nodes.length; j++) {
				nodes[j].checked = (inquiry.definition.dateFilter.days && inquiry.definition.dateFilter.days.indexOf(parseInt(nodes[j].value, 10)) !== -1);
			}

			// Geo
			this.geoDistanceNode.value = inquiry.definition.geoFilter.distance.value;
			this.geoDistanceUnitsNode.value = inquiry.definition.geoFilter.distance.unit;
			this.geoLatNode.value = inquiry.definition.geoFilter.lat;
			this.geoLonNode.value = inquiry.definition.geoFilter.lon;

			this.descriptionField.value = inquiry.description || null;
		}

	});
});
