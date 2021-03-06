define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/cookie',
		'dojo/dom-attr',
		'dojo/dom-class',
		'dojo/keys',
		'dojo/on',
		'dojo/request/xhr',
		'dojo/router',
		'dojo/text!./LoginForm.html',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dojo-mama/views/_ModuleViewMixin',
		'./user'
], function(declare, lang, cookie, domAttr, domClass, keys, on, xhr, router, template, _WidgetBase,
	_TemplatedMixin, _ModuleViewMixin, user)
{
	return declare([_WidgetBase, _TemplatedMixin, _ModuleViewMixin], {

		'class': 'loginFormView',
		parentView: '/',
		route: '/login',
		templateString: template,
		title: 'Login',

		activate: function() {
			this.inherited(arguments);

			if (cookie('connect_account_require_login')) {
				this.errorsNode.innerHTML = 'You must login to connect an account';
				domClass.remove(this.errorsNode, 'hidden');
				cookie('connect_account_require_login', '', { expires: -1 });
			}
			else {
				this.errorsNode.innerHTML = '';
				domClass.add(this.errorsNode, 'hidden');
			}
		},

		postCreate: function() {
			this.inherited(arguments);
			on(this.loginButton, 'click', lang.hitch(this, this.login));
			on(this.domNode, 'keydown', lang.hitch(this, function(e) {
				if (e.keyCode == keys.ENTER) {
					this.login();
				}
			}));
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
					user.update();
				}),
				lang.hitch(this, function(err) {
					console.error(err);
					domAttr.remove(this.loginButton, 'disabled');
					this.passwordField.value = '';

					if (err.response.status == 401) {
						this.errorsNode.innerHTML = 'Invalid email/password combination';
						domClass.remove(this.errorsNode, 'hidden');
					}
					else {
						this.errorsNode.innerHTML = '<ul>' + err.response.data.errors.map(function(e) { return '<li>' + e + '</li>'; }).join('') + '</ul>';
						domClass.remove(this.errorsNode, 'hidden');
					}
				})
			);
		}


	});
});
