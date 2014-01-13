define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-construct',
		'dojo/on',
		'dojo/Evented',
		'dijit/_WidgetBase'
], function(declare, lang, domAttr, domConstruct, on, Evented, _WidgetBase) {
	return declare([_WidgetBase, Evented], {

		'class': 'visOptionsPane',

		options: null,

		_setOptionsAttr: function(/*Array*/options) {
			this._set('options', options);

			// Remove old option selects.
			domConstruct.empty(this.domNode);

			console.log('options pane set options');
			console.log(options);

			if (!options) {
				this.domNode.innerHTML = 'No options available for this visualization';
				return;
			}

			var i, j, opt;
			var inputNode, optNode;

			var createChangeHandler = lang.hitch(this, function(opt) {
				return lang.hitch(this, function(e) {
					console.log(opt.name + ' set to ' + e.target.value);
					this.emit('option_set', {
						name: opt.name,
						value: e.target.value
					});
				});
			});

			for (i = 0; i < options.length; i++) {
				opt = options[i];

				if (opt.hasOwnProperty('allowedValues')) {
					inputNode = domConstruct.create('select');
					for (j = 0; j < opt.allowedValues.length; j++) {
						optNode = domConstruct.create('option', {
							innerHTML: opt.allowedValues[j].label,
							value: opt.allowedValues[j].value
						}, inputNode);

						if (opt.allowedValues[j].value == opt.currentValue) {
							domAttr.set(optNode, 'selected', 'selected');
						}
					}
				}
				else {
					inputNode = domConstruct.create('input', {
						type: 'text',
						value: opt.currentValue
					});
				}

				domConstruct.place(inputNode, this.domNode);

				domConstruct.create('label', {
					innerHTML: opt.label
				}, inputNode, 'before');

				on(inputNode, 'change', createChangeHandler(opt));
			}
		}

	});
});
