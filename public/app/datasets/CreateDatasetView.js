define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/request/xhr',
		'dojox/mobile/Button',
		'dojox/mobile/Pane',
		'dojox/mobile/RadioButton',
		'dojox/mobile/TextBox',
		'dojo-mama/util/toaster',
		'dojo-mama/views/ModuleScrollableView',
		'app/util/Select'
], function(declare, lang, domAttr, domClass, domConstruct, xhr, Button, Pane, RadioButton, TextBox,
	toaster, ModuleScrollableView, Select)
{
	return declare([ModuleScrollableView], {

		'class': 'createDatasetView',

		nameField: null,

		descriptionField: null,

		fileFormContainer: null,

		gnipFormContainer: null,

		gnipRuleField: null,

		filePathField: null,

		fileFormatSelect: null,

		fileFormatNotesNode: null,

		parentView: '/',

		route: '/create',

		selectedDatasetType: 'gnip',

		submitButton: null,

		title: 'New Dataset',

		buildRendering: function() {
			this.inherited(arguments);

			this.nameField = new TextBox({
				name: 'name',
				placeHolder: 'Name'
			});
			this.nameField.placeAt(this.domNode);
			this.nameField.startup();

			domConstruct.create('label', {
				'class': 'heading',
				'for': this.nameField.get('id'),
				innerHTML: 'Name'
			}, this.nameField.domNode, 'before');

			this.descriptionField = new TextBox({
				name: 'description',
				placeHolder: 'Description'
			});
			this.descriptionField.placeAt(this.domNode);
			this.descriptionField.startup();

			domConstruct.create('label', {
				'class': 'heading',
				'for': this.descriptionField.get('id'),
				innerHTML: 'Description'
			}, this.descriptionField.domNode, 'before');

			domConstruct.create('label', {
				'class': 'heading',
				innerHTML: 'Type'
			}, this.domNode);

			var gnipButton = new RadioButton({
				checked: true,
				name: 'datasetType',
				onChange: lang.hitch(this, function(checked) {
					if (checked) {
						this.set('selectedDatasetType', 'gnip');
					}
				}),
				value: 'gnip'
			});
			gnipButton.placeAt(this.domNode);
			gnipButton.startup();

			domConstruct.create('label', {
				'for': gnipButton.get('id'),
				innerHTML: 'Gnip'
			}, gnipButton.domNode, 'before');

			var fileButton = new RadioButton({
				name: 'datasetType',
				onChange: lang.hitch(this, function(checked) {
					if (checked) {
						this.set('selectedDatasetType', 'file');
					}
				}),
				value: 'file'
			});
			fileButton.placeAt(this.domNode);
			fileButton.startup();

			domConstruct.create('label', {
				'for': fileButton.get('id'),
				innerHTML: 'File'
			}, fileButton.domNode, 'before');

			/* Gnip rule inputs */
			this.gnipFormContainer = new Pane();
			this.gnipFormContainer.placeAt(this.domNode);
			this.gnipFormContainer.startup();

			this.gnipRuleField = new TextBox({
				placeHolder: 'Gnip Rule',
				trim: true,
			});
			this.gnipRuleField.placeAt(this.gnipFormContainer.domNode);
			this.gnipRuleField.startup();

			domConstruct.create('label', {
				'class': 'heading',
				'for': this.gnipRuleField.get('id'),
				innerHTML: 'Gnip Rule'
			}, this.gnipRuleField.domNode, 'before');

			domConstruct.create('a', {
				'class': 'note',
				href: 'http://support.gnip.com/customer/portal/articles/600659-powertrack-generic#Rules',
				target: '_blank',
				innerHTML: 'Gnip Rule Documentation',
				style: {
					display: 'block'
				}
			}, this.gnipFormContainer.domNode);

			/* File upload inputs */
			this.fileFormContainer = new Pane();
			this.fileFormContainer.placeAt(this.domNode);
			this.fileFormContainer.startup();

			this.filePathField = new TextBox({
				placeHolder: 'path/to/file',
				trim: true,
			});
			this.filePathField.placeAt(this.fileFormContainer.domNode);
			this.filePathField.startup();

			var pathLabel = domConstruct.create('label', {
				'class': 'heading',
				'for': this.filePathField.get('id'),
				innerHTML: 'File Path (relative to import directory)'
			}, this.filePathField.domNode, 'before');

			xhr.get('/api/v0/import_files/path', {
				handleAs: 'json'
			}).then(
				function(response) {
					pathLabel.innerHTML = 'File Path (relative to ' + response.path + ')';
				},
				function(err) {
					console.error(err);
				});

			this.fileFormatSelect = new Select({
				options: [
					{value: "Json", label: "JSON"},
					{value: "Csv", label: "CSV"}
				]
			});
			this.fileFormatSelect.placeAt(this.fileFormContainer.domNode);
			this.fileFormatSelect.startup();

			domConstruct.create('label', {
				'class': 'heading',
				'for': this.fileFormatSelect.get('id'),
				innerHTML: 'File Format'
			}, this.fileFormatSelect.domNode, 'before');

			this.fileFormatNotesNode = domConstruct.create('p', {}, this.fileFormContainer.domNode);
			this.showNotesForFileFormat(this.fileFormatSelect.get('value'));
			this.fileFormatSelect.set('onChange', lang.hitch(this, this.showNotesForFileFormat));

			/* Submit button */
			this.submitButton = new Button({
				'class': 'button',
				duration: 0,
				label: 'Create',
				onClick: lang.hitch(this, function() {
					this.submit();
				}),
				style: {display: 'block'}
			});
			this.submitButton.placeAt(this.domNode);
			this.submitButton.startup();
		},

		showNotesForFileFormat: function(format) {
			var notes = null;
			switch (format) {
				case 'Json':
					notes = 'One JSON encoded item per line.';
					break;
				case 'Csv':
					notes = 'Select column delimiter below:';
					break;
			}
			this.fileFormatNotesNode.innerHTML = notes;
		},

		_setSelectedDatasetTypeAttr: function(selectedDatasetType) {
			this._set('selectedDatasetType', selectedDatasetType);

			if (selectedDatasetType === 'gnip') {
				domClass.remove(this.gnipFormContainer.domNode, 'hidden');
				domClass.add(this.fileFormContainer.domNode, 'hidden');
			}
			else if (selectedDatasetType === 'file') {
				domClass.add(this.gnipFormContainer.domNode, 'hidden');
				domClass.remove(this.fileFormContainer.domNode, 'hidden');
			}
		},

		submit: function() {
			domAttr.set(this.submitButton.domNode, 'disabled', 'disabled');

			var request = {};

			request.name = this.nameField.get('value');
			request.description = this.descriptionField.get('value');

			var type = this.get('selectedDatasetType');
			if (type === 'gnip') {
				request.type = 'GnipDataset';
				request.rule_value = this.gnipRuleField.get('value');
			}
			else if (type === 'file') {
				request.type = 'FileDataset';
				request.source = this.filePathField.get('value');

				var format = this.fileFormatSelect.get('value');
				if (format == 'Json') {
					request.data_mapping_attributes = {
						type: 'JsonDataMapping',
						options: {}
					};
				}
				else if (format == 'Csv') {
					request.data_mapping_attributes = {
						type: 'CsvDataMapping',
						options: {}
					};
				}
			}

			console.warn('Sending request');
			console.warn(request);

			toaster.clearMessages();
			toaster.displayMessage({
				text: 'Creating dataset...',
				type: 'information',
				time: -1
			});
			xhr.post('/api/v0/datasets.json', {
				data: JSON.stringify({
					dataset: request
				}),
				handleAs: 'json',
				headers: {
					'Content-Type': 'application/json'
				}
			}).response.then(
				lang.hitch(this, function(response) {

					// Reset form
					this.nameField.set('value', '');
					this.descriptionField.set('value', '');
					this.gnipRuleField.set('value', '');
					this.filePathField.set('value', '');
					this.fileFormatSelect.set('value', 'Json');

					domAttr.remove(this.submitButton.domNode, 'disabled');
					toaster.clearMessages();
					console.log(response);

					this.router.go('/');// + response.data.id);
				}),
				lang.hitch(this, function(err) {
					domAttr.remove(this.submitButton.domNode, 'disabled');
					toaster.clearMessages();
					console.error(err);

					if (err.response.status == 422) {

						var validationErrors = err.response.data;
						var field, i;
						var errMessage = '';
						for (field in validationErrors) {
							if (validationErrors.hasOwnProperty(field)) {
								for (i = 0; i < validationErrors[field].length; i++) {
									errMessage += '<br>' + field + ' ' + validationErrors[field][i];
								}
							}
						}

						toaster.displayMessage({
							text: 'Unable to save dataset. Some fields are invalid.' + errMessage,
							type: 'error',
							time: -1
						});
					}
					else {
						toaster.displayMessage({
							text: 'An unknown error occurred',
							type: 'error',
							time: -1
						});
					}
				}));

		}

	});
});
