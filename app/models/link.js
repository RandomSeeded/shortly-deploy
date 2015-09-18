var db = require('../config');
var mongoose = require('mongoose');
// var crypto = require('crypto');
 
 var urlSchema = mongoose.Schema({
    url: String,
    base_url: String,
    code: String,
    title: String,
    visits: {type: Number, default: 0},
    createdAt: {type: Date, default: Date.now},
    lastUpdatedAt: {type: Date, default: Date.now}
  });
 module.exports = mongoose.model('Link', urlSchema);

// var Link = db.Model.extend({
//   tableName: 'urls',
//   hasTimestamps: true,
//   defaults: {
//     visits: 0
//   },
//   initialize: function(){
//     this.on('creating', function(model, attrs, options){
//       var shasum = crypto.createHash('sha1');
//       shasum.update(model.get('url'));
//       model.set('code', shasum.digest('hex').slice(0, 5));
//     });
//   }
// });

// module.exports = Link;
