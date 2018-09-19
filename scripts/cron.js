var request = require('request');
var async = require('async');
var _ = require('lodash');
var models = require('../models/index')();
var config = require("../config");
var moment = require('moment');
models.prepareDatabase();
models.prepareDatabase3();
models.prepareDatabase4();
models.prepareDatabase5();


var timeStamp = Math.floor(Date.now());

var checkCouchbaseURL_ei = "http://203.197.8.217:4985/lnt_db/_design/";
var checkCouchbaseURL_cb = "http://203.197.8.217:4985/ltrcb_db/_design/";
var checkCouchbaseURL_sw = "http://203.197.8.217:4985/lnt_sw_db/_design/";
var checkCouchbaseURL_mn = "http://203.197.8.217:4985/lnt_mn_db/_design/";

async.eachSeries(config.couchbaseUrls, function (couchbaseUrl, callbackOut) {
    console.log(couchbaseUrl);

    async.waterfall([
        function (cb) {
            cb(null, timeStamp);
        },
        function (timeStamp, cb) 
        {
            var allInspectionsData = [];
            var queryTimeout = {
                uri: couchbaseUrl + 'get_allinspections/_view/all?stale=false',
                method: "GET",
                timeout: 200000,
                followRedirect: true,
                maxRedirects: 10
            }
            // request('http://108.161.136.204:4985/traq_new_db/_design/get_allinspections/_view/all?stale=false', function (error, response, body) {
            //  request('http://203.197.8.217:4985/ltrcb_db/_design/get_allinspections/_view/all?stale=false', function (error, response, body) {
            request(queryTimeout, function (error, response, body) {
                try {
                    if (error != null) {
                        if (error.code == 'ETIMEDOUT') {
                            // console.log(error.code);
                            callbackOut();
                        }
                    }
                    else {
                        var resData = JSON.parse(body);
                        // console.log(resData.total_rows);
                        var modelsName = 'inspectionModel_' + timeStamp;

                        async.eachSeries(resData.rows, function (arrObj, callback) {
                            arrObj.lastUpdated = new Date();
                            var inspection_filter = {};
                            var noOfUsers = arrObj.value.users.length;
                            if (arrObj.value.hasOwnProperty('inspection_with')) {
                                if (arrObj.value.inspection_with == "COMPLETED") {

                                    inspection_filter.key = "COMPLETED";
                                    if (noOfUsers == 2) {
                                        inspection_filter.value = arrObj.value.users[1];
                                    }
                                    else if (noOfUsers == 1) {
                                        inspection_filter.value = arrObj.value.users[0];
                                    }
                                }
                                else {
                                    inspection_filter.key = arrObj.value.inspection_with;
                                    inspection_filter.value = arrObj.value.inspection_with;
                                }
                            }
                            else {
                                inspection_filter.key = "NA";

                                if (noOfUsers == 2) {
                                    inspection_filter.value = arrObj.value.users[1];
                                }
                                else if (noOfUsers == 1) {
                                    inspection_filter.value = arrObj.value.users[0];
                                }
                            }
                            var cyclesCount = arrObj.value.cycles.length - 1;
                            if (arrObj.value.state == 2) {
                                if (noOfUsers == 2) {
                                    var userEmail = arrObj.value.users[1];
                                    
                                    arrObj.value.filter_response = arrObj.value.cycles[cyclesCount][userEmail].auth.response;
                                    if (arrObj.value.cycles[cyclesCount][userEmail] && arrObj.value.cycles[cyclesCount][userEmail].auth_timestamp) {

                                        var auth_timestamp = arrObj.value.cycles[cyclesCount][userEmail].auth_timestamp;
                                       // auth_timestamp = auth_timestamp.substring(0, 10);

                                        arrObj.value.filter_auth_start_time = moment(auth_timestamp, 'DD-MM-YYYY HH:mm:ss').unix();
                                        arrObj.value.filter_auth_end_time = moment(auth_timestamp, 'DD-MM-YYYY HH:mm:ss').unix();

                                    }

                                    // // console.log(moment(auth_timestamp,'DD-MM-YYYY').unix(),"   ",auth_timestamp);
                                }
                                else if (noOfUsers == 1) {
                                    var userEmail = arrObj.value.users[0];
                                    
                                    arrObj.value.filter_response = arrObj.value.cycles[cyclesCount][userEmail].auth.response;
                                    if (arrObj.value.cycles[cyclesCount][userEmail] && arrObj.value.cycles[cyclesCount][userEmail].auth_timestamp) {

                                        var auth_timestamp = arrObj.value.cycles[cyclesCount][userEmail].auth_timestamp;
                                      //  auth_timestamp = auth_timestamp.substring(0, 10);

                                        arrObj.value.filter_auth_start_time = moment(auth_timestamp, 'DD-MM-YYYY HH:mm:ss').unix();
                                        arrObj.value.filter_auth_end_time = moment(auth_timestamp, 'DD-MM-YYYY HH:mm:ss').unix();

                                    }

                                }
                            }
                            else if (arrObj.value.state == 1) {
                                if (noOfUsers == 2) {
                                    var userEmail = arrObj.value.users[0];
                                    var auth_timestamp = arrObj.value.cycles[0][userEmail].saved_timestamp;
                                  //  auth_timestamp = auth_timestamp.substring(0, 10);

                                    arrObj.value.filter_auth_start_time = moment(auth_timestamp, 'DD-MM-YYYY HH:mm:ss').unix();
                                    arrObj.value.filter_auth_end_time = moment(auth_timestamp, 'DD-MM-YYYY HH:mm:ss').unix();
                                }
                                else if (noOfUsers == 1) {
                                    var userEmail = arrObj.value.users[0];
                                    var auth_timestamp = arrObj.value.cycles[0][userEmail].saved_timestamp;
                                  //  auth_timestamp = auth_timestamp.substring(0, 10);

                                    arrObj.value.filter_auth_start_time = moment(auth_timestamp, 'DD-MM-YYYY HH:mm:ss').unix();
                                    arrObj.value.filter_auth_end_time = moment(auth_timestamp, 'DD-MM-YYYY HH:mm:ss').unix();
                                }
                            }
                            if (arrObj.value.hasOwnProperty('is_invalid')) {
                                arrObj.value.filter_is_invalid = arrObj.value.is_invalid;
                            }
                            else {
                                arrObj.value.filter_is_invalid = false;
                            }
                            arrObj.value.filter_submission_datetime = moment(arrObj.value.submission_datetime, 'YYYY-MM-DD HH:mm:ss').unix();

                            arrObj.value.inspection_with_filter = inspection_filter;
                            allInspectionsData.push(arrObj);
                            if (couchbaseUrl == checkCouchbaseURL_ei) {
                                //  models.prepareDatabase();
                                models.inspectionModel(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            // else if (couchbaseUrl == "http://203.197.8.217:4985/lnt_db/_design/") {
                            else if (couchbaseUrl == checkCouchbaseURL_cb) {
                                // models.prepareDatabase3();
                                models.inspectionModel3(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            // else if (couchbaseUrl == "http://203.197.8.217:4985/lnt_mn_db/_design/") {
                            else if (couchbaseUrl == checkCouchbaseURL_sw) {
                                //  models.prepareDatabase4();
                                models.inspectionModel4(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_mn) {
                                // else if (couchbaseUrl == "http://108.161.136.204:4985/demo_db/_design/") {
                                // models.prepareDatabase5();
                                models.inspectionModel5(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                           
                            else{
                                // console.log(couchbaseUrl + " URL does not match.");
                                cb(null, timeStamp, allInspectionsData);
                            }

                        }, function (err) {
                            if (err) {
                                // do something with the error
                                // console.log("Errrrr")
                                cb(null, timeStamp, allInspectionsData);
                            } else {
                                //do something else after .each gets executed
                                // var inspectionModel = models.inspectionModel();
                                //    // console.log('Adding Index');
                                //     inspectionModel.createIndex ( {'value.submission_datetime': 1 }, { collation: { locale: "fr" } } );
                                //   inspectionModel.index({'value.submission_datetime' : 1}, {unique : true});
                                // console.log("Inspections Inserted")
                                cb(null, timeStamp, allInspectionsData);
                                
                                //res.send("Inserted");
                            }
                        });
                    }
                } catch (ex) {
                    // console.log("exception", ex);
                    cb(null, timeStamp, allInspectionsData);
                }
            })
        },

  //////////////////////This function is for checklist data from inspections
        function (timeStamp, allInspectionsData, cb) {
            var responseData = [];
            // console.log(allInspectionsData.length);
            var count = 0;
            //    var allInspectionsSorted = _.orderBy(allInspectionsData, ['value.submission_datetimd'],['asc']);
            async.each(allInspectionsData, function (inspObj, outerCB) 
            {
                var obj = inspObj.value;
                var allCycles = obj.cycles;
                var userCount = obj.users.length;
                //  // console.log("users count : " + userCount);
                // // console.log("cycles count : " + allCycles.length);
                if (obj.state == 1 || obj.state == 2) {
                    // console.log("inside filter")
                    if (userCount == 1) {
                        var user = obj.users[0];
                        var sortingCount = 0;
                        var cycleIterations = 0;
                        _.forEach(allCycles, function (cycle) {
                            cycleIterations++;
                            _.forEach(cycle[user].checkpoints, function (checkpoint) {
                                if (checkpoint.response == 2 || checkpoint.response == 3) {
                                    var checkpointData = {};
                                    checkpointData.iterations = cycleIterations;
                                    checkpointData.checkpoint_name = checkpoint.checkpoint;
                                    checkpointData.response = checkpoint.response;
                                    checkpointData.remarks = checkpoint.remarks;
                                    checkpointData.authoriser_name = _.get(cycle[user].auth, "first_name", '') + ' ' + _.get(cycle[user].auth, "last_name", '');
                                    checkpointData.inspector_name = '---';
                                    checkpointData.inspection_id = obj.inspection_id;
                                    checkpointData.project = obj.project.name;
                                    checkpointData.level1_location = obj.project.location.name;
                                    checkpointData.discipline = _.get(obj, 'discipline.name', '');
                                    checkpointData.sub_discipline = _.get(obj, 'discipline.subgroup.name', '');
                                    checkpointData.checklist_name = obj.name;
                                    if (checkpoint.checkpoint == undefined || checkpoint.checkpoint == "") {
                                        checkpointData.forWhich = 'Checklist';
                                    } else {
                                        checkpointData.forWhich = 'Checkpoint';
                                    }
                                    checkpointData.inspection_status = obj.state;
                                    checkpointData.date = cycle[user].auth_timestamp;
                                    checkpointData.submission_datetime = obj.submission_datetime;
                                    checkpointData.filter_submission_datetime = moment(obj.submission_datetime, 'YYYY-MM-DD HH:mm:ss').unix();
                                    sortingCount++;
                                    checkpointData.sortingFilter = sortingCount;
                                    responseData.push(checkpointData);
                                    // console.log(count++);
                                }
                            });
                            var checkpoint = cycle[user];
                            if (checkpoint.auth.response == 2 || checkpoint.auth.response == 3) {
                                var checkpointData = {};
                                checkpointData.iterations = cycleIterations;
                                checkpointData.checkpoint_name = "Response to overall inspection";
                                checkpointData.response = cycle[user].auth.response;
                                checkpointData.remarks = cycle[user].auth.remarks;
                                checkpointData.authoriser_name = _.get(cycle[user].auth, "first_name", '') + ' ' + _.get(cycle[user].auth, "last_name", '');
                                checkpointData.inspector_name = '---';
                                checkpointData.inspection_id = obj.inspection_id;
                                checkpointData.project = obj.project.name;
                                checkpointData.level1_location = obj.project.location.name;
                                checkpointData.discipline = _.get(obj, 'discipline.name', '');
                                checkpointData.sub_discipline = _.get(obj, 'discipline.subgroup.name', '');
                                checkpointData.checklist_name = obj.name;
                                if (checkpoint.checkpoint == undefined || checkpoint.checkpoint == "") {
                                    checkpointData.forWhich = 'Checklist';
                                } else {
                                    checkpointData.forWhich = 'Checkpoint';
                                }
                                checkpointData.inspection_status = obj.state;
                                checkpointData.date = cycle[user].auth_timestamp;
                                checkpointData.submission_datetime = obj.submission_datetime;
                                checkpointData.filter_submission_datetime = moment(obj.submission_datetime, 'YYYY-MM-DD HH:mm:ss').unix();
                                sortingCount++;
                                checkpointData.sortingFilter = sortingCount;
                                responseData.push(checkpointData);
                                // console.log(count++);
                                // // console.log("Checkpoint Data --:: ");
                            }

                        });
                    }
                    else if (userCount == 2) {
                        var user1 = obj.users[0];
                        var sortingCount = 0;
                        var cycleIterations = 0;
                        _.forEach(allCycles, function (cycle) {
                            cycleIterations++;
                            _.forEach(cycle[user1].checkpoints, function (checkpoint) {
                                if (checkpoint.response == 2 || checkpoint.response == 3) {
                                    var checkpointData = {};
                                    checkpointData.iterations = cycleIterations;
                                    checkpointData.checkpoint_name = checkpoint.checkpoint;
                                    checkpointData.response = checkpoint.response;
                                    checkpointData.remarks = checkpoint.remarks;
                                    checkpointData.authoriser_name = '---';
                                    checkpointData.inspector_name = _.get(cycle[user1], "inspector.first_name", '') + ' ' + _.get(cycle[user1], "inspector.last_name", '');
                                    checkpointData.inspection_id = obj.inspection_id;
                                    checkpointData.project = obj.project.name;
                                    checkpointData.level1_location = obj.project.location.name;
                                    checkpointData.discipline = _.get(obj, 'discipline.name', '');
                                    checkpointData.sub_discipline = _.get(obj, 'discipline.subgroup.name', '');
                                    checkpointData.checklist_name = obj.name;
                                    if (checkpoint.checkpoint == undefined || checkpoint.checkpoint == "") {
                                        checkpointData.forWhich = 'Checklist';
                                    } else {
                                        checkpointData.forWhich = 'Checkpoint';
                                    }
                                    checkpointData.inspection_status = obj.state;
                                    checkpointData.date = cycle[user1].auth_timestamp;
                                    checkpointData.submission_datetime = obj.submission_datetime;
                                    checkpointData.filter_submission_datetime = moment(obj.submission_datetime, 'YYYY-MM-DD HH:mm:ss').unix();
                                    sortingCount++;
                                    checkpointData.sortingFilter = sortingCount;
                                    responseData.push(checkpointData);
                                    // console.log(count++);

                                }
                            });
                            var checkpoint = cycle[user1];
                            //// console.log("checklist data :  "+JSON.stringify(checkpoint));
                            if (checkpoint.hasOwnProperty('inspector')) {
                                if (checkpoint.inspector.response == 2 || checkpoint.inspector.response == 3) {
                                    var checkpointData = {};
                                    checkpointData.iterations = cycleIterations;
                                    checkpointData.checkpoint_name = "Response to overall inspection";
                                    checkpointData.response = cycle[user1].inspector.response;
                                    checkpointData.remarks = cycle[user1].inspector.remarks;
                                    checkpointData.authoriser_name = '---';
                                    checkpointData.inspector_name = _.get(cycle[user1], "inspector.first_name", '') + ' ' + _.get(cycle[user1], "inspector.last_name", '');
                                    checkpointData.inspection_id = obj.inspection_id;
                                    checkpointData.project = obj.project.name;
                                    checkpointData.level1_location = obj.project.location.name;
                                    checkpointData.discipline = _.get(obj, 'discipline.name', '');
                                    checkpointData.sub_discipline = _.get(obj, 'discipline.subgroup.name', '');
                                    checkpointData.checklist_name = obj.name;
                                    if (checkpoint.checkpoint == undefined || checkpoint.checkpoint == "") {
                                        checkpointData.forWhich = 'Checklist';
                                    } else {
                                        checkpointData.forWhich = 'Checkpoint';
                                    }
                                    checkpointData.inspection_status = obj.state;
                                    checkpointData.date = cycle[user1].auth_timestamp;
                                    checkpointData.submission_datetime = obj.submission_datetime;
                                    checkpointData.filter_submission_datetime = moment(obj.submission_datetime, 'YYYY-MM-DD HH:mm:ss').unix();
                                    sortingCount++;
                                    checkpointData.sortingFilter = sortingCount;
                                    responseData.push(checkpointData);
                                    // console.log(count++);
                                }
                            }


                        });

                        var user2 = obj.users[1];
                        var cycleIterations = 0;
                        _.forEach(allCycles, function (cycle) {
                            cycleIterations++;
                            if (cycle[user2] != undefined) {
                                _.forEach(cycle[user2].checkpoints, function (checkpoint) {
                                     if(cycle[user2].auth.first_name!="")
                                        {  
                                            if (checkpoint.response == 2 || checkpoint.response == 3)
                                            {
                                                var checkpointData = {};
                                                checkpointData.iterations = cycleIterations;
                                                checkpointData.checkpoint_name = checkpoint.checkpoint;
                                                checkpointData.response = checkpoint.response;
                                                checkpointData.remarks = checkpoint.remarks;
                                                checkpointData.authoriser_name = _.get(cycle[user2].auth, "first_name", '') + ' ' + _.get(cycle[user2].auth, "last_name", '');
                                                checkpointData.inspector_name = '---';
                                                checkpointData.inspection_id = obj.inspection_id;
                                                checkpointData.project = obj.project.name;
                                                checkpointData.level1_location = obj.project.location.name;
                                                checkpointData.discipline = _.get(obj, 'discipline.name', '');
                                                checkpointData.sub_discipline = _.get(obj, 'discipline.subgroup.name', '');
                                                checkpointData.checklist_name = obj.name;
                                                if (checkpoint.checkpoint == undefined || checkpoint.checkpoint == "") {
                                                    checkpointData.forWhich = 'Checklist';
                                                } else {
                                                    checkpointData.forWhich = 'Checkpoint';
                                                }
                                                checkpointData.inspection_status = obj.state;
                                                checkpointData.date = cycle[user2].auth_timestamp;
                                                checkpointData.submission_datetime = obj.submission_datetime;
                                                checkpointData.filter_submission_datetime = moment(obj.submission_datetime, 'YYYY-MM-DD HH:mm:ss').unix();
                                                sortingCount++;
                                                checkpointData.sortingFilter = sortingCount;
                                                responseData.push(checkpointData);
                                                // console.log(count++);
                                                // // console.log("Response Data --:: ");
                                            }
                                        }
                                });
                                // retrievChecklistDataFor1User(obj, cycle, user2).then(function (results) {
                                //   responseData.push(results);
                                var checkpoint = cycle[user2];
                                if (checkpoint.auth.response == 2 || checkpoint.auth.response == 3) {
                                    var checkpointData = {};
                                    checkpointData.iterations = cycleIterations;
                                    checkpointData.checkpoint_name = "Response to overall inspection";
                                    checkpointData.response = cycle[user2].auth.response;
                                    checkpointData.remarks = cycle[user2].auth.remarks;
                                    checkpointData.authoriser_name = _.get(cycle[user2].auth, "first_name", '') + ' ' + _.get(cycle[user2].auth, "last_name", '');
                                    checkpointData.inspector_name = '---';
                                    checkpointData.inspection_id = obj.inspection_id;
                                    checkpointData.project = obj.project.name;
                                    checkpointData.level1_location = obj.project.location.name;
                                    checkpointData.discipline = _.get(obj, 'discipline.name', '');
                                    checkpointData.sub_discipline = _.get(obj, 'discipline.subgroup.name', '');
                                    checkpointData.checklist_name = obj.name;
                                    if (checkpoint.checkpoint == undefined || checkpoint.checkpoint == "") {
                                        checkpointData.forWhich = 'Checklist';
                                    } else {
                                        checkpointData.forWhich = 'Checkpoint';
                                    }
                                    checkpointData.inspection_status = obj.state;
                                    checkpointData.date = cycle[user2].auth_timestamp;
                                    checkpointData.submission_datetime = obj.submission_datetime;
                                    checkpointData.filter_submission_datetime = moment(obj.submission_datetime, 'YYYY-MM-DD HH:mm:ss').unix();
                                    sortingCount++;
                                    checkpointData.sortingFilter = sortingCount;
                                    responseData.push(checkpointData);
                                    // console.log(count++);
                                    // // console.log("Checkpoint Data --:: ");
                                }
                            }
                        });
                    }
                }

                outerCB();

            }, function () {
                //res.json(responseData);
                // console.log("responseData " + responseData.length)
                var query = { $or: [{ 'response': 2 }, { 'response': 3 }] };
                var modelsName = 'checklistRowsModel_' + timeStamp;
                if (couchbaseUrl == checkCouchbaseURL_ei) {
                    //  models.prepareDatabase();
                    models.checklistRowsModel().remove(query, function (err, results) {
                        // console.log("Error msgs :  " + err);
                        // console.log("results : " + JSON.stringify(results));
                        models.checklistRowsModel().create(responseData, function (err, result) {
                            //callback();
                            // console.log("Inserted ::  ");
                            cb(null, timeStamp);
                            // cb(null, timeStamp, allInspectionsData);
                        });
                    })
                }
                else if (couchbaseUrl == checkCouchbaseURL_cb) {
                    //  models.prepareDatabase3();
                    models.checklistRowsModel3().remove(query, function (err, results) {
                        // console.log("Error msgs :  " + err);
                        // console.log("results : " + results);
                        models.checklistRowsModel3().create(responseData, function (err, result) {
                            // callback();
                            // console.log("Inserted ::  ");
                            cb(null, timeStamp);
                            // cb(null, timeStamp, allInspectionsData);
                        });
                    })
                }
                else if (couchbaseUrl == checkCouchbaseURL_sw) {
                    //   models.prepareDatabase4();
                    models.checklistRowsModel4().deleteMany(query, function (err, results) {
                        // console.log("Error msgs :  " + err);
                        // console.log("results : " + JSON.stringify(results));
                        models.checklistRowsModel4().create(responseData, function (err, result) {
                            // callback();
                            // console.log("Inserted ::  ");
                            cb(null, timeStamp);
                            // cb(null, timeStamp, allInspectionsData);
                        });
                    })
                }
                else if (couchbaseUrl == checkCouchbaseURL_mn) {
                    //   models.prepareDatabase5();
                    models.checklistRowsModel5().remove(query, function (err, results) {
                        // console.log("Error msgs :  " + err);
                        // console.log("results : " + results);
                        models.checklistRowsModel5().create(responseData, function (err, result) {
                            //callback();
                            // console.log("Inserted ::  ");
                            cb(null, timeStamp);
                            // cb(null, timeStamp, allInspectionsData);
                        });
                    })
                }
                else {
                    //callback();
                    cb(null, timeStamp);
                    // cb(null, timeStamp, allInspectionsData);
                }
            });
        },


        

        

        function (timeStamp, cb) {
            var queryTimeout = {
                uri: couchbaseUrl + 'get_allusers/_view/all?stale=false',
                method: "GET",
                timeout: 120000,
                followRedirect: true,
                maxRedirects: 10
            }
            request(queryTimeout, function (error, response, body) {
                try {
                    if (error != null) {
                        if (error.code == 'ETIMEDOUT') {
                            // console.log(error.code);
                            callbackOut();
                        }
                    }
                    else {
                        var resData = JSON.parse(body);
                        // console.log(resData.total_rows);
                        var modelsName = 'usersModel_' + timeStamp;
                        async.eachSeries(resData.rows, function (arrObj, callback) {
                            if (couchbaseUrl == checkCouchbaseURL_ei) {
                                //  models.prepareDatabase();
                                models.usersModel(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_cb) {
                                // models.prepareDatabase3();
                                models.usersModel3(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_sw) {
                                //  models.prepareDatabase4();
                                models.usersModel4(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_mn) {
                                //  models.prepareDatabase5();
                                models.usersModel5(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            
                            else{
                                callback();
                            }


                        }, function (err) {
                            if (err) {
                                // do something with the error
                                cb(null, timeStamp);
                            } else {
                                //do something else after .each gets executed
                                // res.send("Users Inserted");
                                cb(null, timeStamp);
                            }
                        });

                    }
                } catch (ex) {
                    //res.send("Error");
                    cb(null, timeStamp);
                }

            });

        },
        function (timeStamp, cb) {
            var queryTimeout = {
                uri: couchbaseUrl + 'get_user/_view/all?stale=false',
                method: "GET",
                timeout: 120000,
                followRedirect: true,
                maxRedirects: 10
            }
            request(queryTimeout, function (error, response, body) {

                try {
                    if (error != null) {
                        if (error.code == 'ETIMEDOUT') {
                            // console.log(error.code);
                            callbackOut();
                        }
                    }
                    else {
                        var resData = JSON.parse(body);
                        // console.log(resData.total_rows);
                        var modelsName = 'adminUsersModel_' + timeStamp;
                        async.eachSeries(resData.rows, function (arrObj, callback) {
                            if (couchbaseUrl == checkCouchbaseURL_ei) {
                              //  models.prepareDatabase();
                                models.adminUsersModel(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_cb) {
                                //  models.prepareDatabase3();
                                models.adminUsersModel3(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_sw) {
                                //   models.prepareDatabase4();
                                models.adminUsersModel4(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_mn) {
                                //   models.prepareDatabase5();
                                models.adminUsersModel5(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            
                            else{
                                callback();
                            }


                        }, function (err) {
                            if (err) {
                                // do something with the error
                                cb(null, timeStamp);
                            } else {
                                //do something else after .each gets executed
                                // res.send("Admin Users Inserted");
                                cb(null, timeStamp);
                            }
                        });
                    }
                } catch (ex) {
                    // res.send("Error");
                    cb(null, timeStamp);
                }
            });
        },
        function (timeStamp, cb) {
            var queryTimeout = {
                uri: couchbaseUrl + 'get_allChecklistsFalse/_view/all?stale=false',
                method: "GET",
                timeout: 120000,
                followRedirect: true,
                maxRedirects: 10
            }
            request(queryTimeout, function (error, response, body) {
                try {
                    if (error != null) {
                        if (error.code == 'ETIMEDOUT') {
                            // console.log(error.code);
                            callbackOut();
                        }
                    }
                    else {
                        var resData = JSON.parse(body);
                        // console.log(resData.total_rows);
                        var modelsName = 'checkListModel_' + timeStamp;
                        async.eachSeries(resData.rows, function (arrObj, callback) {
                            if (couchbaseUrl == checkCouchbaseURL_ei) {
                                //   models.prepareDatabase();
                                models.checkListModel(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_cb) {
                                //    models.prepareDatabase3();
                                models.checkListModel3(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_sw) {
                                //   models.prepareDatabase4();
                                models.checkListModel4(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_mn) {
                                //   models.prepareDatabase5();
                                models.checkListModel5(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                           
                            else{
                                callback();
                            }


                        }, function (err) {
                            if (err) {
                                // do something with the error
                                cb(null, timeStamp);
                            } else {
                                //do something else after .each gets executed
                                // res.send("Checklist Inserted");
                                cb(null, timeStamp);
                            }
                        });
                    }
                } catch (ex) {
                    // res.send("Error");
                    cb(null, timeStamp);
                }
            });
        },
        function (timeStamp, cb) {
            var queryTimeout = {
                uri: couchbaseUrl + 'get_allProjects/_view/all?stale=false',
                method: "GET",
                timeout: 120000,
                followRedirect: true,
                maxRedirects: 10
            }
            request(queryTimeout, function (error, response, body) {
                try {
                    if (error != null) {
                        if (error.code == 'ETIMEDOUT') {
                            // console.log(error.code);
                            callbackOut();
                        }
                    }
                    else {
                        var resData = JSON.parse(body);
                        // console.log(resData.total_rows);
                        var modelsName = 'projectsModel_' + timeStamp;
                        async.eachSeries(resData.rows, function (arrObj, callback) {
                            if (couchbaseUrl == checkCouchbaseURL_ei) {
                                //    models.prepareDatabase();
                                models.projectsModel(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_cb) {
                                //   models.prepareDatabase3();
                                models.projectsModel3(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_sw) {
                                //   models.prepareDatabase4();
                                models.projectsModel4(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_mn) {
                                //   models.prepareDatabase5();
                                models.projectsModel5(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            
                            else{
                                callback();
                            }


                        }, function (err) {
                            if (err) {
                                // do something with the error
                                cb(null, timeStamp);
                            } else {
                                //do something else after .each gets executed
                                //res.send("All Projects Inserted");
                                cb(null, timeStamp);
                            }
                        });
                    }
                } catch (ex) {
                    // res.send("Error");
                    cb(null, timeStamp);
                }
            });
        },
        function (timeStamp, cb) {
            var queryTimeout = {
                uri: couchbaseUrl + 'get_allDisciplines/_view/all?stale=false',
                method: "GET",
                timeout: 120000,
                followRedirect: true,
                maxRedirects: 10
            }
            request(queryTimeout, function (error, response, body) {
                try {
                    if (error != null) {
                        if (error.code == 'ETIMEDOUT') {
                            // console.log(error.code);
                            callbackOut();
                        }
                    }
                    else {
                        var resData = JSON.parse(body);
                        // console.log(resData.total_rows);
                        var modelsName = 'disciplinesModel_' + timeStamp;
                        async.eachSeries(resData.rows, function (arrObj, callback) {
                            if (couchbaseUrl == checkCouchbaseURL_ei) {
                                //    models.prepareDatabase();
                                models.disciplinesModel(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_cb) {
                                //   models.prepareDatabase3();
                                models.disciplinesModel3(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_sw) {
                                //   models.prepareDatabase4();
                                models.disciplinesModel4(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_mn) {
                                //    models.prepareDatabase5();
                                models.disciplinesModel5(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            
                            else{
                                callback();
                            }


                        }, function (err) {
                            if (err) {
                                // do something with the error
                                cb(null, timeStamp);
                            } else {
                                //do something else after .each gets executed
                                // res.send("All Disciplines Inserted");
                                cb(null, timeStamp);
                            }
                        });
                    }
                } catch (ex) {
                    // res.send("Error");
                    cb(null, timeStamp);
                }
            });
        },
        function (timeStamp, cb) {
            var queryTimeout = {
                uri: couchbaseUrl + 'get_allAuth/_view/all?stale=false',
                method: "GET",
                timeout: 120000,
                followRedirect: true,
                maxRedirects: 10
            }
            request(queryTimeout, function (error, response, body) {
                try {
                    if (error != null) {
                        if (error.code == 'ETIMEDOUT') {
                            // console.log(error.code);
                            callbackOut();
                        }
                    }
                    else {
                        var resData = JSON.parse(body);
                        // console.log(resData.total_rows);
                        var modelsName = 'authModel_' + timeStamp;
                        async.eachSeries(resData.rows, function (arrObj, callback) {
                            if (couchbaseUrl == checkCouchbaseURL_ei) {
                                //    models.prepareDatabase();
                                models.authModel(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_cb) {
                                //   models.prepareDatabase3();
                                models.authModel3(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_sw) {
                                //   models.prepareDatabase4();
                                models.authModel4(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_mn) {
                                //   models.prepareDatabase5();
                                models.authModel5(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                           
                            else{
                                callback();
                            }


                        }, function (err) {
                            if (err) {
                                // do something with the error
                                cb(null, timeStamp);
                            } else {
                                //do something else after .each gets executed
                                // res.send("Auth Inserted");
                                cb(null, timeStamp);
                            }
                        });
                    }
                } catch (ex) {
                    //  res.send("Error");
                    cb(null, timeStamp);
                }
            });
        },
        function (timeStamp, cb) {
            var queryTimeout = {
                uri: couchbaseUrl + 'get_allAuth/_view/all?stale=false',
                method: "GET",
                timeout: 120000,
                followRedirect: true,
                maxRedirects: 10
            }
            request(queryTimeout, function (error, response, body) {
                try {
                    if (error != null) {
                        if (error.code == 'ETIMEDOUT') {
                            // console.log(error.code);
                            callbackOut();
                        }
                    }
                    else {
                        var resData = JSON.parse(body);
                        // console.log(resData.total_rows);
                        var modelsName = 'inspectionStateModel_' + timeStamp;
                        async.eachSeries(resData.rows, function (arrObj, callback) {
                            if (couchbaseUrl == checkCouchbaseURL_ei) {
                                //  models.prepareDatabase();
                                models.inspectionStateModel(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_cb) {
                                //   models.prepareDatabase3();
                                models.inspectionStateModel3(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_sw) {
                                //  models.prepareDatabase4();
                                models.inspectionStateModel4(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_mn) {
                                //   models.prepareDatabase5();
                                models.inspectionStateModel5(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            
                            else{
                                callback();
                            }

                        }, function (err) {
                            if (err) {
                                // do something with the error
                                cb(null, timeStamp);
                            } else {
                                //do something else after .each gets executed
                                //res.send("Inspection State Inserted");
                                cb(null, timeStamp);
                            }
                        });
                    }
                } catch (ex) {
                    //res.send("Error");
                    cb(null, timeStamp);
                }
            });
        },
        // function (timeStamp, cb) {
        //     var queryTimeout = {
        //         uri: couchbaseUrl + 'get_allLogs/_view/all?stale=false',
        //         method: "GET",
        //         timeout: 120000,
        //         followRedirect: true,
        //         maxRedirects: 10
        //     }
        //     request(queryTimeout, function (error, response, body) {
        //         try {
        //             if (error != null) {
        //                 if (error.code == 'ETIMEDOUT') {
        //                     // console.log(error.code);
        //                     callbackOut();
        //                 }
        //             }
        //             else {
        //                 var resData = JSON.parse(body);
        //                 // console.log(resData.total_rows);
        //                 var modelsName = 'logsModel_' + timeStamp;
        //                 async.eachSeries(resData.rows, function (arrObj, callback) {
        //                     if (couchbaseUrl == checkCouchbaseURL_ei) {
        //                         //   models.prepareDatabase();
        //                         models.logsModel(modelsName).create(arrObj, function (err, result) {
        //                             callback();
        //                         });
        //                     }
        //                     else if (couchbaseUrl == checkCouchbaseURL_cb) {
        //                         //   models.prepareDatabase3();
        //                         models.logsModel3(modelsName).create(arrObj, function (err, result) {
        //                             callback();
        //                         });
        //                     }
        //                    else if (couchbaseUrl == checkCouchbaseURL_sw) {
        //                         //   models.prepareDatabase4();
        //                         models.logsModel4(modelsName).create(arrObj, function (err, result) {
        //                             callback();
        //                         });
        //                     }
        //                     else if (couchbaseUrl == checkCouchbaseURL_mn) {
        //                         //    models.prepareDatabase5();
        //                         models.logsModel5(modelsName).create(arrObj, function (err, result) {
        //                             callback();
        //                         });
        //                     }
                                // else{
                                //     callback();
                                // }

        //                 }, function (err) {
        //                     if (err) {
        //                         // do something with the error
        //                         cb(null, timeStamp);
        //                     } else {
        //                         //do something else after .each gets executed
        //                         // res.send("All Logs Inserted");
        //                         cb(null, timeStamp);
        //                     }
        //                 });
        //             }
        //         } catch (ex) {
        //             //res.send("Error");
        //             cb(null, timeStamp);
        //         }
        //     });
        // },
        function (timeStamp, cb) {
            var queryTimeout = {
                uri: couchbaseUrl + 'get_allDevices/_view/all?stale=false',
                method: "GET",
                timeout: 120000,
                followRedirect: true,
                maxRedirects: 10
            }
            request(queryTimeout, function (error, response, body) {
                try {
                    if (error != null) {
                        if (error.code == 'ETIMEDOUT') {
                            // console.log(error.code);
                            callbackOut();
                        }
                    }
                    else {
                        var resData = JSON.parse(body);
                        // console.log(resData.total_rows);
                        var modelsName = 'devicesModel_' + timeStamp;
                        async.eachSeries(resData.rows, function (arrObj, callback) {
                            arrObj.lastUpdated = new Date();
                            if (couchbaseUrl == checkCouchbaseURL_ei) {
                                //   models.prepareDatabase();
                                models.devicesModel(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_cb) {
                                //  models.prepareDatabase3();
                                models.devicesModel3(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_sw) {
                                //   models.prepareDatabase4();
                                models.devicesModel4(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_mn) {
                                //  models.prepareDatabase5();
                                models.devicesModel5(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            
                            else{
                                callback();
                            }

                        }, function (err) {
                            if (err) {
                                // do something with the error
                                cb(null, timeStamp);
                            } else {
                                //do something else after .each gets executed
                                //res.send("All Devices Inserted");
                                cb(null, timeStamp);
                            }
                        });
                    }
                } catch (ex) {
                    //res.send("Error");
                    cb(null, timeStamp);
                }
            });
        },
        // function (timeStamp, cb) {
        //     var queryTimeout = {
        //         uri: couchbaseUrl + 'get_allDevices/_view/all?stale=false',
        //         method: "GET",
        //         timeout: 120000,
        //         followRedirect: true,
        //         maxRedirects: 10
        //     }
        //     request(queryTimeout, function (error, response, body) {
        //         try {
        //             if (error != null) {
        //                 if (error.code == 'ETIMEDOUT') {
        //                     // console.log(error.code);
        //                     callbackOut();
        //                 }
        //             }
        //             else {
        //                 var resData = JSON.parse(body);
        //                 // console.log(resData.total_rows);
        //                 var modelsName = 'allInspectionsModel_' + timeStamp;
        //                 async.eachSeries(resData.rows, function (arrObj, callback) {
        //                     if (couchbaseUrl == checkCouchbaseURL_ei) {
        //                         //    models.prepareDatabase();
        //                         models.allInspectionsModel(modelsName).create(arrObj, function (err, result) {
        //                             callback();
        //                         });
        //                     }
        //                     else if (couchbaseUrl == checkCouchbaseURL_cb) {
        //                         //  models.prepareDatabase3();
        //                         models.allInspectionsModel3(modelsName).create(arrObj, function (err, result) {
        //                             callback();
        //                         });
        //                     }
        //                    else if (couchbaseUrl == checkCouchbaseURL_sw) {
        //                         //   models.prepareDatabase4();
        //                         models.allInspectionsModel4(modelsName).create(arrObj, function (err, result) {
        //                             callback();
        //                         });
        //                     }
        //                     else if (couchbaseUrl == checkCouchbaseURL_mn) {
        //                         //  models.prepareDatabase5();
        //                         models.allInspectionsModel5(modelsName).create(arrObj, function (err, result) {
        //                             callback();
        //                         });
        //                     }
                                // else{
                                //     callback();
                                // }

        //                 },
        //                  function (err) {
        //                     if (err) {
        //                         // do something with the error
        //                         cb(null, timeStamp);
        //                     } else {
        //                         //do something else after .each gets executed
        //                         // res.send("All Inspections Inserted");
        //                         cb(null, timeStamp);
        //                     }
        //                 });
        //             }
        //         } catch (ex) {
        //             // res.send("Error");
        //             cb(null, timeStamp);
        //         }
        //     });
        // },
        function (timeStamp, cb) {
            var queryTimeout = {
                uri: couchbaseUrl + 'get_allDevices/_view/all?stale=false',
                method: "GET",
                timeout: 120000,
                followRedirect: true,
                maxRedirects: 10
            }
            request(queryTimeout, function (error, response, body) {
                try {
                    if (error != null) {
                        if (error.code == 'ETIMEDOUT') {
                            // console.log(error.code);
                            callbackOut();
                        }
                    }
                    else {
                        var resData = JSON.parse(body);
                        // console.log(resData.total_rows);
                        var modelsName = 'fieldInspectionModel_' + timeStamp;
                        async.eachSeries(resData.rows, function (arrObj, callback) {
                            if (couchbaseUrl == checkCouchbaseURL_ei) {
                                //   models.prepareDatabase();
                                models.fieldsInspectionModel(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_cb) {
                                //   models.prepareDatabase3();
                                models.fieldsInspectionModel3(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_sw) {
                                //   models.prepareDatabase4();
                                models.fieldsInspectionModel4(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            else if (couchbaseUrl == checkCouchbaseURL_mn) {
                                //   models.prepareDatabase5();
                                models.fieldsInspectionModel5(modelsName).create(arrObj, function (err, result) {
                                    callback();
                                });
                            }
                            
                            else{
                                callback();
                            }

                        }, function (err) {
                            if (err) {
                                // do something with the error
                                cb(null, timeStamp);
                            } else {
                                //do something else after .each gets executed
                                // res.send("All Fields Inspection Inserted");
                                cb(null, timeStamp);
                            }
                        });
                    }
                } catch (ex) {
                    // res.send("Error");
                    cb(null, timeStamp);
                }
            });
        }

    ], function (err, timeStamp) {
        if (err) {
            // console.log(err);
        }
        else {
            var updateModel = { 'key': 'false' };
            var query = { 'key': 'true' };
            if (couchbaseUrl == checkCouchbaseURL_ei) {
                models.switchModel().findOneAndUpdate(query, updateModel, { upsert: false }, function (err, doc) {
                    if (err) {
                        // console.log(err);
                        callbackOut();
                    } else {
                        var switchModel = {
                            key: 'true',
                            value: timeStamp + ''
                        }


                        //  models.prepareDatabase();
                        models.switchModel().create(switchModel, function (err, doc) {
                            if (err) {
                                // console.log(err);
                            }
                            callbackOut();
                        });
                    }
                });
            }
            else if (couchbaseUrl == checkCouchbaseURL_cb) {
                models.switchModel3().findOneAndUpdate(query, updateModel, { upsert: false }, function (err, doc) {
                    if (err) {
                        // console.log(err);
                        callbackOut();
                    } else {
                        var switchModel = {
                            key: 'true',
                            value: timeStamp + ''
                        }
                        //  models.prepareDatabase3();
                        models.switchModel3().create(switchModel, function (err, doc) {
                            if (err) {
                                // console.log(err);
                            }
                            callbackOut();
                        });
                    }
                });
            }
            else if (couchbaseUrl == checkCouchbaseURL_sw) {
                models.switchModel4().findOneAndUpdate(query, updateModel, { upsert: false }, function (err, doc) {
                    if (err) {
                        // console.log(err);
                        callbackOut();
                    } else {
                        var switchModel = {
                            key: 'true',
                            value: timeStamp + ''
                        }
                        //  models.prepareDatabase4();
                        models.switchModel4().create(switchModel, function (err, doc) {
                            if (err) {
                                // console.log(err);
                            }
                            callbackOut();
                        });
                    }
                });
            }
            else if (couchbaseUrl == checkCouchbaseURL_mn) {
                models.switchModel5().findOneAndUpdate(query, updateModel, { upsert: false }, function (err, doc) {
                    if (err) {
                        // console.log(err);
                        callbackOut();
                    } else {
                        var switchModel = {
                            key: 'true',
                            value: timeStamp + ''
                        }
                        //    models.prepareDatabase5();
                        models.switchModel5().create(switchModel, function (err, doc) {
                            if (err) {
                                // console.log(err);
                            }
                            callbackOut();
                        });
                    }
                });
            }
           
            else{
                callbackOut();
            }

        }

    });
}, function (err) {
    // console.log('all done!!!');
    process.exit();
});
// request('http://108.161.136.204:4985/traq_new_db/_design/get_allinspections/_view/all?stale=false', function (error, response, body) {
//     // console.log('error:', error); // Print the error if one occurred
//     // console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
//     // console.log('body:', body); // Print the HTML for the Google homepage.
// });

