Locations = new MysqlSubscription('locations');
Channels = new MysqlSubscription('channels');

if (Meteor.isClient) {

  Template.allChannels.helpers({
    Channels: function () {
      return Channels.reactive();
    }
  });

  Template.allLocations.helpers({
    Locations: function () {
      return Locations.reactive();
    }
  });

  var edit = null;
  Template.location.events = {
    'change': function (event, template) {
      console.log('change');
      Meteor.call('updateLocationName', this.id, event.target.value);
    }
  };

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
    LiveMysql.LiveMysqlSelect.prototype.fetch = LiveMysql.LiveMysqlSelect.reactive;

    // code to run on server at startup
    var liveDb = new LiveMysql({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'root',
      database: 'your_db'
    });

    Meteor.publish('channels', function () {
      return liveDb.select(
        'select * from channel', [{
          table: 'channel'
        }]
      );
    });

    Meteor.publish('locations', function () {
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
    }, {
      url: 'locations/:0',
      httpMethod: 'put'
    });
  });

}
