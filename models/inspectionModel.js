var mongoose = require('mongoose');
// var submissionDate = new mongoose.Schema({
//     submission_datetime : String
// });
var inspectionModel = new mongoose.Schema({
//total_rows: Number
// key:String
id : String,
value : {submission_datetime : String}
}, { strict: false});
inspectionModel.index({'value.submission_datetime' : 1});
module.exports = inspectionModel;