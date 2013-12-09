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

		'class': 'createDataSourceView',

		fileFormContainer: null,

		gnipFormContainer: null,

		gnipRuleField: null,

		filePathField: null,

		fileFormatSelect: null,

		fileFormatNotesNode: null,

		parentView: '/',

		route: '/create',

		selectedDataSourceType: 'gnip',

		submitButton: null,

		title: 'New Data Source',

		buildRendering: function() {
			this.inherited(arguments);

			domConstruct.create('label', {
				'class': 'heading',
				innerHTML: 'Data Source Type'
			}, this.domNode);

			var gnipButton = new RadioButton({
				checked: true,
				name: 'dataSourceType',
				onChange: lang.hitch(this, function(checked) {
					if (checked) {
						this.set('selectedDataSourceType', 'gnip');
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
				name: 'dataSourceType',
				onChange: lang.hitch(this, function(checked) {
					if (checked) {
						this.set('selectedDataSourceType', 'file');
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
					{value: "Activity Streams", label: "Activity Streams"},
					{value: "Twitter", label: "Twitter"},
					{value: "CSV", label: "CSV"}
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
				case 'activity':
					notes = 'One JSON encoded activity stream per line.';
					break;
				case 'tweet':
					notes = 'One JSON encoded Tweet per line.';
					break;
				case 'csv':
					notes = 'Define mapping of CSV fields to activity stream fields below.';
					break;
			}
			this.fileFormatNotesNode.innerHTML = notes;
		},

		_setSelectedDataSourceTypeAttr: function(selectedDataSourceType) {
			this._set('selectedDataSourceType', selectedDataSourceType);

			if (selectedDataSourceType === 'gnip') {
				domClass.remove(this.gnipFormContainer.domNode, 'hidden');
				domClass.add(this.fileFormContainer.domNode, 'hidden');
			}
			else if (selectedDataSourceType === 'file') {
				domClass.add(this.gnipFormContainer.domNode, 'hidden');
				domClass.remove(this.fileFormContainer.domNode, 'hidden');
			}
		},

		submit: function() {
			domAttr.set(this.submitButton.domNode, 'disabled', 'disabled');

			var request = {};
			var type = this.get('selectedDataSourceType');
			if (type === 'gnip') {
				request.type = 'GnipDataSource';
				request.rule_attributes = {
					value: this.gnipRuleField.get('value')
				};
			}
			else if (type === 'file') {
				request.type = 'FileDataSource';

				var format = this.fileFormatSelect.get('value');

				request.file_attributes = {
					path: this.filePathField.get('value'),
					format: this.fileFormatSelect.get('value')
				};

				if (format === 'Twitter') {
					request.data_mapping_attributes = {
						type: 'TweetDataMapping'
					};
				}
			}

			console.warn('Sending request');
			console.warn(request);

			toaster.clearMessages();
			toaster.displayMessage({
				text: 'Creating data source...',
				type: 'information',
				time: -1
			});
			xhr.post('/api/v0/data_sources.json', {
				data: JSON.stringify({
					data_source: request
				}),
				handleAs: 'json',
				headers: {
					'Content-Type': 'application/json'
				}
			}).response.then(
				lang.hitch(this, function(response) {

					// Reset form
					this.gnipRuleField.set('value', '');
					this.filePathField.set('value', '');
					this.fileFormatSelect.set('value', 'Activity Streams');

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
							text: 'Unable to save data source. Some fields are invalid.' + errMessage,
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
