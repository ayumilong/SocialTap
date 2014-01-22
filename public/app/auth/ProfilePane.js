define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-class',
		'dojo/on',
		'dojo/router',
		'dojo/text!./ProfilePane.html',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'app/auth/user'
], function(declare, lang, domClass, on, router, template, _WidgetBase, _TemplatedMixin, user) {
	return declare([_WidgetBase, _TemplatedMixin], {
		baseClass: 'profilePane',
		templateString: template,

		postCreate: function() {
			this.inherited(arguments);

			on(this.profileButton, 'click', lang.hitch(this, function() {
				domClass.toggle(this.menuNode, 'hidden');
				if (!domClass.contains(this.menuNode, 'hidden')) {
					domClass.add(this.loginNode, 'hidden');
					domClass.add(this.infoNode, 'hidden');
					user.update().then(lang.hitch(this, function() {
						if (user.isLoggedIn()) {
							this.userNameNode.innerHTML = user.name;
							domClass.remove(this.infoNode, 'hidden');
						}
						else {
							domClass.remove(this.loginNode, 'hidden');
						}
					}));
				}
			}));

			on(this.loginLink, 'click', lang.hitch(this, function() {
				domClass.add(this.menuNode, 'hidden');
			}));

			on(this.logoutButton, 'click', lang.hitch(this, function() {
				domClass.add(this.menuNode, 'hidden');
				user.logout().then(function() {
					router.go('/');
				});
			}));
		}
	});
});
