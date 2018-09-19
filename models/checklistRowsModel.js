var mongoose = require('mongoose');
var checklistRowsModel = new mongoose.Schema({

    submission_datetime : String
}, { strict: false });
checklistRowsModel.index({'submission_datetime' : 1});

module.exports = checklistRowsModel;