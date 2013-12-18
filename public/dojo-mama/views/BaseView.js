define(['dojo/_base/declare',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo-mama/util/ScrollablePane',
		'dojo-mama/views/ModuleView'
], function(declare, domClass, domConstruct, ScrollablePane, ModuleView) {
	return declare([ModuleView], {

		titleNode: null,

		contentNode: null,

		headerNode: null,

		footerNode: null,

		showHeader: false,

		showFooter: false,

		buildRendering: function() {
			this.inherited(arguments);

			domClass.add(this.domNode, 'dmView');

			var contentPane = new ScrollablePane({
				'class': 'dmViewContent'
			});
			contentPane.placeAt(this.domNode);
			contentPane.startup();
			this.contentNode = contentPane.domNode;

			if (this.title) {
				this._buildTitle();
			}

			if (this.showHeader) {
				this._buildHeader();
			}

			if (this.showFooter) {
				this._buildFooter();
			}
		},

		_buildHeader: function() {
			this.headerNode = domConstruct.create('div', {
				'class': 'dmViewHeader'
			}, this.domNode, 'first');

			if (this.titleNode) {
				domConstruct.place(this.headerNode, this.titleNode, 'after');
			}
			else {
				domConstruct.place(this.headerNode, this.domNode, 'first');
			}
		},

		_setShowHeaderAttr: function(showHeader) {
			this._set('showHeader', showHeader);

			if (showHeader) {
				domClass.add(this.domNode, 'hasHeader');
				if (!this.headerNode) {
					this._buildHeader();
				}
			}
			else if (this.headerNode) {
				domClass.remove(this.domNode, 'hasHeader');
				domConstruct.destroy(this.headerNode);
				this.headerNode = null;
			}
		},

		_buildFooter: function() {
			this.footerNode = domConstruct.create('div', {
				'class': 'dmViewFooter'
			}, this.domNode, 'last');
		},

		_setShowFooterAttr: function(showFooter) {
			this._set('showFooter', showFooter);

			if (showFooter) {
				domClass.add(this.domNode, 'hasFooter');
				if (!this.footerNode) {
					this._buildFooter();
				}
			}
			else if (this.footerNode) {
				domClass.remove(this.domNode, 'hasFooter');
				domConstruct.destroy(this.footerNode);
				this.footerNode = null;
			}
		},

		_buildTitle: function() {
			this.titleNode = domConstruct.create('div', {
				'class': 'dmViewTitle',
				'innerHTML': this.title
			}, this.domNode, 'first');
		},

		_setTitleAttr: function(title) {
			this._set('title', title);

			if (title) {
				domClass.add(this.domNode, 'hasTitle');
				if (!this.titleNode) {
					this._buildTitle();
				}
				this.titleNode.innerHTML = title;
			}
			else if (this.titleNode) {
				domClass.remove(this.domNode, 'hasTitle');
				domConstruct.destroy(this.titleNode);
				this.titleNode = null;
			}
		}

	});
});
