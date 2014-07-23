Template.navigator.login = function() {
	return !!Meteor.userId();
};

Template.navigator.username = function() {
	return Meteor.user() ? Meteor.user().username : null;
};

Template.navigator.signinError = function() {
	return Session.get('error_message_signin');
};

Template.navigator.events({
	'click #btn-signout': function(evt) {
		Meteor.logout();
	},
	'click #btn-signin': function(evt, template) {
		var username = template.$('.form-control')[0].value;
		var password = template.$('.form-control')[1].value;
		Meteor.loginWithPassword(username, password, function(error){
			if(error)
				Session.set('error_message_signin', 'Incorrect username or password.'); 
				// console.log('username or password error.');
			else 
				Session.set('error_message_signin', null);
		});
	}
});
