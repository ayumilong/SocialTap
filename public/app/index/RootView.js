define(['dojo/_base/declare',
		'dojo/dom-construct',
		'dojo/topic',
		'dojo-mama/views/ModuleView'
], function(declare, domConstruct, topic, ModuleView) {
	return declare([ModuleView], {

		'class': 'rootView',

		buildRendering: function() {
			this.inherited(arguments);

			domConstruct.create('div', {
				'class': 'footer',
				innerHTML: '<div class="title">This is <strong>SocialTap</strong></div>' +
					'<div class="subtitle">Social media turned up to 11</div>'
			}, this.domNode);
		},

		activate: function(/*e*/) {
			this.inherited(arguments);

			topic.publish('/dojo-mama/updateSubNav', {
				back: false
			});
		}

	});
});
