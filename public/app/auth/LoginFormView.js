define(['dojo/_base/declare',
		'dojo/_base/lang',
		"dojo/_base/window",
		'dojo/dom-attr',
		'dojo/dom-class',
		'dojo/dom-construct',
		'dojo/request/xhr',
 		"dojox/mobile/SimpleDialog",
		"dojox/mobile/ProgressIndicator",
		'dojox/mobile/Button',
		'dojox/mobile/TextBox',
		'dojo-mama/util/toaster',
		'dojo-mama/views/BaseView',
		'app/util/Select'
], function(declare, lang, win, domAttr, domClass, domConstruct, xhr, SimpleDialog, ProgressIndicator, Button, TextBox,
	toaster, BaseView, Select)
{
	return declare([BaseView], {
		'class': 'loginFormView',
		parentView: '/',
		route: '/login',
		title: 'Login',

		buildRendering: function() {
			// var piIns = ProgressIndicator.getInstance();
			// var showProgInd = function(simpleDlg){
			// 	piIns.stop();
			// 	simpleDlg.hide();
			// }
			// var hideProgInd = function(simpleDlg){
			// 	piIns.stop();
			// 	simpleDlg.hide();
			// }

			var dlg = new SimpleDialog();
			win.body().appendChild(dlg.domNode);
			var titleBox = domConstruct.create("div",
			                                 {class: "mblSimpleDialogText",
			                                 innerHTML: "User Login"},
			                                 dlg.domNode);
			var credentialsBox = domConstruct.create("div",
			                                 {class: "mblSimpleDialogText"},
			                                 dlg.domNode);
			var buttonsBox = domConstruct.create("div",
			                                 {class: "mblSimpleDialogText"},
			                                 dlg.domNode);

			// var piBox = domConstruct.create("div",
			//                                  {class: "mblSimpleDialogText"},
			//                                  dlg.domNode);
			// piBox.appendChild(piIns.domNode);
			var userInput = new TextBox({class: "mblSimpleDialogInput",
										 lowercase: true,
										 trim: true,
										 placeHolder: "E-mail address"})
			var passwordInput = new TextBox({class: "mblSimpleDialogInput",
										 placeHolder: "Password"})
			var cancelBtn = new Button({class: "mblSimpleDialogButton2l mblRedButton",
			                          innerHTML: "Cancel"});
			var loginBtn = new Button({class: "mblSimpleDialogButton2r mblBlueButton",
			                          innerHTML: "Login"});
			cancelBtn.connect(loginBtn.domNode, "click",
			                 function(e){ dlg.hide(); });
			loginBtn.connect(loginBtn.domNode, "click",
			                 function(e){ alert("Log me in!"); });
			userInput.placeAt(credentialsBox);
			passwordInput.placeAt(credentialsBox);
			cancelBtn.placeAt(buttonsBox);
			loginBtn.placeAt(buttonsBox);
			dlg.show();
			// piIns.start();

			// setTimeout(function(){
			   
			//   hideProgIndDlg(dlg);
			// }, 0);
		},
		submit: function() {

		},
	});


});
