define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-class',
		'dojo/on',
		'dojo/request/xhr',
		'dojo/router',
		'dojo/text!./ProfilePane.html',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin'
], function(declare, lang, domClass, on, xhr, router, template, _WidgetBase, _TemplatedMixin) {
	return declare([_WidgetBase, _TemplatedMixin], {
		baseClass: 'profilePane',
		templateString: template,

		postCreate: function() {
			this.inherited(arguments);

			on(this.profileButton, 'click', lang.hitch(this, function() {
				domClass.toggle(this.menuNode, 'hidden');
				if (!domClass.contains(this.menuNode, 'hidden')) {
					this.update();
				}
			}));

			on(this.loginLink, 'click', lang.hitch(this, function() {
				domClass.add(this.menuNode, 'hidden');
			}));

			on(this.logoutButton, 'click', lang.hitch(this, function() {
				domClass.add(this.menuNode, 'hidden');
				xhr.get('/auth/signout', {
					handleAs: 'json'
				}).response.then(
					lang.hitch(this, function(response) {
						router.go('/');
					}),
					lang.hitch(this, function(err) {
						console.error(err);
					}));
			}));
		},

		update: function() {
			domClass.add(this.loginNode, 'hidden');
			domClass.add(this.infoNode, 'hidden');

			xhr.get('/me', {
				handleAs: 'json'
			}).response.then(
				lang.hitch(this, function(response) {
					this.userNameNode.innerHTML = response.data.name;
					domClass.remove(this.infoNode, 'hidden');
				}),
				lang.hitch(this, function(err) {
					if (err.response.status == 401) {
						domClass.remove(this.loginNode, 'hidden');
					}
					else {
						console.error(err);
					}
				}));
		}
	});
});
