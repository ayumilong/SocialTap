define(['dojo/_base/declare',
		'dojo/dom-style'
], function(declare, domStyle) {
	return declare([], {
		// summary:
		//     Adds native (y-axis) scrolling to a widget.

		buildRendering: function() {
			this.inherited(arguments);
			domStyle.set(this.domNode, {
				maxHeight: '100%',
				overflow: 'auto'
			});
		}
	});
});
