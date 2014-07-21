
Template.signup.userNotLogin = function() {
	return Meteor.userId() === null;
}