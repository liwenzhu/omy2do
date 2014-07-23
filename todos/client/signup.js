
Template.signup.userNotLogin = function() {
	return Meteor.userId() === null;
};

Template.signup.error_message = function() {
	return Session.get('error_message');
};

Template.signup.events({
	'mousedown .form-signin .btn-success': function(evt, template) {
		var email = template.$('.form-control')[0].value;
		var password = template.$('.form-control')[1].value;
		var user = {
			email: email,
			username: email,
			password: password,
			profile: {}	
		}
		Accounts.createUser(user, function(error){
			if(error) {
				console.log('error:', error);
				Session.set('error_message', 'Email is already exist.');
				Deps.flush();
			} else {
				Session.set('error_message', null);
			}
		});
	}
});