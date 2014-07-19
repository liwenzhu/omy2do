// Lists -- {name: String}
Lists = new Meteor.Collection("lists");

// Publish complete set of lists to all clients.
Meteor.publish('lists', function () {
  var owner = !!this.userId ? this.userId : 'public';
  var lists = Lists.find({owner: owner});
  if (lists.count()===0 && owner === 'public') {
  	initDatabase();
  	lists = Lists.find({owner: owner});
  }
  return lists;
});

Lists.allow({
	insert: function (userId, doc) {
		return doc.owner === userId || doc.owner === 'public';
	},
	update: function (userId, doc) {
		return doc.owner === userId || doc.owner === 'public';
	},
	remove: function (userId, doc) {
		return doc.owner === userId || doc.owner === 'public';
	},
	fetch: ['owner']
});

// Todos -- {text: String,
//           done: Boolean,
//           tags: [String, ...],
//           list_id: String,
//           timestamp: Number,
//			 owner: String}
Todos = new Meteor.Collection("todos");

// Publish all items for requested list_id.
Meteor.publish('todos', function (list_id) {
  check(list_id, String);
  return Todos.find({list_id: list_id});
});

Todos.allow({
	insert: function (userId, doc) {
		var list = Lists.find({owner:userId, list_id: doc.list_id});
		return !!list;
	},
	update: function (userId, doc) {
		var list = Lists.find({owner:userId, list_id: doc.list_id});
		return !!list;
	},
	remove: function (userId, doc) {
		var list = Lists.find({owner:userId, list_id: doc.list_id});
		return !!list;
	},
	fetch: ['owner']
});

function initDatabase() {
	console.log('init database');
	var data = [
      {name: "Meteor Principles",
       contents: [
         ["Data on the Wire", "Simplicity", "Better UX", "Fun"],
         ["One Language", "Simplicity", "Fun"],
         ["Database Everywhere", "Simplicity"],
         ["Latency Compensation", "Better UX"],
         ["Full Stack Reactivity", "Better UX", "Fun"],
         ["Embrace the Ecosystem", "Fun"],
         ["Simplicity Equals Productivity", "Simplicity", "Fun"]
       ]
      },
      {name: "Languages",
       contents: [
         ["Lisp", "GC"],
         ["C", "Linked"],
         ["C++", "Objects", "Linked"],
         ["Python", "GC", "Objects"],
         ["Ruby", "GC", "Objects"],
         ["JavaScript", "GC", "Objects"],
         ["Scala", "GC", "Objects"],
         ["Erlang", "GC"],
         ["6502 Assembly", "Linked"]
         ]
      },
      {name: "Favorite Scientists",
       contents: [
         ["Ada Lovelace", "Computer Science"],
         ["Grace Hopper", "Computer Science"],
         ["Marie Curie", "Physics", "Chemistry"],
         ["Carl Friedrich Gauss", "Math", "Physics"],
         ["Nikola Tesla", "Physics"],
         ["Claude Shannon", "Math", "Computer Science"]
       ]
      }
    ];

    var timestamp = (new Date()).getTime();
    for (var i = 0; i < data.length; i++) {
      var list_id = Lists.insert({name: data[i].name, owner: 'public'});
      for (var j = 0; j < data[i].contents.length; j++) {
        var info = data[i].contents[j];
        Todos.insert({list_id: list_id,
                      text: info[0],
                      timestamp: timestamp,
                      tags: info.slice(1)});
        timestamp += 1; // ensure unique timestamp.
      }
    }
}