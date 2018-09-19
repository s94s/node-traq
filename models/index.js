/**
 *
 *
 **/

var mongoose = require('mongoose'),
// _ = require('lodash'),
 config = require("../config"),
// dashboard = require("./dashboard"),
inspectionModel = require("./inspectionModel");
paginateModel = require("./paginateModel");
usersModel = require("./usersModel");
adminUsersModel = require("./adminUsersModel");
checkListModel = require("./checkListModel");
projectsModel = require("./projectsModel");
disciplinesModel = require("./disciplinesModel");
authModel = require("./authModel");
inspectionStateModel = require("./inspectionStateModel");
logsModel = require("./logsModel");
devicesModel = require("./devicesModel");
allInspectionsModel = require("./allInspectionsModel");
fieldsInspectionModel = require("./fieldsInspectionModel");
inspectionModelQA = require("./inspectionModelQA");
inspectionModel2 = require("./inspectionModel2");
switchModel = require("./switchModel");
checklistRowsModel = require("./checklistRowsModel");
checklistDetailedModel = require("./checklistDetailedModel");

var options = {
replset: {
   auto_reconnect: true,
   poolSize: 10,
   socketOptions: {
       keepAlive: 120
   } 
},
server: {
   auto_reconnect: true,
   reconnectTries: Number.MAX_VALUE,
   poolSize: 10,
   socketOptions: {
       keepAlive: 120
   }
}
};


var connections = {};

