define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-construct',
		'dojo/request/xhr',
		'dojox/mobile/Button',
		'dojox/mobile/TextBox',
		'dojo-mama/util/toaster',
		'dojo-mama/views/ModuleScrollableView'
], function(declare, lang, domAttr, domConstruct, xhr, Button, TextBox, toaster, ModuleScrollableView)
{
	return declare([ModuleScrollableView], {

		'class': 'createDatasetView',

		datasetNameField: null,

		datasetDescriptionField: null,

		parentView: '/',

		route: '/create',

		submitButton: null,

		title: 'New Dataset',

		buildRendering: function() {
			this.inherited(arguments);

			this.datasetNameField = new TextBox({
				name: 'datasetName',
				placeHolder: 'Dataset Name',
				trim: true
			});
			this.datasetNameField.placeAt(this.domNode);
			this.datasetNameField.startup();

			domConstruct.create('label', {
				'class': 'heading',
				'for': this.datasetNameField.get('id'),
				innerHTML: 'Dataset Name'
			}, this.datasetNameField.domNode, 'before');

			this.datasetDescriptionField = new TextBox({
				name: 'datasetName',
				placeHolder: 'Dataset Description',
				trim: true
			});
			this.datasetDescriptionField.placeAt(this.domNode);
			this.datasetDescriptionField.startup();

			domConstruct.create('label', {
				'class': 'heading',
				'for': this.datasetDescriptionField.get('id'),
				innerHTML: 'Dataset Description'
			}, this.datasetDescriptionField.domNode, 'before');

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

		submit: function() {
			domAttr.set(this.submitButton.domNode, 'disabled', 'disabled');

			var request = {};
			request.name = this.datasetNameField.get('value');
			request.description = this.datasetDescriptionField.get('value');

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
					this.datasetNameField.set('value', '');
					this.datasetDescriptionField.set('value', '');

					domAttr.remove(this.submitButton.domNode, 'disabled');
					toaster.clearMessages();
					console.log(response);

					this.router.go('/' + response.data.id);
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
