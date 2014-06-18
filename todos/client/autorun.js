Deps.autorun(function() {
  Meteor.subscribe('lists', Meteor.userId(), function(){
    var list = Lists.findOne({}, {sort: {name: 1}});
    if (list)
      Router.setList(list._id);
  });
});
