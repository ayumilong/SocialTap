define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/Evented',
		'dojox/mobile/CheckBox',
		'dojox/mobile/Pane',
		'dojox/mobile/TextBox',
		'../../util/Select'
], function(declare, lang, domClass, domConstruct, Evented, CheckBox, Pane, TextBox, Select) {
	return declare([Pane, Evented], {

		'class': 'geoQueryFieldset',

		latField: null,

		lngField: null,

		distanceField: null,

		unitsSelect: null,

		buildRendering: function() {
			this.inherited(arguments);

			domConstruct.create('label', {
				innerHTML: this.label || 'Geo'
			}, this.domNode);

			var fieldsetNode = domConstruct.create('fieldset', {}, this.domNode);

			var changeHandler = lang.hitch(this, function() {
				this.emit('change', this.buildInquiryPart());
			});

			this.latField = new TextBox({
				'class': 'latField',
				onChange: changeHandler,
				placeHolder: 'Lat',
				trim: true
			});
			this.latField.placeAt(fieldsetNode);

			domConstruct.create('label', {
				'for': this.latField.get('id'),
				innerHTML: 'Near'
			}, this.latField.domNode, 'before');

			this.lngField = new TextBox({
				'class': 'lngField',
				onChange: changeHandler,
				placeHolder: 'Lng',
				trim: true
			});
			this.lngField.placeAt(fieldsetNode);

			var div = domConstruct.create('div', {}, fieldsetNode);

			this.distanceField = new TextBox({
				onChange: changeHandler,
				placeHolder: 'Distance',
				trim: true
			});
			this.distanceField.placeAt(div);

			domConstruct.create('label', {
				'for': this.distanceField.get('id'),
				innerHTML: 'Within'
			}, this.distanceField.domNode, 'before');

			this.unitsSelect = new Select({
				'class': 'distanceField',
				onChange: changeHandler,
				options: [{value: 'miles', label: 'miles'}, {value: 'kilometers', label: 'kilometers'}]
			});
			this.unitsSelect.placeAt(div);
		},

		buildInquiryPart: function() {
			return {
				type: 'geoQuery',
				field: 'geo.coordinates',
				near: {
					lat: this.latField.get('value'),
					lng: this.lngField.get('value')
				},
				distance: {
					value: this.distanceField.get('value'),
					units: this.unitsSelect.get('value')
				}
			};
		},

		reset: function() {
			this.latField.set('value', '');
			this.lngField.set('value', '');
			this.distanceField.set('value', '');
			this.unitsSelect.set('value', 'miles');
		}

	});
});
