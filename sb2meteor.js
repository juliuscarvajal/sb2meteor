Locations = new MysqlSubscription('allLocations');
Channels = new MysqlSubscription('allChannels');
EventStream = new Meteor.Stream('events');

if (Meteor.isClient) {

  Template.channels.helpers({
    Channels: function () {
      return Channels.reactive();
    }
  });

  Template.locations.helpers({
    Locations: function () {
      return Locations.reactive();
    }
  });

  Template.location.created = function () {
    this.editing = new ReactiveVar;
    this.editing.set('');
  };

  Template.location.helpers({
    editing: function () {
      return Template.instance().editing.get();
    }
  });

  var edit = null;
  Template.location.events = {
    'input': function (event, template) {
      edit = template;
      Streamy.broadcast('editing', {
        data: ''
      });
    },
    'change': function (event, template) {
      template.editing.set('');
      console.log('change');
      Meteor.call('updateLocationName', this.id, event.target.value);
    }
  };

  Streamy.on('editing', function (data) {
    //data.editing.set('Editing');
    if (edit) {
      edit.editing.set('Editing');
      console.log('editing');
    }
  });

  /*
  EventStream.on('editing', function (id) {
    if (currentTemplate && currentTemplate.editing.get() === '') {
      console.log('editing');
      currentTemplate.editing.set('Editing');
    }
  });
  */

  Meteor.methods({
    'updateLocationName': function (id, value) {
      var selection = Locations.filter(function (sel) {
        return sel.id === id;
      });

      selection.location = value;

      Locations.changed();
    }
  });
};

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    var liveDb = new LiveMysql({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'root',
      database: 'switchboard_2_api_poc'
    });

    Meteor.publish('allChannels', function () {
      return liveDb.select(
        'select * from channel', [{
          table: 'channel'
        }]
      );
    });

    Meteor.publish('allLocations', function () {
      return liveDb.select(
        'select * from location', [{
          table: 'location'
        }])
    });

    Meteor.methods({
      'updateLocationName': function (id, value) {
        var result = liveDb.db.query(
          'update location set location = ? where id = ?;', [value, id]
        );
      }
    });
  });

}
