define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-construct',
		'dojo/Evented',
		'dojox/mobile/Pane',
		'app/util/Select'
], function(declare, lang, domConstruct, Evented, Pane, Select) {
	return declare([Pane, Evented], {

		'class': 'visOptionsPane',

		// options: Array
		//     Array of options for a visualization.
		//     [
		//        {
		//           name: Key for option in vis class. When select is changed,
		//                 vis.set(name, value from select) will be called
		//           label: Label for select
		//           values: [
		//              {
		//                 label: Label for option in select
		//                 value: Value to set option to
		//              }
		//           ]
		//
		//        }
		//     ]
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

			var setChangeHandler = lang.hitch(this, function(select, opt) {
				select.set('onChange', lang.hitch(this, function(val) {
					this.emit('optionSet', {
						name: opt.name,
						value: val
					});
				}));
			});

			var i, opt, select;
			for (i = 0; i < options.length; i++) {
				opt = options[i];

				select = new Select({
					options: opt.values,
					value: opt.currentValue
				});
				select.placeAt(this.domNode);
				setChangeHandler(select, opt);

				domConstruct.create('label', {
					'for': select.get('id'),
					innerHTML: opt.label
				}, select.domNode, 'before');
			}
		}

	});
});
