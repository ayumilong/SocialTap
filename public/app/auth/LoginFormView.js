define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-class',
		'dojo/on',
		'dojo/request/xhr',
		'dojo/router',
		'dojo/text!./LoginForm.html',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dojo-mama/views/_ModuleViewMixin'
], function(declare, lang, domAttr, domClass, on, xhr, router, template, _WidgetBase,
	_TemplatedMixin, _ModuleViewMixin)
{
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
			domClass.add(this.errorsNode, 'hidden');
			this.errorsNode.innerHTML = '';
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
					router.go('/');
				}),
				lang.hitch(this, function(err) {
					domAttr.remove(this.loginButton, 'disabled');

					if (err.response.status == 401) {
						this.errorsNode.innerHTML = 'Invalid email/password combination';
						domClass.remove(this.errorsNode, 'hidden');
					}
					else {
						console.error(err);
					}
				})
			);
		}


	});
});
