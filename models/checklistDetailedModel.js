var mongoose = require('mongoose');
var checklistDetailedModel = new mongoose.Schema({

    submission_datetime : String
}, { strict: false });
checklistDetailedModel.index({'submission_datetime' : 1});

module.exports = checklistDetailedModel;
