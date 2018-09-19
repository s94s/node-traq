var mongoose         = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
 
var schema = new mongoose.Schema({ /* schema definition */ }, { strict: false });
schema.plugin(mongoosePaginate);
 
var Model = mongoose.model('paginateModel',  schema); // Model.paginate() 


//module.exports = schema;