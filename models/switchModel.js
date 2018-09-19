var mongoose = require('mongoose');

var switchModel = new mongoose.Schema({
    key : String,
    value : String

}, { strict: false });
module.exports = switchModel;