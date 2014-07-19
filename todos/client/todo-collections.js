// Client-side JavaScript, bundled and sent to client.

// Define Minimongo collections to match server/publish.js.
Lists = new Meteor.Collection("lists");

var listsHandle = Meteor.subscribe('lists', function () {
  if (!Session.get('list_id')) {
    var list = Lists.findOne({}, {sort: {name: 1}});
    if (list)
      Session.set('list_id', list._id);
  }
});

var okCancelEvents = function (selector, callbacks) {
  var ok = callbacks.ok || function () {};
  var cancel = callbacks.cancel || function () {};

  var events = {};
  events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
    function (evt) {
      if (evt.type === "keydown" && evt.which === 27) {
        // escape = cancel
        cancel.call(this, evt);

      } else if (evt.type === "keyup" && evt.which === 13 ||
                 evt.type === "focusout") {
        // blur/return/enter = ok/submit if non-empty
        var value = String(evt.target.value || "");
        if (value)
          ok.call(this, value, evt);
        else
          cancel.call(this, evt);
      }
    };

  return events;
};

Template.todos_collection.loading = function () {
  return !listsHandle.ready();
};

Template.todos_collection.lists = function () {
  return Lists.find({}, {sort: {name: 1}});
};

Template.todos_collection.events({
	'mousedown .list-group-item': function (evt) {
		Session.set('list_id', this._id);
	},
	'mousedown .destroy': function (evt) {
		Lists.remove(this._id);
		var list = Lists.findOne({}, {sort: {name: 1}});
		if(list)
			Session.set('list_id', this._id);
	},
	'mousedown #btn-add-group': function (evt) {
		var groupName = $('#add-group .modal-body .form-control').val();
		var userId = Meteor.userId() || 'public';
		var id = Lists.insert({name: groupName, owner: userId});
		Session.set('list_id', id);
		// close modal
		$('#add-group .modal-footer button:first-child').click();
		// clean input value
		$('#add-group .modal-body .form-control').val("");
		evt.target.value = "";
	}
});

Template.todos_collection.events(okCancelEvents(
	'#add-group .modal-body .form-control',
	{
		ok: function (groupName) {
			var userId = Meteor.userId() || 'public';
			var id = Lists.insert({name: groupName, owner: userId});
			Session.set('list_id', id);
			// close modal
			$('#add-group .modal-footer button:first-child').click();
			// clean input value
			$('#add-group .modal-body .form-control').val("");
		}
	}
));

Template.todos_collection.selected = function () {
  return Session.equals('list_id', this._id) ? 'active' : '';
};

// Router = new TodosRouter;

// Template.lists.events({
//   'mousedown .list': function (evt) { // select list
//     Router.setList(this._id);
//   },
//   'click .destroy': function (evt) {
//     Lists.remove(this._id);
//     var list = Lists.findOne({}, {sort: {name: 1}});
//     if (list)
//       Router.setList(list._id);
//   },
//   'click .list': function (evt) {
//     // prevent clicks on <a> from refreshing the page.
//     evt.preventDefault();
//   },
//   'dblclick .list': function (evt, tmpl) { // start editing list name
//     Session.set('editing_listname', this._id);
//     Deps.flush(); // force DOM redraw, so we can focus the edit field
//     activateInput(tmpl.find("#list-name-input"));
//   }
// });

// // Attach events to keydown, keyup, and blur on "New list" input box.
// Template.lists.events(okCancelEvents(
//   '#new-list',
//   {
//     ok: function (text, evt) {
//       var id = Lists.insert({name: text, owner: Meteor.userId()});
//       Router.setList(id);
//       evt.target.value = "";
//     }
//   }));

// Template.lists.events(okCancelEvents(
//   '#list-name-input',
//   {
//     ok: function (value) {
//       Lists.update(this._id, {$set: {name: value}});
//       Session.set('editing_listname', null);
//     },
//     cancel: function () {
//       Session.set('editing_listname', null);
//     }
//   }));

// Template.lists.selected = function () {
//   return Session.equals('list_id', this._id) ? 'selected' : '';
// };

// Template.lists.name_class = function () {
//   return this.name ? '' : 'empty';
// };

// Template.lists.editing = function () {
//   return Session.equals('editing_listname', this._id);
// };