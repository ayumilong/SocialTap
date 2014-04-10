define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/dom-attr',
	'dojo/dom-class',
	'dojo/dom-construct',
	'dojo/dom-style',
	'dojo/Evented',
	'dojo/on',
	'dojo/request/xhr',
	'dijit/_WidgetBase'
], function(declare, lang, domAttr, domClass, domConstruct, domStyle, Evented, on, xhr, _WidgetBase) {

	var formElementCounter = 0;

	return declare([_WidgetBase, Evented], {

		baseClass: 'form',

		// fields: Array
		//     Fields to display in form.
		//     {
		//        label: String // label text
		//        name: String // key for this field's value in request
		//        placeholder: String  // valid for text and textarea
		//        type: String   // type of input (text, textarea, checkbox, select)
		//        options: Array // { label: String, value: String } valid for select
		//        value: String  // valid for hidden
		//     }
		fields: null,

		name: null,

		submitLabel: 'Submit',

		url: null,

		buildRendering: function() {
			this.inherited(arguments);

			this.containerNode = domConstruct.create('form', {}, this.domNode);

			var addChangeHandler = lang.hitch(this, function(field) {
				var eventName = (field.type.indexOf('text') === 0) ? 'keyup' : 'change';
				on(field.domNode, eventName, lang.hitch(this, function(e) {
					this.emit('field_change', {
						field: field.name,
						value: (field.type === 'checkbox') ? e.target.checked : e.target.value
					});
				}));
			});

			for (var i = 0; i < this.fields.length; i++) {
				var field = this.fields[i];
				var builderMethod = 'build' + field.type.charAt(0).toUpperCase() + field.type.slice(1);
				if (this[builderMethod] !== undefined) {

					var fieldNode = this[builderMethod](field);
					this.fields[i].domNode = fieldNode;
					if (field.style) {
						domStyle.set(fieldNode, field.style);
					}

					if (field.type != 'hidden') {
						addChangeHandler(field);
					}

					this.fields[i].containerNode = domConstruct.create('div', {}, this.containerNode);

					var id = 'form-element-' + formElementCounter;
					formElementCounter++;
					domAttr.set(fieldNode, 'id', id);

					domConstruct.place(fieldNode, this.fields[i].containerNode);

					if (field.type !== 'hidden') {
						this.fields[i].labelNode = domConstruct.create('label', {
							'data-field-type': field.type,
							'for': id,
							innerHTML: field.label || field.name.capitalize()
						}, fieldNode, 'before');
					}
				}
			}

			this.submitButton = domConstruct.create('button', {
				'class': 'primary',
				innerHTML: this.submitLabel,
				style: {
					'margin-top': '20px'
				}
			}, this.containerNode);

			on(this.submitButton, 'click', lang.hitch(this, this.submit));
		},

		buildCheckbox: function(field) {
			return domConstruct.create('input', {
				checked: (field.value ? true : false),
				name: field.name,
				type: 'checkbox'
			});
		},

		buildHidden: function(field) {
			return domConstruct.create('input', {
				name: field.name,
				type: 'hidden',
				value: field.value
			});
		},

		buildSelect: function(field) {
			var selectNode = domConstruct.create('select', {
				name: field.name
			});

			field.options.forEach(function(opt) {
				var optNode = domConstruct.create('option', {
					innerHTML: opt.label,
					value: opt.value
				}, selectNode);

				if (opt.value == field.value) {
					domAttr.set(optNode, 'selected', 'selected');
				}
			});

			return selectNode;
		},

		buildTextHelper: function(field, tag, opts) {
			var input = domConstruct.create(tag, lang.mixin({
				name: field.name
			}, opts));

			if (field.placeholder !== undefined) {
				domAttr.set(input, 'placeholder', field.placeholder);
			}

			return input;
		},

		buildText: function(field) {
			return this.buildTextHelper(field, 'input', { type: 'text '});
		},

		buildTextarea: function(field) {
			return this.buildTextHelper(field, 'textarea');
		},

		getValue: function() {
			var value = {};
			for (var i = 0; i < this.fields.length; i++) {
				var field = this.fields[i];

				var parts = field.name.split('.');
				var val2 = value;
				for (var j = 0; j < parts.length - 1; j++) {
					if (val2[parts[j]] === undefined) {
						val2[parts[j]] = {};
					}
					val2 = val2[parts[j]];
				}

				if (field.type === 'checkbox') {
					val2[parts[parts.length - 1]] = field.domNode.checked;
				}
				else {
					val2[parts[parts.length - 1]] = field.domNode.value;
				}

			}
			return value;
		},

		/*modifyValue: function(val) {
			// summary:
			//     Can be used by subclasses to modify value before it is submitted.
			//     Ex. Remove some values if another value is false, etc.
			return val;
		},*/

		setValues: function(values) {
			for (var i = 0; i < this.fields.length; i++) {
				var field = this.fields[i];
				// TODO: Check allowed values for checkbox/select fields.
				if (values.hasOwnProperty(field.name)) {
					this.fields[i].domNode.value = values[field.name];
				}
			}
		},

		reset: function() {
			for (var i = 0; i < this.fields.length; i++) {
				var field = this.fields[i];
				// TODO: Different for checkbox/select fields.
				field.domNode.value = '';
			}
			this.clearFieldErrors();
		},

		clearFieldErrors: function(/*String*/ fieldName) {
			for (var i = 0; i < this.fields.length; i++) {
				var field = this.fields[i];
				if (field.name === fieldName || fieldName === undefined) {
					domClass.remove(field.domNode, 'error');
					if (field.errorsNode) {
						domConstruct.destroy(field.errorsNode);
						field.errorsNode = null;
					}
					break;
				}
			}
		},

		showFieldErrors: function(/*String*/ fieldName, /*Array*/ errors) {
			for (var i = 0; i < this.fields.length; i++) {
				var field = this.fields[i];
				if (field.name === fieldName) {
					domClass.add(field.domNode, 'error');
					if (field.errorsNode) {
						domConstruct.destroy(field.errorsNode);
					}
					field.errorsNode = domConstruct.create('ul', {
						'class': 'alert error'
					}, field.domNode, 'after');
					for (var j = 0; j < errors.length; j++) {
						var text;
						if (errors[j].isCapitalized()) {
							text = errors[j];
						}
						else {
							text = (field.label || field.name.capitalize()) + ' ' + errors[j];
						}
						domConstruct.create('li', {
							innerHTML: text
						}, field.errorsNode);
					}
					break;
				}
			}
		},

		submit: function(e) {
			e.preventDefault(); // Prevent default form submission.

			var value = this.getValue();
			if (this.modifyValue !== undefined) {
				value = this.modifyValue(value);
			}

			var request = value;
			if (this.name !== undefined) {
				request = {};
				request[this.name] = value;
			}

			console.log('submitting form');
			console.log(request);

			domAttr.set(this.submitButton, 'disabled', 'disabled');
			this.clearFieldErrors();
			this.emit('submit', request);

			var activityIndicator = domConstruct.create('span', {
				'class': 'fa fa-spinner fa-spin',
				style: {
					'margin-right': '6px'
				}
			}, this.submitButton, 'first');

			xhr.post(this.url, {
				data: JSON.stringify(request),
				handleAs: 'json',
				headers: {
					'Content-Type': 'application/json'
				}
			}).response.then(
				lang.hitch(this, function(response) {
					domAttr.remove(this.submitButton, 'disabled');
					domConstruct.destroy(activityIndicator);
					this.reset();
					this.emit('success', response.data);
				}),
				lang.hitch(this, function(err) {
					console.error(err);
					domAttr.remove(this.submitButton, 'disabled');
					domConstruct.destroy(activityIndicator);

					var validationErrors = err.response.data;
					for (var fieldName in validationErrors) {
						if (validationErrors.hasOwnProperty(fieldName)) {
							this.showFieldErrors(fieldName, validationErrors[fieldName]);
						}
					}

					this.emit('error', err.response.data);
				}));
		}

	});
});
