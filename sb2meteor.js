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
    this.editing = new ReactiveVar('');
  };

  Template.location.helpers({
    editing: function () {
      return Template.instance().editing.get();
    }
  });

  Template.location.events = {
    'blur': function (event, template) {
      template.editing.set('');
      //console.log(event.target);
      //console.log('current value blur' + event.target.value);
      EventStream.emit('blur', this.id, event.target.value);
    },
    'keypress': function (event, template) {
      if (!template.editing.get()) {
        template.editing.set('*');
        EventStream.emit('editing', this.id);
      }
      //console.log(event.target);
      //console.log('current value keypress' + event.target.value);
    }
  };

  EventStream.on('blur', function (id, value) {
    Meteor.call('updateLocationName', id, value);
  });

  //EventStream

  Meteor.methods({
    'updateLocationName': function (id, value) {
      console.log('updateLocationName');
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
