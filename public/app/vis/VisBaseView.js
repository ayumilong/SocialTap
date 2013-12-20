/*global $,d3*/
define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/request/xhr',
		'dojo/dom-construct',
		'dojo-mama/views/ModuleScrollableView'
], function(declare, lang, xhr, domConstruct, ModuleScrollableView) {

	return declare([ModuleScrollableView], {
		buildRendering: function() {
			this.inherited(arguments);
			console.log("it's me Mario!");

			domConstruct.create('div', {
				'id': "test"
			}, this.domNode);

		},

		activate: function(e) {
			if (!this.activated) {
				this.activated = true;
			}
		},


		es: function(query, callback) {
			var that = this;
			this.datasetId = 1;
			xhr.post('/api/v0/datasets/' + this.datasetId + '/search.json', {
				handleAs: 'json',
				data: JSON.stringify(query),
				headers: {
					'Content-Type': 'application/json'
				}}).then(
					lang.hitch(this, callback), // Success handler
					lang.hitch(this, function(err) { console.error(err); }) // Error handler
				);
		}
	});
});
