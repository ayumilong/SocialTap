define(['dojo/_base/declare',
		'dojo/_base/kernel',
		'dojo/_base/lang',
		'dojo/_base/window',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/on',
		'dojo/request/xhr',
		'dojo/text!./ProfilePane.html',
		'dojo/topic',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'app/auth/user'
], function(declare, kernel, lang, win, domClass, domConstruct, on, xhr, template, topic, _WidgetBase, _TemplatedMixin, user) {
	return declare([_WidgetBase, _TemplatedMixin], {

		templateString: template,

		hideMenu: function() {
			domClass.add(this.menuNode, 'hidden');
			domConstruct.destroy(this.overlay);
			this.overlay = null;
		},

		postCreate: function() {
			this.inherited(arguments);

			user.on('login', lang.hitch(this, this.refreshInfo));
			user.on('logout', lang.hitch(this, this.refreshInfo));

			topic.subscribe('/dojo-mama/routeEvent', lang.hitch(this, this.hideMenu));

			user.update();

			on(this.logoutLink, 'click', function(e) {
				e.preventDefault();
				user.logout();
			});
		},

		refreshInfo: function() {
			if (user.isLoggedIn()) {
				this.userNameNode.innerHTML = user.name;
				domClass.add(this.loginButton, 'hidden');
				domClass.remove(this.profileButton, 'hidden');
			}
			else {
				this.userNameNode = 'User';
				domClass.remove(this.loginButton, 'hidden');
				domClass.add(this.profileButton, 'hidden');
			}
		},

		refresh: function() {
			domClass.add(this.listNode, 'hidden');
			domConstruct.empty(this.listNode);

			var activityIndicator = domConstruct.create('span', {
				'class': 'fa fa-spinner fa-spin',
				style: {
					color: 'white',
					display: 'block',
					'font-size': '40px',
					margin: '30px auto',
					'text-align': 'center'
				}
			}, this.domNode);

			user.update().then(lang.hitch(this, function() {
					domConstruct.destroy(activityIndicator);
					domClass.remove(this.listNode, 'hidden');
					this.refreshInfo();
				}),
				lang.hitch(this, function(err) {
					domConstruct.destroy(activityIndicator);
					console.error(err);
				}));
		},

		showMenu: function() {
			domClass.remove(this.menuNode, 'hidden');
			this.overlay = domConstruct.create('div', {
				'class': 'menuOverlay',
			}, win.body());

			on(this.overlay, 'mouseover', lang.hitch(this, this.hideMenu));
		}

	});
});
