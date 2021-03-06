

var todosHandle = null;
// Always be subscribed to the todos for the selected list.
Deps.autorun(function () {
  var list_id = Session.get('list_id');
  if (list_id)
    todosHandle = Meteor.subscribe('todos', list_id);
  else
    todosHandle = null;
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

var activateInput = function (input) {
    input.focus();
    input.select();
};

Template.todos_item.loading = function () {
	return todosHandle && !todosHandle.ready();
};

Template.todos_item.todos = function () {
    // Determine which todos to display in main pane,
    // selected based on list_id and tag_filter.

    var list_id = Session.get('list_id');
    if (!list_id)
    return [];

    var sel = {list_id: list_id};
    var tag_filter = Session.get('tag_filter');
    if (tag_filter && tag_filter != 'All items')
      sel.tags = tag_filter;

    var todo_items = Todos.find(sel, {sort: {timestamp: -1}});
    todo_items = todo_items.map(formatTags);
    return todo_items;
};

Template.todos_item.editing = function() {
    return Session.equals('editing_itemname', this._id);
};

function formatTags(todo) {
    todo.tags = todo.tags.map(function(tag){
        return {'tag': tag, 'todo_id':todo._id};
    });
    return todo;
};

Template.todos_item.events({
    'mousedown .destroy': function (evt) {
        Todos.remove(this._id);
    },
    'click #btn-new-tag': function (evt) {
        Session.set('editing_addtag', this._id)
    },
    'dblclick .list-group-item': function (evt, template) {
        Session.set('editing_itemname', this._id);
        Deps.flush(); // force DOM redraw, so we can focus the edit field
        activateInput(template.find("#list-group-item-input"));
    },
    'mousedown #btn-add-item': function (evt) {
        var itemName = $('#add-item .modal-body .form-control').val();
        var tag = Session.get('tag_filter');
        if (tag === "All items")
            tag = null;
        Todos.insert({
            text: itemName,
            list_id: Session.get('list_id'),
            done: false,
            timestamp: (new Date()).getTime(),
            tags: tag ? [tag] : []
        });
        // close modal
        $('#add-item .modal-footer button:first-child').click();
        // clean input value
        $('#add-item .modal-body .form-control').val("");
        evt.target.value = "";
    },
    'click #btn-add-tag': function (evt) {
        var value = $('#add-tag .modal-body .form-control').val();
        console.log('value', value);
        var id= Session.get('editing_addtag');
        Todos.update(id, {$addToSet: {tags: value}});
        Session.set('editing_addtag', null);
        // close modal
        $('#add-tag .modal-footer button:first-child').click();
        // clean input value
        $('#add-tag .modal-body .form-control').val("");
        evt.target.value = "";
    },
    'click #tag_filter .btn': function (evt) {
        Session.set('tag_filter', this.tag);
    },
    'click .tag-destroy': function (evt) {
        var tag = this.tag;
        var id = this.todo_id;

        // evt.target.parentNode.style.opacity = 0;
        // wait for CSS animation to finish
        Meteor.setTimeout(function () {
            Todos.update({_id: id}, {$pull: {tags: tag}});
        }, 300);
    },
    'click .check': function (evt) {
        Todos.update(this._id, {$set: {done: !this.done}});
    }
});

Template.todos_item.events(okCancelEvents(
  '#add-item .modal-body .form-control',
  {
    ok: function (itemName, template) {
        var tag = Session.get('tag_filter');
        if (tag === "All items")
            tag = null;
        Todos.insert({
            text: itemName,
            list_id: Session.get('list_id'),
            done: false,
            timestamp: (new Date()).getTime(),
            tags: tag ? [tag] : []
        });
        // close modal
        $('#add-item .modal-footer button:first-child').click();
        // clean input value
        $('#add-item .modal-body .form-control').val("");
    }
  }
));

Template.todos_item.events(okCancelEvents(
  '#add-tag .modal-body .form-control',
  {
    ok: function (value, template) {
        var id= Session.get('editing_addtag');
        Todos.update(id, {$addToSet: {tags: value}});
        Session.set('editing_addtag', null);
        // close modal
        $('#add-tag .modal-footer button:first-child').click();
        // clean input value
        $('#add-tag .modal-body .form-control').val("");
    }
  }
));

Template.todos_item.events(okCancelEvents(
    '#list-group-item-input',
    {
        ok: function (itemName) {
            Todos.update(this._id, {$set: {text: itemName}});
            Session.set('editing_itemname', null);
        },
        cancel: function () {
            Session.set('editing_itemname', null);
        }
    }
));

// ////////// Tag Filter //////////

// Pick out the unique tags from all todos in current list.
Template.todos_item.filter_tags = function () {
    var tag_infos = [];
    var total_count = 0;

    Todos.find({list_id: Session.get('list_id')}).forEach(function (todo) {
        _.each(todo.tags, function (tag) {
            var tag_info = _.find(tag_infos, function (x) { return x.tag === tag; });
            if (! tag_info)
                tag_infos.push({tag: tag, count: 1});
            else
                tag_info.count++;
        });
        total_count++;
    });

    tag_infos = _.sortBy(tag_infos, function (x) { return x.tag; });
    tag_infos.unshift({tag: 'All items', count: total_count});
    return tag_infos;
};

Template.todos_item.filter_selected = function () {
    return Session.equals('tag_filter', this.tag) ? 'btn-primary' : '';
};


// ////////// Todos //////////

// Template.todos.loading = function () {
//   return todosHandle && !todosHandle.ready();
// };

// Template.todos.any_list_selected = function () {
//   return !Session.equals('list_id', null);
// };

// Template.todos.events(okCancelEvents(
//   '#new-todo',
//   {
//     ok: function (text, evt) {
//       var tag = Session.get('tag_filter');
//       Todos.insert({
//         text: text,
//         list_id: Session.get('list_id'),
//         done: false,
//         timestamp: (new Date()).getTime(),
//         tags: tag ? [tag] : []
//       });
//       evt.target.value = '';
//     }
//   }));

// Template.todos.todos = function () {
//   // Determine which todos to display in main pane,
//   // selected based on list_id and tag_filter.

//   var list_id = Session.get('list_id');
//   if (!list_id)
//     return {};

//   var sel = {list_id: list_id};
//   var tag_filter = Session.get('tag_filter');
//   if (tag_filter)
//     sel.tags = tag_filter;

//   return Todos.find(sel, {sort: {timestamp: 1}});
// };

// Template.todo_item.tag_objs = function () {
//   var todo_id = this._id;
//   return _.map(this.tags || [], function (tag) {
//     return {todo_id: todo_id, tag: tag};
//   });
// };

// Template.todo_item.done_class = function () {
//   return this.done ? 'done' : '';
// };

// Template.todo_item.editing = function () {
//   return Session.equals('editing_itemname', this._id);
// };

// Template.todo_item.adding_tag = function () {
//   return Session.equals('editing_addtag', this._id);
// };

// Template.todo_item.events({
//   'click .check': function () {
//     Todos.update(this._id, {$set: {done: !this.done}});
//   },

//   'click .destroy': function () {
//     Todos.remove(this._id);
//   },

//   'click .addtag': function (evt, tmpl) {
//     Session.set('editing_addtag', this._id);
//     Deps.flush(); // update DOM before focus
//     activateInput(tmpl.find("#edittag-input"));
//   },

//   'dblclick .display .todo-text': function (evt, tmpl) {
//     Session.set('editing_itemname', this._id);
//     Deps.flush(); // update DOM before focus
//     activateInput(tmpl.find("#todo-input"));
//   },

//   'click .remove': function (evt) {
//     var tag = this.tag;
//     var id = this.todo_id;

//     evt.target.parentNode.style.opacity = 0;
//     // wait for CSS animation to finish
//     Meteor.setTimeout(function () {
//       Todos.update({_id: id}, {$pull: {tags: tag}});
//     }, 300);
//   }
// });

// Template.todo_item.events(okCancelEvents(
//   '#todo-input',
//   {
//     ok: function (value) {
//       Todos.update(this._id, {$set: {text: value}});
//       Session.set('editing_itemname', null);
//     },
//     cancel: function () {
//       Session.set('editing_itemname', null);
//     }
//   }));

// Template.todo_item.events(okCancelEvents(
//   '#edittag-input',
//   {
//     ok: function (value) {
//       Todos.update(this._id, {$addToSet: {tags: value}});
//       Session.set('editing_addtag', null);
//     },
//     cancel: function () {
//       Session.set('editing_addtag', null);
//     }
//   }));
