
var request = require('request');
var async = require('async');
var _ = require('lodash');
var models = require('../models/index')();
var config = require("../config");
var moment = require('moment');
var mongoXlsx = require('mongo-xlsx');


models.prepareDatabase();
models.prepareDatabase3();
models.prepareDatabase4();
models.prepareDatabase5();
var timeStamp = Math.floor(Date.now());


async.waterfall([
        function (cb) {
           console.log("11111");
            cb(null, timeStamp);
        },



///////////////  EI data ////////////     
            function (timeStamp, cb) 
            {
                        console.log("2222");
                        var switchModel;
                        switchModel = models.switchModel();
                        switchModel.find({ 'key': 'true' }).exec(function (err, docs) 
                        {
                            console.log("33333");
                            if(err)
                            {
                                console.log("444444444");
                                cb(null, timeStamp);
                            }
                            else
                            {   
                                    console.log("55555555");
                                    var modelName = 'inspectionModel_' + docs[0].value;
                                    var inspectionModel = models.inspectionModel(modelName);

                                       var query = { 'value.state': { $ne: 0 },'value.submission_datetime': { $gte: '2018-09-12 10:25:25' }};
                                        // var query = { 'value.state': { $ne: 0 } };
                                        inspectionModel.find(query,'id value.inspection_id value.name value.inspection_with value.cycles value.users value.state value.discipline value.project value.vendor value.is_invalid value.submission_datetime')
                                        .sort({ 'value.submission_datetime': 'desc' })
                                        .exec(function (err, docs) 
                                        {
                                            // console.log(docs);
                                          var inspJson = _.map(docs, function (obj)
                                            {
                                                  var rowValue = obj.toObject()
                                                  // console.log(rowValue);
                                                  // process.exit()
                                                  return rowValue
                                            });

                                           var responseData = [];
                                            var count = 0;

                                            // console.log(typeof(inspJson));
                                            console.log((inspJson).length);
                                            // console.log(inspJson);
                                            // process.exit();

                                            async.each(inspJson, function (inspObj, outerCB) 
                                            {
                                                var obj = inspObj.value;
                                                 // console.log(obj);
                                                 //  process.exit()
                                                var allCycles = obj.cycles;
                                                var userCount = obj.users.length;
                                                if (obj.state == 1 || obj.state == 2)
                                                {
                                                    // console.log(obj.inspection_id);
                                                    if (userCount == 1) 
                                                    {
                                                        var user = obj.users[0];
                                                        var sortingCount = 0;
                                                        var cycleIterations = 0;
                                                        _.forEach(allCycles, function (cycle) {
                                                            cycleIterations++;
                                                            _.forEach(cycle[user].checkpoints, function (checkpoint) {
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
                                                                    checkpointData.vendor_name = obj.vendor.name;
                                                                    checkpointData.inspection_status = obj.state;
                                                                    checkpointData.date = cycle[user].auth_timestamp;
                                                                    checkpointData.submission_datetime = obj.submission_datetime;
                                                                    checkpointData.filter_submission_datetime = moment(obj.submission_datetime, 'YYYY-MM-DD HH:mm:ss').unix();
                                                                    sortingCount++;
                                                                    checkpointData.sortingFilter = sortingCount;
                                                                    responseData.push(checkpointData);
                                                            });
                                                            var checkpoint = cycle[user];
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
                                                                checkpointData.vendor_name = obj.vendor.name;
                                                                checkpointData.inspection_status = obj.state;
                                                                checkpointData.date = cycle[user].auth_timestamp;
                                                                checkpointData.submission_datetime = obj.submission_datetime;
                                                                checkpointData.filter_submission_datetime = moment(obj.submission_datetime, 'YYYY-MM-DD HH:mm:ss').unix();
                                                                sortingCount++;
                                                                checkpointData.sortingFilter = sortingCount;
                                                                responseData.push(checkpointData);
                                                        });
                                                    }
                                                    else if (userCount == 2)
                                                    {
                                                        var user1 = obj.users[0];
                                                        var user2 = obj.users[1];
                                                        var sortingCount = 0;
                                                        var cycleIterations = 0;
                                                        _.forEach(allCycles, function (cycle) 
                                                        {
                                                                    cycleIterations++;
                                                                        _.forEach(cycle[user1].checkpoints, function (checkpoint) 
                                                                        {
                                                                            var ins=cycle[user1];
                                                                            if (cycleIterations==1) 
                                                                            {
                                                                                var checkpointData = {};
                                                                                checkpointData.iterations = cycleIterations;
                                                                                checkpointData.checkpoint_name = checkpoint.checkpoint;
                                                                                checkpointData.response = checkpoint.response;
                                                                                checkpointData.remarks = checkpoint.remarks;
                                                                                checkpointData.authoriser_name = '---';
                                                                                checkpointData.inspector_name = _.get(cycle[user1], "inspector.first_name", '') + ' ' + _.get(cycle[user1], "inspector.last_name", '');
                                                                                checkpointData.inspection_id = obj.inspection_id;
                                                                                checkpointData.project = obj.project.name;
                                                                                // checkpointData.level1_location = obj.project.location.name;
                                                                                if((obj.project).hasOwnProperty('location'))
                                                                                {
                                                                                  checkpointData.level1_location = obj.project.location.name;
                                                                                }
                                                                                else
                                                                                {
                                                                                     checkpointData.level1_location = " ";  
                                                                                }
                                                                                checkpointData.discipline = _.get(obj, 'discipline.name', '');
                                                                                checkpointData.sub_discipline = _.get(obj, 'discipline.subgroup.name', '');
                                                                                checkpointData.checklist_name = obj.name;
                                                                                checkpointData.inspection_with = user2;
                                                                                if (checkpoint.checkpoint == undefined || checkpoint.checkpoint == "") {
                                                                                    checkpointData.forWhich = 'Checklist';
                                                                                } else {
                                                                                    checkpointData.forWhich = 'Checkpoint';
                                                                                }
                                                                                checkpointData.vendor_name = obj.vendor.name;
                                                                                checkpointData.auth_email = user2;
                                                                                checkpointData.inspection_status = obj.state;
                                                                                checkpointData.date = cycle[user1].auth_timestamp;
                                                                                checkpointData.submission_datetime = obj.submission_datetime;
                                                                                checkpointData.filter_submission_datetime = moment(obj.submission_datetime, 'YYYY-MM-DD HH:mm:ss').unix();
                                                                                sortingCount++;
                                                                                checkpointData.sortingFilter = sortingCount;
                                                                                responseData.push(checkpointData);
                                                                            }
                                                                            if(cycleIterations>1 )
                                                                            {
                                                                                var a= moment(ins.submission_timestamp,'YYYY-MM-DD HH:mm:ss').unix();
                                                                                var b= moment(allCycles[cycleIterations-2][user1].submission_timestamp, 'YYYY-MM-DD HH:mm:ss').unix();
                                                                                if(a!= b)
                                                                                {
                                                                                        var checkpointData = {};
                                                                                        checkpointData.iterations = cycleIterations;
                                                                                        checkpointData.checkpoint_name = checkpoint.checkpoint;
                                                                                        checkpointData.response = checkpoint.response;
                                                                                        checkpointData.remarks = checkpoint.remarks;
                                                                                        checkpointData.authoriser_name = '---';
                                                                                        checkpointData.inspector_name = _.get(cycle[user1], "inspector.first_name", '') + ' ' + _.get(cycle[user1], "inspector.last_name", '');
                                                                                        checkpointData.inspection_id = obj.inspection_id;
                                                                                        checkpointData.project = obj.project.name;
                                                                                        // checkpointData.level1_location = obj.project.location.name;
                                                                                        if((obj.project).hasOwnProperty('location'))
                                                                                        {
                                                                                          checkpointData.level1_location = obj.project.location.name;
                                                                                        }
                                                                                        else
                                                                                        {
                                                                                             checkpointData.level1_location = " ";  
                                                                                        }
                                                                                        checkpointData.discipline = _.get(obj, 'discipline.name', '');
                                                                                        checkpointData.sub_discipline = _.get(obj, 'discipline.subgroup.name', '');
                                                                                        checkpointData.checklist_name = obj.name;
                                                                                        checkpointData.inspection_with = user2;
                                                                                        if (checkpoint.checkpoint == undefined || checkpoint.checkpoint == "") {
                                                                                            checkpointData.forWhich = 'Checklist';
                                                                                        } else {
                                                                                            checkpointData.forWhich = 'Checkpoint';
                                                                                        }
                                                                                        checkpointData.vendor_name = obj.vendor.name;
                                                                                        checkpointData.auth_email = user2;
                                                                                        checkpointData.inspection_status = obj.state;
                                                                                        checkpointData.date = cycle[user1].auth_timestamp;
                                                                                        checkpointData.submission_datetime = obj.submission_datetime;
                                                                                        checkpointData.filter_submission_datetime = moment(obj.submission_datetime, 'YYYY-MM-DD HH:mm:ss').unix();
                                                                                        sortingCount++;
                                                                                        checkpointData.sortingFilter = sortingCount;
                                                                                        responseData.push(checkpointData);
                                                                                }
                                                                            }
                                                                        });
                                                                         // var ins=cycle[user1];
                                                                        var checkpoint = cycle[user1];
                                                                        if (checkpoint.hasOwnProperty('inspector')) {
                                                                                    if (cycleIterations==1) 
                                                                                    {
                                                                                        var checkpointData = {};
                                                                                        checkpointData.iterations = cycleIterations;
                                                                                        checkpointData.checkpoint_name = "Response to overall inspection";
                                                                                        checkpointData.response = cycle[user1].inspector.response;
                                                                                        checkpointData.remarks = cycle[user1].inspector.remarks;
                                                                                         checkpointData.authoriser_name = '---';
                                                                                        checkpointData.inspector_name = _.get(cycle[user1], "inspector.first_name", '') + ' ' + _.get(cycle[user1], "inspector.last_name", '');
                                                                                        checkpointData.inspection_id = obj.inspection_id;
                                                                                        checkpointData.project = obj.project.name;
                                                                                        // checkpointData.level1_location = obj.project.location.name;
                                                                                        if((obj.project).hasOwnProperty('location'))
                                                                                        {
                                                                                          checkpointData.level1_location = obj.project.location.name;
                                                                                        }
                                                                                        else
                                                                                        {
                                                                                             checkpointData.level1_location = " ";  
                                                                                        }
                                                                                        checkpointData.discipline = _.get(obj, 'discipline.name', '');
                                                                                        checkpointData.sub_discipline = _.get(obj, 'discipline.subgroup.name', '');
                                                                                        checkpointData.checklist_name = obj.name;
                                                                                        checkpointData.inspection_with = user2;
                                                                                        if (checkpoint.checkpoint == undefined || checkpoint.checkpoint == "") {
                                                                                            checkpointData.forWhich = 'Checklist';
                                                                                        } else {
                                                                                            checkpointData.forWhich = 'Checkpoint';
                                                                                        }
                                                                                        checkpointData.vendor_name = obj.vendor.name;
                                                                                        checkpointData.auth_email = user2;
                                                                                        checkpointData.inspection_status = obj.state;
                                                                                        checkpointData.date = cycle[user1].auth_timestamp;
                                                                                        checkpointData.submission_datetime = obj.submission_datetime;
                                                                                        checkpointData.filter_submission_datetime = moment(obj.submission_datetime, 'YYYY-MM-DD HH:mm:ss').unix();
                                                                                        sortingCount++;
                                                                                        checkpointData.sortingFilter = sortingCount;
                                                                                        responseData.push(checkpointData);
                                                                                    }
                                                                                    if (cycleIterations>1) 
                                                                                    {
                                                                                        var a= moment(checkpoint.submission_timestamp,'YYYY-MM-DD HH:mm:ss').unix();
                                                                                        var b= moment(allCycles[cycleIterations-2][user1].submission_timestamp, 'YYYY-MM-DD HH:mm:ss').unix();
                                                                                            if(a!= b)
                                                                                            {
                                                                                                    var checkpointData = {};
                                                                                                    checkpointData.iterations = cycleIterations;
                                                                                                    checkpointData.checkpoint_name = "Response to overall inspection";
                                                                                                    checkpointData.response = cycle[user1].inspector.response;
                                                                                                    checkpointData.remarks = cycle[user1].inspector.remarks;
                                                                                                    checkpointData.authoriser_name = '---';
                                                                                                    checkpointData.inspector_name = _.get(cycle[user1], "inspector.first_name", '') + ' ' + _.get(cycle[user1], "inspector.last_name", '');
                                                                                                    checkpointData.inspection_id = obj.inspection_id;
                                                                                                    checkpointData.project = obj.project.name;
                                                                                                    // checkpointData.level1_location = obj.project.location.name;
                                                                                                    if((obj.project).hasOwnProperty('location'))
                                                                                                    {
                                                                                                      checkpointData.level1_location = obj.project.location.name;
                                                                                                    }
                                                                                                    else
                                                                                                    {
                                                                                                         checkpointData.level1_location = " ";  
                                                                                                    }
                                                                                                    checkpointData.discipline = _.get(obj, 'discipline.name', '');
                                                                                                    checkpointData.sub_discipline = _.get(obj, 'discipline.subgroup.name', '');
                                                                                                    checkpointData.checklist_name = obj.name;
                                                                                                    checkpointData.inspection_with = user2;
                                                                                                    if (checkpoint.checkpoint == undefined || checkpoint.checkpoint == "") {
                                                                                                        checkpointData.forWhich = 'Checklist';
                                                                                                    } else {
                                                                                                        checkpointData.forWhich = 'Checkpoint';
                                                                                                    }
                                                                                                    checkpointData.vendor_name = obj.vendor.name;
                                                                                                    checkpointData.auth_email = user2;
                                                                                                    checkpointData.inspection_status = obj.state;
                                                                                                    checkpointData.date = cycle[user1].auth_timestamp;
                                                                                                    checkpointData.submission_datetime = obj.submission_datetime;
                                                                                                    checkpointData.filter_submission_datetime = moment(obj.submission_datetime, 'YYYY-MM-DD HH:mm:ss').unix();
                                                                                                    sortingCount++;
                                                                                                    checkpointData.sortingFilter = sortingCount;
                                                                                                    responseData.push(checkpointData);
                                                                                            }
                                                                                    }
                                                                        }
                                                                        if (cycle[user2] != undefined) {
                                                                        var checkpoint1 = cycle[user2];
                                                                        _.forEach(cycle[user2].checkpoints, function (checkpoint) {
                                                                           

                                                                               if(cycleIterations==1 && checkpoint1.auth.first_name!="")
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
                                                                                    // checkpointData.level1_location = obj.project.location.name;
                                                                                    if((obj.project).hasOwnProperty('location'))
                                                                                    {
                                                                                      checkpointData.level1_location = obj.project.location.name;
                                                                                    }
                                                                                    else
                                                                                    {
                                                                                         checkpointData.level1_location = " ";  
                                                                                    }
                                                                                    checkpointData.discipline = _.get(obj, 'discipline.name', '');
                                                                                    checkpointData.sub_discipline = _.get(obj, 'discipline.subgroup.name', '');
                                                                                    checkpointData.checklist_name = obj.name;
                                                                                    if (checkpoint.checkpoint == undefined || checkpoint.checkpoint == "") {
                                                                                        checkpointData.forWhich = 'Checklist';
                                                                                    } else {
                                                                                        checkpointData.forWhich = 'Checkpoint';
                                                                                    }
                                                                                    checkpointData.vendor_name = obj.vendor.name;
                                                                                    checkpointData.inspection_status = obj.state;
                                                                                    checkpointData.auth_email = user2;
                                                                                    checkpointData.date = cycle[user2].auth_timestamp;
                                                                                    checkpointData.submission_datetime = obj.submission_datetime;
                                                                                    checkpointData.filter_submission_datetime = moment(obj.submission_datetime, 'YYYY-MM-DD HH:mm:ss').unix();
                                                                                    sortingCount++;
                                                                                    checkpointData.sortingFilter = sortingCount;
                                                                                    responseData.push(checkpointData);
                                                                                }
                                                                                if(cycleIterations>1 )
                                                                                {
                                                                                        
                                                                                    var a= moment(checkpoint1.auth_timestamp,'YYYY-MM-DD HH:mm:ss').unix();
                                                                                    var b= moment(allCycles[cycleIterations-2][user2].auth_timestamp, 'YYYY-MM-DD HH:mm:ss').unix();
                                                                                    if(a!= b)
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
                                                                                        // checkpointData.level1_location = obj.project.location.name;
                                                                                        if((obj.project).hasOwnProperty('location'))
                                                                                        {
                                                                                          checkpointData.level1_location = obj.project.location.name;
                                                                                        }
                                                                                        else
                                                                                        {
                                                                                             checkpointData.level1_location = " ";  
                                                                                        }
                                                                                        checkpointData.discipline = _.get(obj, 'discipline.name', '');
                                                                                        checkpointData.sub_discipline = _.get(obj, 'discipline.subgroup.name', '');
                                                                                        checkpointData.checklist_name = obj.name;
                                                                                        if (checkpoint.checkpoint == undefined || checkpoint.checkpoint == "") {
                                                                                            checkpointData.forWhich = 'Checklist';
                                                                                        } else {
                                                                                            checkpointData.forWhich = 'Checkpoint';
                                                                                        }
                                                                                        checkpointData.vendor_name = obj.vendor.name;
                                                                                        checkpointData.inspection_status = obj.state;
                                                                                        checkpointData.auth_email = user2;
                                                                                        checkpointData.date = cycle[user2].auth_timestamp;
                                                                                        checkpointData.submission_datetime = obj.submission_datetime;
                                                                                        checkpointData.filter_submission_datetime = moment(obj.submission_datetime, 'YYYY-MM-DD HH:mm:ss').unix();
                                                                                        sortingCount++;
                                                                                        checkpointData.sortingFilter = sortingCount;
                                                                                        responseData.push(checkpointData);
                                                                                    }
                                                                                }   
                                                                        });
                                                                        var checkpoint1 = cycle[user2];
                                                                            if(cycleIterations==1 && checkpoint1.auth.first_name!="")
                                                                            {
                                                                                    var checkpointData = {};
                                                                                    checkpointData.iterations = cycleIterations;
                                                                                    checkpointData.checkpoint_name = "Response to overall inspection";
                                                                                    checkpointData.response = cycle[user2].auth.response;
                                                                                    checkpointData.remarks = cycle[user2].auth.remarks;
                                                                                    checkpointData.authoriser_name = _.get(cycle[user2].auth, "first_name", '') + ' ' + _.get(cycle[user2].auth, "last_name", '');
                                                                                    checkpointData.inspector_name = '---';
                                                                                    checkpointData.inspection_id = obj.inspection_id;
                                                                                    checkpointData.project = obj.project.name;
                                                                                    // checkpointData.level1_location = obj.project.location.name;
                                                                                    if((obj.project).hasOwnProperty('location'))
                                                                                    {
                                                                                      checkpointData.level1_location = obj.project.location.name;
                                                                                    }
                                                                                    else
                                                                                    {
                                                                                         checkpointData.level1_location = " ";  
                                                                                    }
                                                                                    checkpointData.discipline = _.get(obj, 'discipline.name', '');
                                                                                    checkpointData.sub_discipline = _.get(obj, 'discipline.subgroup.name', '');
                                                                                    checkpointData.checklist_name = obj.name;
                                                                                    if (checkpoint.checkpoint == undefined || checkpoint.checkpoint == "") {
                                                                                        checkpointData.forWhich = 'Checklist';
                                                                                    } else {
                                                                                        checkpointData.forWhich = 'Checkpoint';
                                                                                    }
                                                                                    checkpointData.vendor_name = obj.vendor.name;
                                                                                   checkpointData.inspection_status = obj.state; 
                                                                                    checkpointData.auth_email = user2;
                                                                                    checkpointData.date = cycle[user2].auth_timestamp;
                                                                                    checkpointData.submission_datetime = obj.submission_datetime;
                                                                                    checkpointData.filter_submission_datetime = moment(obj.submission_datetime, 'YYYY-MM-DD HH:mm:ss').unix();
                                                                                    sortingCount++;
                                                                                    checkpointData.sortingFilter = sortingCount;
                                                                                    responseData.push(checkpointData);
                                                                            }
                                                                            if(cycleIterations>1 )
                                                                            {  
                                                                                var a= moment(checkpoint1.auth_timestamp,'YYYY-MM-DD HH:mm:ss').unix();
                                                                                var b= moment(allCycles[cycleIterations-2][user2].auth_timestamp, 'YYYY-MM-DD HH:mm:ss').unix();
                                                                                if(a!= b)
                                                                                {
                                                                                     var checkpointData = {};
                                                                                    checkpointData.iterations = cycleIterations;
                                                                                    checkpointData.checkpoint_name = "Response to overall inspection";
                                                                                    checkpointData.response = cycle[user2].auth.response;
                                                                                    checkpointData.remarks = cycle[user2].auth.remarks;
                                                                                    checkpointData.authoriser_name = _.get(cycle[user2].auth, "first_name", '') + ' ' + _.get(cycle[user2].auth, "last_name", '');
                                                                                    checkpointData.inspector_name = '---';
                                                                                    checkpointData.inspection_id = obj.inspection_id;
                                                                                    checkpointData.project = obj.project.name;
                                                                                    // checkpointData.level1_location = obj.project.location.name;
                                                                                    if((obj.project).hasOwnProperty('location'))
                                                                                    {
                                                                                      checkpointData.level1_location = obj.project.location.name;
                                                                                    }
                                                                                    else
                                                                                    {
                                                                                         checkpointData.level1_location = " ";  
                                                                                    }
                                                                                    checkpointData.discipline = _.get(obj, 'discipline.name', '');
                                                                                    checkpointData.sub_discipline = _.get(obj, 'discipline.subgroup.name', '');
                                                                                    checkpointData.checklist_name = obj.name;
                                                                                    if (checkpoint.checkpoint == undefined || checkpoint.checkpoint == "") {
                                                                                        checkpointData.forWhich = 'Checklist';
                                                                                    } else {
                                                                                        checkpointData.forWhich = 'Checkpoint';
                                                                                    }
                                                                                   checkpointData.vendor_name = obj.vendor.name;
                                                                                   checkpointData.inspection_status = obj.state; 
                                                                                    checkpointData.auth_email = user2;
                                                                                    checkpointData.date = cycle[user2].auth_timestamp;
                                                                                    checkpointData.submission_datetime = obj.submission_datetime;
                                                                                    checkpointData.filter_submission_datetime = moment(obj.submission_datetime, 'YYYY-MM-DD HH:mm:ss').unix();
                                                                                    sortingCount++;
                                                                                    checkpointData.sortingFilter = sortingCount;
                                                                                    responseData.push(checkpointData);
                                                                                }
                                                                            }
                                                                    }
                                                        });
                                                    }
                                                }

                                                outerCB();

                                            }, function ()
                                            {
                                                // console.log("%%%%%5datta%%%%%%%%%%%");
                                                console.log((responseData).length);
                                              
                                                process.exit();
                                                var query = { $or: [{ 'response': 1 },{ 'response': 2 }, { 'response': 3 },{ 'response': 4 }] };
                                                var modelsName = 'checklistDetailedModel_' + timeStamp;
                                                    models.checklistDetailedModel().remove(query, function (err, results) 
                                                    {
                                                        if(err)
                                                       {
                                                        console.log("EI stopped");
                                                        console.log(err);
                                                       }
                                                       else
                                                       {
                                                            console.log("EI runned");
                                                            console.log(responseData.length);
                                                            // process.exit();
                                                            // responseData.length
                                                            async.each(responseData, function (item, outerEI) 
                                                            {
                                                                console.log("inside async");
                                                                // console.log(responseData);
                                                            // process.exit();
                                                                   var ei_data=item;
                                                                   // var ei_data={"firstName":"John", "lastName":"Doe"};
                                                                   // console.log(typeof(ei_data));
                                                                   // process.exit();
                                                                // if(ei_data!="")   
                                                                // {
                                                                //     console.log("inside async");
                                                                    models.checklistDetailedModel().create(ei_data, function (err, result) 
                                                                    {
                                                                        console.log("inside model");
                                                                        // process.exit();
                                                                         if(err)   
                                                                         {
                                                                            console.log("error");
                                                                            console.log(err);
                                                                         }
                                                                         else
                                                                         {
                                                                            console.log("success");
                                                                            // outerCB();
                                                                            // outerEI();
                                                                         }
                                                                     outerEI();   
                                                                    // console.log(results);
                                                                    // cb(null, timeStamp);
                                                                    })
                                                                // }

                                                            // outerEI();   
                                                            },function ()
                                                            {
                                                                console.log("completly ouuuuttt");
                                                                cb(null, timeStamp);
                                                            });

                                                       }
                                                    })
                                            });


                                          // console.log(inspJson);

                                        });
                          // next();
                           // cb(null);
                           
                            }

                        });
            }


    ], function (err, timeStamp) {
        if (err) 
        {
            console.log("not done");
             process.exit();
        }
        else
        {
            console.log("Complete all done");
             process.exit();
        }

    });













