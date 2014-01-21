define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/on',
		'dojo/request/xhr',
		'dojo/text!./LoginForm.html',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dojo-mama/Views/_ModuleViewMixin'
], function(declare, lang, domAttr, on, xhr, template, _WidgetBase, _TemplatedMixin, _ModuleViewMixin) {
	return declare([_WidgetBase, _TemplatedMixin, _ModuleViewMixin], {

		'class': 'loginFormView',
		parentView: '/',
		route: '/login',
		templateString: template,
		title: 'Login',

		postCreate: function() {
			this.inherited(arguments);
			on(this.loginButton, 'click', lang.hitch(this, this.login));
		},

		login: function() {
			domAttr.set(this.loginButton, 'disabled', 'disabled');
			xhr.post('/auth/identity/callback', {
				data: {
					auth_key: this.emailField.value,
					password: this.passwordField.value
				},
				handleAs: 'json'
			}).response.then(
				lang.hitch(this, function(response) {
					domAttr.remove(this.loginButton, 'disabled');
					this.emailField.value = '';
					this.passwordField.value = '';
					console.log(response);
				}),
				lang.hitch(this, function(err) {
					domAttr.remove(this.loginButton, 'disabled');
					console.error(err);
				})
			);
		}


	});
});