module.exports = function () {
var mongoModels = {};

// mongoModels.dashboard = function () {
//    return connections['default'].model("dashboard", dashboard, "dashboard");
// };

mongoModels.inspectionModel = function (modelName) {
    return connections['default'].model("inspectionModel", inspectionModel, modelName);
 };
 mongoModels.inspectionModel3 = function (modelName) {
    return connections['default2'].model("inspectionModel", inspectionModel, modelName);
 };
 mongoModels.inspectionModel4 = function (modelName) {
    return connections['default3'].model("inspectionModel", inspectionModel, modelName);
 };
 mongoModels.inspectionModel5 = function (modelName) {
    return connections['default4'].model("inspectionModel", inspectionModel, modelName);
 };

mongoModels.inspectionModel2 = function(){
    return connections['default'].model("inspectionModel2", inspectionModel2, "inspectionModel2"); 
}
 mongoModels.inspectionModelQA = function (qAModelName) {
    return connections['default1'].model("inspectionModelQA", inspectionModelQA, qAModelName);
 };

 mongoModels.usersModel = function (userModelName) {
    return connections['default'].model("usersModel", usersModel, userModelName);
 };
 mongoModels.usersModel3 = function (userModelName) {
    return connections['default2'].model("usersModel", usersModel, userModelName);
 };
 mongoModels.usersModel4 = function (userModelName) {
    return connections['default3'].model("usersModel", usersModel, userModelName);
 };
 mongoModels.usersModel5 = function (userModelName) {
    return connections['default4'].model("usersModel", usersModel, userModelName);
 };

 mongoModels.adminUsersModel = function (adminModelName) {
    return connections['default'].model("adminUsersModel", adminUsersModel, adminModelName);
 };
 mongoModels.adminUsersModel3 = function (adminModelName) {
    return connections['default2'].model("adminUsersModel", adminUsersModel, adminModelName);
 };
 mongoModels.adminUsersModel4 = function (adminModelName) {
    return connections['default3'].model("adminUsersModel", adminUsersModel, adminModelName);
 };
 mongoModels.adminUsersModel5 = function (adminModelName) {
    return connections['default4'].model("adminUsersModel", adminUsersModel, adminModelName);
 };

 mongoModels.checkListModel = function (checkModelName) {
    return connections['default'].model("checkListModel", checkListModel, checkModelName);
 };
 mongoModels.checkListModel3 = function (checkModelName) {
    return connections['default2'].model("checkListModel", checkListModel, checkModelName);
 };
 mongoModels.checkListModel4 = function (checkModelName) {
    return connections['default3'].model("checkListModel", checkListModel, checkModelName);
 };
 mongoModels.checkListModel5 = function (checkModelName) {
    return connections['default4'].model("checkListModel", checkListModel, checkModelName);
 };

 mongoModels.projectsModel = function (projectModelName) {
    return connections['default'].model("projectsModel", projectsModel, projectModelName);
 };
 mongoModels.projectsModel3 = function (projectModelName) {
    return connections['default2'].model("projectsModel", projectsModel, projectModelName);
 };
 mongoModels.projectsModel4 = function (projectModelName) {
    return connections['default3'].model("projectsModel", projectsModel, projectModelName);
 };
 mongoModels.projectsModel5 = function (projectModelName) {
    return connections['default4'].model("projectsModel", projectsModel, projectModelName);
 };
 
 mongoModels.disciplinesModel = function (disciplinesModelName) {
    return connections['default'].model("disciplinesModel", disciplinesModel, disciplinesModelName);
 };
 mongoModels.disciplinesModel3 = function (disciplinesModelName) {
    return connections['default2'].model("disciplinesModel", disciplinesModel, disciplinesModelName);
 };
 mongoModels.disciplinesModel4 = function (disciplinesModelName) {
    return connections['default3'].model("disciplinesModel", disciplinesModel, disciplinesModelName);
 };
 mongoModels.disciplinesModel5 = function (disciplinesModelName) {
    return connections['default4'].model("disciplinesModel", disciplinesModel, disciplinesModelName);
 };

 mongoModels.authModel = function (authModelName) {
    return connections['default'].model("authModel", authModel, authModelName);
 };
 mongoModels.authModel3 = function (authModelName) {
    return connections['default2'].model("authModel", authModel, authModelName);
 };
 mongoModels.authModel4 = function (authModelName) {
    return connections['default3'].model("authModel", authModel, authModelName);
 };
 mongoModels.authModel5 = function (authModelName) {
    return connections['default4'].model("authModel", authModel, authModelName);
 };

 mongoModels.inspectionStateModel = function (inspectionStateModelName) {
    return connections['default'].model("inspectionStateModel", inspectionStateModel,inspectionStateModelName);
 };
 mongoModels.inspectionStateModel3 = function (inspectionStateModelName) {
    return connections['default2'].model("inspectionStateModel", inspectionStateModel,inspectionStateModelName);
 };
 mongoModels.inspectionStateModel4 = function (inspectionStateModelName) {
    return connections['default3'].model("inspectionStateModel", inspectionStateModel,inspectionStateModelName);
 };
 mongoModels.inspectionStateModel5 = function (inspectionStateModelName) {
    return connections['default4'].model("inspectionStateModel", inspectionStateModel,inspectionStateModelName);
 };

 mongoModels.logsModel = function (logsModelName) {
    return connections['default'].model("logsModel", logsModel, logsModelName);
 };
 mongoModels.logsModel3 = function (logsModelName) {
    return connections['default2'].model("logsModel", logsModel, logsModelName);
 };
 mongoModels.logsModel4 = function (logsModelName) {
    return connections['default3'].model("logsModel", logsModel, logsModelName);
 };
 mongoModels.logsModel5 = function (logsModelName) {
    return connections['default4'].model("logsModel", logsModel, logsModelName);
 };
 
 mongoModels.devicesModel = function (devicesModelName) {
    return connections['default'].model("devicesModel", devicesModel, devicesModelName);
 };
 mongoModels.devicesModel3 = function (devicesModelName) {
    return connections['default2'].model("devicesModel", devicesModel, devicesModelName);
 };
 mongoModels.devicesModel4 = function (devicesModelName) {
    return connections['default3'].model("devicesModel", devicesModel, devicesModelName);
 };
 mongoModels.devicesModel5 = function (devicesModelName) {
    return connections['default4'].model("devicesModel", devicesModel, devicesModelName);
 };

 mongoModels.allInspectionsModel = function (allInspectionsModelName) {
    return connections['default'].model("allInspectionsModel", allInspectionsModel, allInspectionsModelName);
 };
 mongoModels.allInspectionsModel3 = function (allInspectionsModelName) {
    return connections['default2'].model("allInspectionsModel", allInspectionsModel, allInspectionsModelName);
 };
 mongoModels.allInspectionsModel4 = function (allInspectionsModelName) {
    return connections['default3'].model("allInspectionsModel", allInspectionsModel, allInspectionsModelName);
 };
 mongoModels.allInspectionsModel5 = function (allInspectionsModelName) {
    return connections['default4'].model("allInspectionsModel", allInspectionsModel, allInspectionsModelName);
 };

 mongoModels.fieldsInspectionModel = function (fieldsInspectionModelName) {
    return connections['default'].model("fieldsInspectionModel", fieldsInspectionModel, fieldsInspectionModelName);
 };
 mongoModels.fieldsInspectionModel3 = function (fieldsInspectionModelName) {
    return connections['default2'].model("fieldsInspectionModel", fieldsInspectionModel, fieldsInspectionModelName);
 };
 mongoModels.fieldsInspectionModel4 = function (fieldsInspectionModelName) {
    return connections['default3'].model("fieldsInspectionModel", fieldsInspectionModel, fieldsInspectionModelName);
 };
 mongoModels.fieldsInspectionModel5 = function (fieldsInspectionModelName) {
    return connections['default4'].model("fieldsInspectionModel", fieldsInspectionModel, fieldsInspectionModelName);
 };

mongoModels.paginateModel = function () {
    return connections['default'].model("paginateModel", paginateModel, "paginateModel");
 };

 mongoModels.switchModel = function () {
    console.log("iiii");
    return connections['default'].model("switchModel", switchModel, "switchModel");
 };
 mongoModels.switchModel3 = function () {
    console.log("qqqq");
    return connections['default2'].model("switchModel", switchModel, "switchModel");
 };
 mongoModels.switchModel4 = function () {
    console.log("3333");
    return connections['default3'].model("switchModel", switchModel, "switchModel");
 };
 mongoModels.switchModel5 = function () {
    console.log("6666");
    return connections['default4'].model("switchModel", switchModel, "switchModel");
 };

mongoModels.checklistRowsModel = function () {
    return connections['default'].model("checklistRowsModel", checklistRowsModel, "checklistRowsModel");
 };
 mongoModels.checklistRowsModel3 = function () {
    return connections['default2'].model("checklistRowsModel", checklistRowsModel, "checklistRowsModel");
 };
 mongoModels.checklistRowsModel4 = function () {
    return connections['default3'].model("checklistRowsModel", checklistRowsModel, "checklistRowsModel");
 };
 mongoModels.checklistRowsModel5 = function () {
    return connections['default4'].model("checklistRowsModel", checklistRowsModel, "checklistRowsModel");
 };

 mongoModels.checklistDetailedModel = function () {
    return connections['default'].model("checklistDetailedModel", checklistDetailedModel, "checklistDetailedModel");
 };
 mongoModels.checklistDetailedModel3 = function () {
    return connections['default2'].model("checklistDetailedModel", checklistDetailedModel, "checklistDetailedModel");
 };
 mongoModels.checklistDetailedModel4 = function () {
    return connections['default3'].model("checklistDetailedModel", checklistDetailedModel, "checklistDetailedModel");
 };
 mongoModels.checklistDetailedModel5 = function () {
    return connections['default4'].model("checklistDetailedModel", checklistDetailedModel, "checklistDetailedModel");
 };
 mongoModels.checklistDetailedModel6 = function () {
    return connections['default5'].model("checklistDetailedModel", checklistDetailedModel, "checklistDetailedModel");
 };

mongoModels.prepareDatabase = function () {
   var MONGOconnection = config['mongodb']['url_ei'];
   //options.user=config['mongodb']['user']
   //options.pass=config['mongodb']['password']
   console.log(MONGOconnection);
   connections['default'] = mongoose.createConnection(MONGOconnection);
   connections['default'].on('error', console.error.bind(console, "Database connection error"));
   connections['default'].on('disconnected', console.error.bind(console, "Mongoose default connection for database disconnected"));
};

//mongoose.set('debug', true);

// mongoModels.prepareDatabase2 = function () {
//     var MONGOconnection = config['mongodb']['url2'];
//     //options.user=config['mongodb']['user']
//     //options.pass=config['mongodb']['password']
//      console.log(MONGOconnection);
//     connections['default1'] = mongoose.createConnection(MONGOconnection);
//     connections['default1'].on('error', console.error.bind(console, "Database connection error"));
//     connections['default1'].on('disconnected', console.error.bind(console, "Mongoose default connection for database disconnected"));
//  };
 mongoModels.prepareDatabase3 = function () {
    var MONGOconnection = config['mongodb']['url_cb'];
    //options.user=config['mongodb']['user']
    //options.pass=config['mongodb']['password']
    console.log(MONGOconnection);
    connections['default2'] = mongoose.createConnection(MONGOconnection);
    connections['default2'].on('error', console.error.bind(console, "Database connection error"));
    connections['default2'].on('disconnected', console.error.bind(console, "Mongoose default connection for database disconnected"));
 };

 mongoModels.prepareDatabase4 = function () {
    var MONGOconnection = config['mongodb']['url_sw'];
    //options.user=config['mongodb']['user']
    //options.pass=config['mongodb']['password']
    console.log(MONGOconnection);
    connections['default3'] = mongoose.createConnection(MONGOconnection);
    connections['default3'].on('error', console.error.bind(console, "Database connection error"));
    connections['default3'].on('disconnected', console.error.bind(console, "Mongoose default connection for database disconnected"));
 };

 mongoModels.prepareDatabase5 = function () {
    var MONGOconnection = config['mongodb']['url_mn'];
    //options.user=config['mongodb']['user']
    //options.pass=config['mongodb']['password']
    console.log(MONGOconnection);
    connections['default4'] = mongoose.createConnection(MONGOconnection);
    connections['default4'].on('error', console.error.bind(console, "Database connection error"));
    connections['default4'].on('disconnected', console.error.bind(console, "Mongoose default connection for database disconnected"));
 };
return mongoModels;
};