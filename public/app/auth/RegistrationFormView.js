define(['dojo/_base/declare',
		'dojo/_base/lang',
		'dojo/dom-attr',
		'dojo/on',
		'dojo/request/xhr',
		'dojo/text!./RegistrationForm.html',
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dojo-mama/Views/_ModuleViewMixin'
], function(declare, lang, domAttr, on, xhr, template, _WidgetBase, _TemplatedMixin, _ModuleViewMixin) {
	return declare([_WidgetBase, _TemplatedMixin, _ModuleViewMixin], {

		'class': 'registrationFormView',
		parentView: '/',
		route: '/register',
		templateString: template,
		title: 'Register',

		postCreate: function() {
			this.inherited(arguments);
			on(this.registerButton, 'click', lang.hitch(this, this.register));
		},

		register: function() {
			domAttr.set(this.registerButton, 'disabled', 'disabled');
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
				}),
				lang.hitch(this, function(err) {
					domAttr.remove(this.registerButton, 'disabled');
					console.error(err);
				})
			);
		}

	});
});
