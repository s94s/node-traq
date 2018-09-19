
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

                                        // var query = { 'value.state': { $ne: 0 },'value.submission_datetime': { $gte: '2018-09-12 10:25:25' } };
                                        var query = { 'value.state': { $ne: 0 }};
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

                                           // var responseData = [];
                                            var count = 0;

                                            // console.log(typeof(inspJson));
                                            console.log((inspJson).length);
                                            // console.log(inspJson);
                                            // process.exit();

                                            async.each(inspJson, function (inspObj, outerCB) 
                                            {
                                                console.log("19___11");
                                                var responseData = [];
                                                var obj = inspObj.value;

                                            async.waterfall([ 
                                                // console.log("19___22");
                                                function(cb1)
                                                {
                                                    console.log("19___33");
                                                        var allCycles = obj.cycles;
                                                        var userCount = obj.users.length;
                                                        if (obj.state == 1 || obj.state == 2)
                                                        {
                                                            console.log(obj.inspection_id);
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
                                                            // callback (null);
                                                            cb1(null,responseData);
                                                        }
                                                        

                                                },
                                                function(responseData,cb1)
                                                            {
                                                                console.log("aqaq");
                                                                console.log(responseData.length);
                                                                models.checklistDetailedModel().create(responseData, function (err, result)
                                                                {
                                                                    console.log("vvvvv");
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
                                                                         // process.exit();
                                                                       cb1(null,responseData);  
                                                                })
                                                                               
                                                            }
                                               

                                                ], function (error, success) {
                                            if (error) { console.log('Something is wrong!'); }
                                            else{console.log('Done!')}
                                            // return alert('Done!');
                                                 });
                                                // process.exit();
                                                outerCB();

                                             });

                                        });
                           
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













