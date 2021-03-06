// ID of currently selected list
Session.setDefault('list_id', null);

// Name of currently selected tag for filtering
Session.setDefault('tag_filter', 'All items');

// When adding tag to a todo, ID of the todo
Session.setDefault('editing_addtag', null);

// When editing a list name, ID of the list
Session.setDefault('editing_listname', null);

// When editing todo text, ID of the todo
Session.setDefault('editing_itemname', null);

Session.setDefault('error_message', null);

Session.set('error_message_signin', null);

Deps.autorun(function(){
	var list = Lists.findOne({}, {sort: {name: 1}});
    if (list)
      Session.set('list_id', list._id);
});