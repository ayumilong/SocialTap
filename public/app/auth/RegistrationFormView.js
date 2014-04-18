define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/keys',
		'dojo/on',
		'dojo/request/xhr',
		'dojo/router',
		'dojo/text!./RegistrationForm.html',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dojo-mama/views/_ModuleViewMixin',
		'app/auth/user'
], function(declare, lang, domAttr, domClass, domConstruct, keys, on, xhr, router, template, _WidgetBase,
	_TemplatedMixin, _ModuleViewMixin, user)
{
	return declare([_WidgetBase, _TemplatedMixin, _ModuleViewMixin], {

		'class': 'registrationFormView',
		parentView: '/',
		route: '/register',
		templateString: template,
		title: 'Register',

		postCreate: function() {
			this.inherited(arguments);
			on(this.registerButton, 'click', lang.hitch(this, this.register));
			on(this.domNode, 'keydown', lang.hitch(this, function(e) {
				if (e.keyCode == keys.ENTER) {
					this.register();
				}
			}));
		},

		register: function() {
			domAttr.set(this.registerButton, 'disabled', 'disabled');
			domClass.add(this.errorsNode, 'hidden');
			domConstruct.empty(this.errorsNode);
			xhr.post('/auth/identity/register', {
				data: {
					email: this.emailField.value,
					name: this.nameField.value,
					password: this.passwordField.value,
					password_confirmation: this.confirmField.value
				},
				handleAs: 'json'
			}).response.then(
				lang.hitch(this, function(response) {
					this.emailField.value = '';
					this.nameField.value = '';
					this.passwordField.value = '';
					this.confirmField.value = '';
					domAttr.remove(this.registerButton, 'disabled');
					console.log(response);
					user.update();
					router.go('/');
				}),
				lang.hitch(this, function(err) {
					domAttr.remove(this.registerButton, 'disabled');

					this.passwordField.value = '';
					this.confirmField.value = '';

					if (err.response.status == 400) {
						var errorList = domConstruct.create('ul', {}, this.errorsNode);

						var i;
						for (i = 0; i < err.response.data.errors.length; i++) {
							domConstruct.create('li', {
								innerHTML: err.response.data.errors[i]
							}, errorList);
						}

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
