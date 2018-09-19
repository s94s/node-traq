var express = require('express');
var router = express.Router();
var request = require('request');
var models = require('../models/index')();
var ne = require('node-each');
var async = require('async');
var _ = require('lodash');
var fs = require('fs');
var moment = require('moment');

models.prepareDatabase();
models.prepareDatabase3();
models.prepareDatabase4();
models.prepareDatabase5();


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/api/createInspectionMongo/', function (req, res, next) {

  var options = {
    debug: true
  };

  request('http://108.161.136.204:4985/traq_new_db/_design/get_allinspections/_view/all?stale=false', function (error, response, body) {
    //  request('http://203.197.8.217:4985/ltrcb_db/_design/get_allinspections/_view/all?stale=false', function (error, response, body) {
    try {

      // console.log('error:', error); // Print the error if one occurred
      //console.log('statusCode:', response, response.statusCode); // Print the response status code if a response was received
      // console.log('body:', body); // Print the HTML for the Google homepage.
      var resData = JSON.parse(body);
      console.log(resData.rows.length);

      // for(var i=0;i<resData.rows.length;i++)
      // {
      //   console.log("Hello.... ",i);
      //   models.traqModel().create(resData.rows[i], function(err, result){

      //   //   res.json(result);
      //    });
      // }

      //     ne.each(resData.rows,function(data,i){
      //       console.log(data);
      //       models.traqModel().create(data, function(err, result){

      //         //      res.json(result);
      //             });
      //     },options).then(function(debug){
      //       console.log('Finished',debug);
      //     });


      // for(obj in resData.rows){
      //   console.log(resData.rows[obj]);
      //   models.traqModel().create(resData.rows[obj], function(err, result){

      //     //                  // res.json(result);
      //                    });
      // }

      async.each(resData.rows, function (arrObj, callback) {
        arrObj.lastUpdated = new Date();
        models.inspectionModel().create(arrObj, function (err, result) {
        });
        callback();
      }, function (err) {
        if (err) {
          // do something with the error
        } else {
          //do something else after .each gets executed
          res.send("Inserted");
        }
      });
    } catch (ex) {
      res.send("Error");
    }
  })
});

router.get('/api/createInspectionMongoWithFilters', function (req, res, next) {

  request('http://108.161.136.204:4985/traq_new_db/_design/get_allinspections/_view/all?stale=false', function (error, response, body) {
    //request('http://203.197.8.217:4985/ltrcb_db/_design/get_allinspections/_view/all?stale=false', function (error, response, body) {
    try {

      var resData = JSON.parse(body);
      console.log(resData.rows.length);

      var timeStamp = Math.floor(Date.now());
      var modelsName = 'inspectionModel' + timeStamp;
      async.each(resData.rows, function (arrObj, callback) {
        arrObj.lastUpdated = new Date();

        var inspection_filter = {};
        var noOfUsers = arrObj.value.users.length;
        if (arrObj.value.hasOwnProperty('inspection_with')) {
          console.log("Present");

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
            var auth_timestamp = arrObj.value.cycles[cyclesCount][userEmail].auth_timestamp;
            auth_timestamp = auth_timestamp.substring(0, 10);

            arrObj.value.filter_auth_start_time = moment(auth_timestamp, 'DD-MM-YYYY').unix();
            arrObj.value.filter_auth_end_time = moment(auth_timestamp, 'DD-MM-YYYY').unix();
            // console.log(moment(auth_timestamp,'DD-MM-YYYY').unix(),"   ",auth_timestamp);
          }
          else if (noOfUsers == 1) {
            var userEmail = arrObj.value.users[0];
            var auth_timestamp = arrObj.value.cycles[cyclesCount][userEmail].auth_timestamp;
            auth_timestamp = auth_timestamp.substring(0, 10);

            arrObj.value.filter_auth_start_time = moment(auth_timestamp, 'DD-MM-YYYY').unix();
            arrObj.value.filter_auth_end_time = moment(auth_timestamp, 'DD-MM-YYYY').unix();
          }
        }
        else if (arrObj.value.state == 1) {
          if (noOfUsers == 2) {
            var userEmail = arrObj.value.users[0];
            var auth_timestamp = arrObj.value.cycles[0][userEmail].saved_timestamp;
            auth_timestamp = auth_timestamp.substring(0, 10);

            arrObj.value.filter_auth_start_time = moment(auth_timestamp, 'DD-MM-YYYY').unix();
            arrObj.value.filter_auth_end_time = moment(auth_timestamp, 'DD-MM-YYYY').unix();
          }
          else if (noOfUsers == 1) {
            var userEmail = arrObj.value.users[0];
            var auth_timestamp = arrObj.value.cycles[0][userEmail].saved_timestamp;
            auth_timestamp = auth_timestamp.substring(0, 10);

            arrObj.value.filter_auth_start_time = moment(auth_timestamp, 'DD-MM-YYYY').unix();
            arrObj.value.filter_auth_end_time = moment(auth_timestamp, 'DD-MM-YYYY').unix();
          }
        }
        if (arrObj.value.hasOwnProperty('is_invalid')) {
          arrObj.value.filter_is_invalid = arrObj.value.is_invalid;
        }
        else {
          arrObj.value.filter_is_invalid = false;
        }

        arrObj.value.inspection_with_filter = inspection_filter;
        models.inspectionModel(modelsName).create(arrObj, function (err, result) {
        });
        callback();
      }, function (err) {
        if (err) {
          // do something with the error
        } else {
          //do something else after .each gets executed
          var switchModel = {
            key: 'true',
            value: timeStamp
          }
          var query = { 'key': 'true' };
          models.switchModel().findOneAndUpdate(query, switchModel, { upsert: true }, function (err, doc) {
            if (err) return res.send(500, { error: err });
          });
          res.send("Inserted");
        }
      });
    } catch (ex) {
      res.send("Error");
    }
  })
});



router.get('/api/createUsersMongo', function (req, res, next) {

  request('http://108.161.136.204:4985/demo_db/_design/get_allusers/_view/all?stale=false', function (error, response, body) {
    try {
      var resData = JSON.parse(body);
      console.log(resData.rows.length);
      var mongoName = 'usersModel_' + 1527145252763;
      async.each(resData.rows, function (arrObj, callback) {
        models.usersModel5(mongoName).create(arrObj, function (err, result) {
        });
        callback();
      }, function (err) {
        if (err) {
          // do something with the error
        } else {
          //do something else after .each gets executed
          res.send("Users Inserted");
        }
      });


    } catch (ex) {
      res.send("Error");
    }


  })


});

router.get('/api/createAdminUsersMongo', function (req, res, next) {
  request('http://108.161.136.204:4985/demo_db/_design/get_user/_view/all?stale=false', function (error, response, body) {

    try {
      var resData = JSON.parse(body);
      console.log(resData.rows.length);
      var mongoName = 'adminUsersModel_' + 1527145252763;
      async.each(resData.rows, function (arrObj, callback) {
        models.adminUsersModel5(mongoName).create(arrObj, function (err, result) {
        });
        callback();
      }, function (err) {
        if (err) {
          // do something with the error
        } else {
          //do something else after .each gets executed
          res.send("Admin Users Inserted");
        }
      });

    } catch (ex) {
      res.send("Error");
    }
  })
});

router.get('/api/checklistMongo', function (req, res, next) {
  request('http://108.161.136.204:4985/demo_db/_design/get_allChecklistsFalse/_view/all?stale=false', function (error, response, body) {
    try {
      var resData = JSON.parse(body);
      console.log(resData.rows.length);
      var mongoName = 'checkListModel_' + 1527145252763;
      async.each(resData.rows, function (arrObj, callback) {
        models.checkListModel5().create(arrObj, function (err, result) {
        });
        callback();
      }, function (err) {
        if (err) {
          // do something with the error
        } else {
          //do something else after .each gets executed
          res.send("Checklist Inserted");
        }
      });

    } catch (ex) {
      res.send("Error");
    }
  })
});

router.get('/api/allProjectsMongo', function (req, res, next) {
  request('http://108.161.136.204:4985/demo_db/_design/get_allProjects/_view/all?stale=false', function (error, response, body) {
    try {
      var resData = JSON.parse(body);
      console.log(resData.rows.length);
      async.each(resData.rows, function (arrObj, callback) {
        models.projectsModel5().create(arrObj, function (err, result) {
        });
        callback();
      }, function (err) {
        if (err) {
          // do something with the error
        } else {
          //do something else after .each gets executed
          res.send("All Projects Inserted");
        }
      });

    } catch (ex) {
      res.send("Error");
    }
  })
});

router.get('/api/allDisciplinesMongo', function (req, res, next) {
  request('http://108.161.136.204:4985/demo_db/_design/get_allDisciplines/_view/all?stale=false', function (error, response, body) {
    try {
      var resData = JSON.parse(body);
      console.log(resData.rows.length);
      async.each(resData.rows, function (arrObj, callback) {
        models.disciplinesModel5().create(arrObj, function (err, result) {
        });
        callback();
      }, function (err) {
        if (err) {
          // do something with the error
        } else {
          //do something else after .each gets executed
          res.send("All Disciplines Inserted");
        }
      });

    } catch (ex) {
      res.send("Error");
    }
  })
});

router.get('/api/authMongo', function (req, res, next) {
  request('http://108.161.136.204:4985/demo_db/_design/get_allAuth/_view/all?stale=false', function (error, response, body) {
    try {
      var resData = JSON.parse(body);
      console.log(resData.rows.length);
      async.each(resData.rows, function (arrObj, callback) {
        models.authModel5().create(arrObj, function (err, result) {
        });
        callback();
      }, function (err) {
        if (err) {
          // do something with the error
        } else {
          //do something else after .each gets executed
          res.send("Auth Inserted");
        }
      });
    } catch (ex) {
      res.send("Error");
    }
  })
});

router.get('/api/inspectionStateMongo', function (req, res, next) {
  request('http://108.161.136.204:4985/demo_db/_design/get_allAuth/_view/all?stale=false', function (error, response, body) {
    try {
      var resData = JSON.parse(body);
      console.log(resData.rows.length);
      async.each(resData.rows, function (arrObj, callback) {
        models.inspectionStateModel5().create(arrObj, function (err, result) {
        });
        callback();
      }, function (err) {
        if (err) {
          // do something with the error
        } else {
          //do something else after .each gets executed
          res.send("Inspection State Inserted");
        }
      });
    } catch (ex) {
      res.send("Error");
    }
  })
});

router.get('/api/allLogsMongo', function (req, res, next) {
  request('http://108.161.136.204:4985/demo_db/_design/get_allLogs/_view/all?stale=false', function (error, response, body) {
    try {
      var resData = JSON.parse(body);
      console.log(resData.rows.length);
      async.each(resData.rows, function (arrObj, callback) {
        models.logsModel5().create(arrObj, function (err, result) {
        });
        callback();
      }, function (err) {
        if (err) {
          // do something with the error
        } else {
          //do something else after .each gets executed
          res.send("All Logs Inserted");
        }
      });
    } catch (ex) {
      res.send("Error");
    }
  })
});

router.get('/api/allDevicesMongo', function (req, res, next) {
  request('http://108.161.136.204:4985/demo_db/_design/get_allDevices/_view/all?stale=false', function (error, response, body) {
    try {
      var resData = JSON.parse(body);
      console.log(resData.rows.length);
      async.each(resData.rows, function (arrObj, callback) {
        arrObj.lastUpdated = new Date();
        models.devicesModel5().create(arrObj, function (err, result) {
        });
        callback();
      }, function (err) {
        if (err) {
          // do something with the error
        } else {
          //do something else after .each gets executed
          res.send("All Devices Inserted");
        }
      });

    } catch (ex) {
      res.send("Error");
    }
  })
});

router.get('/api/allInspectionsMongo', function (req, res, next) {
  request('http://108.161.136.204:4985/demo_db/_design/get_allDevices/_view/all?stale=false', function (error, response, body) {
    try {
      var resData = JSON.parse(body);
      console.log(resData.rows.length);
      async.each(resData.rows, function (arrObj, callback) {
        models.allInspectionsModel5().create(arrObj, function (err, result) {
        });
        callback();
      }, function (err) {
        if (err) {
          // do something with the error
        } else {
          //do something else after .each gets executed
          res.send("All Inspections Inserted");
        }
      });

    } catch (ex) {
      res.send("Error");
    }
  })
});

router.get('/api/allFieldsInspectionMongo', function (req, res, next) {
  request('http://108.161.136.204:4985/demo_db/_design/get_allDevices/_view/all?stale=false', function (error, response, body) {
    try {
      var resData = JSON.parse(body);
      console.log(resData.rows.length);
      async.each(resData.rows, function (arrObj, callback) {
        models.fieldsInspectionModel5().create(arrObj, function (err, result) {
        });
        callback();
      }, function (err) {
        if (err) {
          // do something with the error
        } else {
          //do something else after .each gets executed
          res.send("All Fields Inspection Inserted");
        }
      });
    } catch (ex) {
      res.send("Error");
    }
  })
});

router.post('/api/getDataByKeys', function (req, res, next) {

  console.log(req.body);
  var inspection_with = req.body.username;

  var inspectionModel = models.inspectionModel();

  inspectionModel.find({ "value.inspection_with": inspection_with }, function (err, docs) {
    console.log(docs.length);
    res.json(docs);
  });

});

router.post('/api/:db/pdfreport', function (req, res, next) {

  var dbName = req.params.db;

  //   inspectionModel.find({'value.state':{$ne:0}},'value.inspection_id value.name value.inspection_with value.cycles value.users value.state',
  //   function(err, docs){
  //    var docsJson =  _.map(docs, function(obj){return obj.toObject().value});
  //   // fs.writeFile('pdfData.json',JSON.stringify(docsJson),function(){
  //     res.json(docsJson);
  //  // })
  //   });
  console.log(dbName);
  var switchModel;
  if (dbName == "ei")
    switchModel = models.switchModel();
  else if (dbName == "cb")
    switchModel = models.switchModel3();
  else if (dbName == "sw")
    switchModel = models.switchModel4();
  else if (dbName == "mn")
    switchModel = models.switchModel5();
  else
    res.json({ "Err": "Database is wrong" })

  switchModel.find({ 'key': 'true' }).exec(function (err, docs) {
    var usersModel = models.usersModel(userModelName);
    var inspectionModel = models.inspectionModel(modelName);
    //console.log(docs[0].value);
    var modelName = 'inspectionModel_' + docs[0].value;
    var userModelName = 'usersModel_' + docs[0].value;
    if (dbName == "ei")                                        // traqModelLTRCB_DB
    {
      console.log(dbName);
      usersModel = models.usersModel(userModelName);
      inspectionModel = models.inspectionModel(modelName);
    }
    else if (dbName == "cb") {
      console.log(dbName);                            // traqModelLnT_DB
      usersModel = models.usersModel3(userModelName);
      inspectionModel = models.inspectionModel3(modelName);
    }
    else if (dbName == "sw") {
      console.log(dbName);                             // traqModelLnT_MN_DB
      usersModel = models.usersModel4(userModelName);
      inspectionModel = models.inspectionModel4(modelName);
    }
    else if (dbName == "mn") {
      console.log(dbName);                              // traqModelLnT_SW_DB
      usersModel = models.usersModel5(userModelName);
      inspectionModel = models.inspectionModel5(modelName);
    }
    
    else {

    }


    if ((typeof (req.body.limit) == "undefined") || (typeof (req.body.skip) == "undefined")) {
      res.JSON("Something Went Wrong");
    }
    else if (req.body.limit > 10) {
      var response1 = {
        "status": "FAILED",
        "Msg": "Not able to access more than 10 Documents"
      }
      res.JSON(response1);
    }
    else {
      var query = { 'value.state': { $ne: 0 } };
      if (req.body.hasOwnProperty('state') && req.body.hasOwnProperty('discipline_name') && req.body.hasOwnProperty('sub_discipline') && req.body.hasOwnProperty('name') &&
        req.body.hasOwnProperty('from') && req.body.hasOwnProperty('to')) {

        if (req.body.hasOwnProperty('state')) {
          if (req.body.state != "") {
            if (req.body.state == 'COMPLETED') {
              // query = { 'value.state': 2 };
              // query = {'value.filter_is_invalid' : 'false'};
              query['value.state'] = 2;
              query['value.filter_is_invalid'] = false;
              // console.log(query);
              //    query=JSON.stringify(query);
            }
            else if (req.body.state == 'PENDING') {

              query['value.state'] = 1;
              query['value.filter_is_invalid'] = false;
              //query.value.state = 1;
            }
            else if (req.body.state == 'INVALID') {

              //query={'value.is_invalid':true};
              query['value.is_invalid'] = true;
            }
          }
        }
        if (req.body.hasOwnProperty('discipline_name')) {
          if (req.body.discipline_name != "") {
            if (req.body.discipline_name != 'ALL') {
              query['value.discipline.name'] = req.body.discipline_name;

              if (req.body.hasOwnProperty('sub_discipline')) {
                if (req.body.sub_discipline != 'ALL') {
                  query['value.discipline.subgroup.name'] = req.body.sub_discipline;
                }
              }
            }
          }
        }

        if (req.body.hasOwnProperty('email_address')) {
          if (req.body.email_address != 'ALL' && req.body.email_address != "") {
            query['value.vendor.email_address'] = req.body.email_address;
          }
        }

        if (req.body.hasOwnProperty('project_num')) {
          if (req.body.project_num != 'ALL' && req.body.project_num != "") {
            query['value.project.num'] = req.body.project_num;
          }
        }

        if (req.body.hasOwnProperty('name')) {
          if (req.body.name != 'ALL' && req.body.name != "") {
            query['value.inspection_with_filter.value'] = req.body.name;
          }
        }

        if (req.body.hasOwnProperty('from')) {
          if (req.body.from != "") {
            var formStartDate = req.body.from + " 00:00:00";
            var startDate = moment(formStartDate, 'DD-MM-YYYY HH:mm:ss').unix();
            query['value.filter_auth_start_time'] = { $gte: startDate };
          }
        }

        if (req.body.hasOwnProperty('to')) {
          if (req.body.to != "") {
            var formEndDate = req.body.to + " 23:59:59";
            var endDate = moment(formEndDate, 'DD-MM-YYYY HH:mm:ss').unix();
            query['value.filter_auth_end_time'] = { $lte: endDate };
          }
        }
      }

      inspectionModel.find(query,
        'id value.inspection_id value.name value.inspection_with value.cycles value.users value.state value.discipline value.project value.vendor value.is_invalid')
        .sort({ 'value.submission_datetime': 'desc' })
        .limit(req.body.limit)
        .skip(req.body.skip)
        .exec(function (err, docs) {
          var inspJson = _.map(docs, function (obj) {
            var rowValue = obj.toObject()
            rowValue.value.id = obj.id
            return rowValue.value
          });
          async.waterfall([

            function (callback) {
              inspectionModel.count(query, function (err, cnt) {
                callback(null, cnt);
              });
            },
            function (arg1, callback) {

              async.eachSeries(inspJson, function (obj, cb) {

                obj.number_of_cycles = obj.cycles.length;
                obj.project_name = _.get(obj, 'project.name', '');
                obj.project_num = _.get(obj, 'project.num', '');
                obj.location = _.get(obj, 'project.location.name', '');
                obj.vendor_name = _.get(obj, 'vendor.name', '');
                obj.vendor_email_address = _.get(obj, 'vendor.email_address', '');
                obj.sub_discipline = _.get(obj, 'discipline.subgroup.name', '');

                if (obj.discipline != null) {
                  obj.discipline_name = obj.discipline.name;
                  //console.log(obj.discipline_name)
                }

                var usersCnt = obj.users.length;
                if (usersCnt == 2) {
                  var submitter = obj.cycles[0].submitters[0];
                  obj.insp_start_date = obj.cycles[0][submitter].saved_timestamp;
                  // console.log(obj.insp_start_date)
                }
                else if (usersCnt == 1) {
                  var authoriser = obj.cycles[0].authorisers[0];
                  obj.insp_start_date = obj.cycles[0][authoriser].saved_timestamp;
                  //console.log(obj.insp_start_date)
                }

                if (obj.state == 2) {
                  var authoriser = obj.cycles[obj.cycles.length - 1].authorisers[0];
                  obj.insp_end_date = obj.cycles[obj.cycles.length - 1][authoriser].auth_timestamp;
                  // console.log(obj.insp_end_date)
                }
                else {
                  obj.insp_end_date = "";
                }
                if (obj.hasOwnProperty('inspection_with')) {
                  console.log("Present");
                  var noOfUsers = obj.users.length;
                  if (obj.inspection_with == "COMPLETED") {


                    if (noOfUsers == 2) {
                      var userEmail = obj.users[1];
                      var usersCycle = obj.cycles[0][userEmail];
                      obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;

                    }
                    else if (noOfUsers == 1) {
                      var userEmail = obj.users[0];
                      var usersCycle = obj.cycles[0][userEmail];
                      obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                    }
                    cb();
                  }
                  else {
                    var usersEmail = obj.inspection_with;
                    var position = obj.users.indexOf(usersEmail);
                    if (noOfUsers == 2) {
                      if (position == 0) // For 1st position
                      {
                        var userEmail = obj.users[position];

                        var usersCycle = obj.cycles[0][userEmail];
                        obj.insp_auth_name = usersCycle.inspector.first_name + " " + usersCycle.inspector.last_name;

                        cb();

                      }
                      else if (position == 1) // For 2nd position
                      {
                        var userEmail = obj.users[position];

                        var usersCycle = obj.cycles[0][userEmail];

                        if (usersCycle.auth.first_name == "" && usersCycle.auth.last_name == "") {

                          usersModel.find({ "value.email_address": userEmail }, 'value.email_address value.first_name value.last_name', function (err, res) {
                            var inspectorRes = _.map(res, function (obj) { return obj.toObject().value });
                            if (res.length > 0) {

                              obj.insp_auth_name = inspectorRes[0].first_name + " " + inspectorRes[0].last_name;

                              console.log("First name not present in auth ", obj.insp_auth_name);
                            }
                            console.log()
                            cb();

                          });
                        }
                        else {
                          obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                          cb();
                        }
                        //console.log(usersEmail," ", position,"..  . . .",obj.insp_auth_name)
                      }
                    }
                    else if(noOfUsers == 1){
                      var userEmail = obj.users[position];
                      var usersCycle = obj.cycles[0][userEmail];
                      obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                      cb();
                    }
                  }

                }
                else {
                  console.log("Not Present");
                  var state = obj.state;
                  console.log(state)
                  if (state == 2) {
                    var noOfUsers = obj.users.length;
                    if (noOfUsers == 2) {
                      var userEmail = obj.users[1];

                      var usersCycle = obj.cycles[0][userEmail];
                      obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;

                    }
                    else if (noOfUsers == 1) {
                      var userEmail = obj.users[0];

                      var usersCycle = obj.cycles[0][userEmail];
                      obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                    }
                    cb();
                  }

                  else if (state == 1) {
                    var noOfUsers = obj.users.length;
                    if (noOfUsers == 2) {
                      var userEmail = obj.users[1];
                      var usersCycle = obj.cycles[0][userEmail];
                      if (usersCycle.auth.first_name == "" && usersCycle.auth.last_name == "") {

                        //  var usersModel = models.usersModel();
                        usersModel.find({ "value.email_address": userEmail }, 'value.email_address value.first_name value.last_name', function (err, res) {
                          var inspectorRes = _.map(res, function (obj) { return obj.toObject().value });
                          if (res.length > 0) {

                            obj.insp_auth_name = inspectorRes[0].first_name + " " + inspectorRes[0].last_name;
                            //   console.log(obj.insp_auth_name);
                          }
                          cb();

                        });
                      }
                      else {
                        obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                        cb();
                      }
                    }
                    else if (noOfUsers == 1) {
                      var userEmail = obj.users[0];

                      var usersCycle = obj.cycles[0][userEmail];
                      obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                      cb();
                    }
                  }

                }

              }, function () {

                inspJson = _.map(inspJson, function (insp) {
                  insp = _.omit(insp, ['cycles', 'discipline', 'inspection_with', 'vendor', 'project']);
                  return insp;
                });
                console.log("---------", arg1)
                var finalJson = {
                  "total_rows": arg1,
                  "rows": inspJson
                };
                // res.json(finalJson);
                callback(null, finalJson);
              });
            }
          ], function (err, results) {
            res.json(results);
          });
        });
    }

  })
});


router.post('/api/pdfReportWithFilter', function (req, res, next) {

  var inspectionModel = models.inspectionModel();

  if ((typeof (req.body.limit) == "undefined") || (typeof (req.body.skip) == "undefined")) {
    res.JSON("Something Went Wrong");
  }

  else {

    var query = { 'value.state': { $ne: 0 } };
    if (req.body.hasOwnProperty('state')) {
      if (req.body.state == 'COMPLETED') {
        query = { 'value.state': 2 };
        console.log(query);
        //    query=JSON.stringify(query);
      }
      else if (req.body.state == 'PENDING') {

        query = { 'value.state': 1 };
        //query.value.state = 1;
      }
      else if (req.body.state == 'INVALID') {

        //query={'value.is_invalid':true};
        query['value.is_invalid'] = true;
      }
    }
    if (req.body.hasOwnProperty('discipline_name')) {
      if (req.body.discipline_name != 'ALL') {
        query['value.discipline.name'] = req.body.discipline_name;

        if (req.body.hasOwnProperty('sub_discipline')) {
          if (req.body.sub_discipline != 'ALL') {
            query['value.discipline.subgroup.name'] = req.body.sub_discipline;
          }
        }
      }
    }

    if (req.body.hasOwnProperty('email_address')) {
      if (req.body.email_address != 'ALL') {
        query['value.vendor.email_address'] = req.body.email_address;
      }
    }

    if (req.body.hasOwnProperty('project_num')) {
      if (req.body.project_num != 'ALL') {
        query['value.project.num'] = req.body.project_num;
      }
    }

    if (req.body.hasOwnProperty('name')) {
      if (req.body.name != 'ALL') {
        query['value.inspection_with_filter.value'] = req.body.name;
      }
    }

    var startDate = moment(req.body.from, 'DD-MM-YYYY').unix();
    var endDate = moment(req.body.to, 'DD-MM-YYYY').unix();
    console.log(req.body.from);
    if (req.body.hasOwnProperty('from')) {
      query['value.filter_auth_start_time'] = { $gte: startDate };
    }

    if (req.body.hasOwnProperty('to')) {
      query['value.filter_auth_end_time'] = { $lte: endDate };
    }
    inspectionModel.find(query,
      'id value.inspection_id value.name value.inspection_with value.cycles value.users value.state value.discipline value.project value.vendor value.is_invalid')
      .sort({ 'value.submission_datetime': 'desc' })
      .limit(req.body.limit)
      .skip(req.body.skip)
      .exec(function (err, docs) {
        var inspJson = _.map(docs, function (obj) {
          var rowValue = obj.toObject()
          rowValue.value.id = obj.id
          return rowValue.value
        });
        async.waterfall([

          function (callback) {
            inspectionModel.count({ 'value.state': { $ne: 0 } }, function (err, cnt) {

              callback(null, cnt);
            });
          },
          function (arg1, callback) {

            async.eachSeries(inspJson, function (obj, cb) {

              obj.number_of_cycles = obj.cycles.length;
              obj.project_name = obj.project.name;
              obj.project_num = obj.project.num;
              obj.location = obj.project.location.name;
              obj.vendor_name = obj.vendor.name;
              obj.vendor_email_address = obj.vendor.email_address;
              obj.sub_discipline = _.get(obj, 'discipline.subgroup.name', '');

              if (obj.discipline != null) {
                obj.discipline_name = obj.discipline.name;
                //console.log(obj.discipline_name)
              }

              var usersCnt = obj.users.length;
              if (usersCnt == 2) {
                var submitter = obj.cycles[0].submitters[0];
                obj.insp_start_date = obj.cycles[0][submitter].saved_timestamp;
                // console.log(obj.insp_start_date)
              }
              else if (usersCnt == 1) {
                var authoriser = obj.cycles[0].authorisers[0];
                obj.insp_start_date = obj.cycles[0][authoriser].saved_timestamp;
                //console.log(obj.insp_start_date)
              }

              if (obj.state == 2) {
                var authoriser = obj.cycles[obj.cycles.length - 1].authorisers[0];
                obj.insp_end_date = obj.cycles[0][authoriser].auth_timestamp;
                // console.log(obj.insp_end_date)
              }
              else {
                obj.insp_end_date = "";
              }
              if (obj.hasOwnProperty('inspection_with')) {
                console.log("Present");

                if (obj.inspection_with == "COMPLETED") {
                  var noOfUsers = obj.users.length;

                  if (noOfUsers == 2) {
                    var userEmail = obj.users[1];
                    var usersCycle = obj.cycles[0][userEmail];
                    obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;

                  }
                  else if (noOfUsers == 1) {
                    var userEmail = obj.users[0];
                    var usersCycle = obj.cycles[0][userEmail];
                    obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                  }
                  cb();
                }
                else {
                  var usersEmail = obj.inspection_with;
                  var position = obj.users.indexOf(usersEmail);

                  if (position == 0) // For 1st position
                  {
                    var userEmail = obj.users[position];

                    var usersCycle = obj.cycles[0][userEmail];
                    obj.insp_auth_name = usersCycle.inspector.first_name + " " + usersCycle.inspector.last_name;

                    cb();

                  }
                  else if (position == 1) // For 2nd position
                  {
                    var userEmail = obj.users[position];

                    var usersCycle = obj.cycles[0][userEmail];

                    if (usersCycle.auth.first_name == "" && usersCycle.auth.last_name == "") {

                      var usersModel = models.usersModel();
                      usersModel.find({ "value.email_address": userEmail }, 'value.email_address value.first_name value.last_name', function (err, res) {
                        var inspectorRes = _.map(res, function (obj) { return obj.toObject().value });
                        if (res.length > 0) {

                          obj.insp_auth_name = inspectorRes[0].first_name + " " + inspectorRes[0].last_name;

                          console.log("First name not present in auth ", obj.insp_auth_name);
                        }
                        console.log()
                        cb();

                      });
                    }
                    else {
                      obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                      cb();
                    }
                    //console.log(usersEmail," ", position,"..  . . .",obj.insp_auth_name)
                  }
                }

              }
              else {
                console.log("Not Present");
                var state = obj.state;
                console.log(state)
                if (state == 2) {
                  var noOfUsers = obj.users.length;
                  if (noOfUsers == 2) {
                    var userEmail = obj.users[1];

                    var usersCycle = obj.cycles[0][userEmail];
                    obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;

                  }
                  else if (noOfUsers == 1) {
                    var userEmail = obj.users[0];

                    var usersCycle = obj.cycles[0][userEmail];
                    obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                  }
                  cb();
                }

                else if (state == 1) {
                  var noOfUsers = obj.users.length;
                  if (noOfUsers == 2) {
                    var userEmail = obj.users[1];
                    var usersCycle = obj.cycles[0][userEmail];
                    if (usersCycle.auth.first_name == "" && usersCycle.auth.last_name == "") {

                      var usersModel = models.usersModel();
                      usersModel.find({ "value.email_address": userEmail }, 'value.email_address value.first_name value.last_name', function (err, res) {
                        var inspectorRes = _.map(res, function (obj) { return obj.toObject().value });
                        if (res.length > 0) {

                          obj.insp_auth_name = inspectorRes[0].first_name + " " + inspectorRes[0].last_name;
                          //   console.log(obj.insp_auth_name);
                        }
                        cb();

                      });
                    }
                    else {
                      obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                      cb();
                    }
                  }
                  else if (noOfUsers == 1) {
                    var userEmail = obj.users[0];

                    var usersCycle = obj.cycles[0][userEmail];
                    obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                    cb();
                  }
                }

              }


            }, function () {

              inspJson = _.map(inspJson, function (insp) {
                insp = _.omit(insp, ['cycles', 'discipline', 'inspection_with', 'vendor', 'project']);
                return insp;
              });
              console.log("---------", arg1)
              var finalJson = {
                "total_rows": arg1,
                "rows": inspJson
              };
              // res.json(finalJson);
              callback(null, finalJson);
            });
          }
        ], function (err, results) {
          res.json(results);
        });
      });
  }

});




router.post('api/getPaginateData', function (req, res, next) {
  var inspection_with = req.body.username;
  var paginateModel = models.paginateModel();
  paginateModel.paginate({}, 2, 10, function (error, pageCount, paginatedResults) {
    if (error) {
      console.error(error);
    } else {
      console.log('Pages:', pageCount);
      console.log(paginatedResults);
    }
  });

});

router.post('/api/addInspectionQA', function (req, res, next) {

  models.prepareDatabase2();

  var inspectionModelQA = models.inspectionModelQA();

  var inspection_id = req.body.value.inspection_id;

  console.log("----" + inspection_id);

  // inspectionModel.update({"value.inspection_id":inspection_id},req.body,{upsert:true},function(err, result){

  //   console.log(err)

  //   res.json(result);
  // });    

  inspectionModelQA.create(req.body, function (err, result) {

    console.log(err)

    res.json(result);
  });

});


router.get('/api/allRecordsQA', function (req, res, next) {

  models.prepareDatabase2();

  var inspectionModelQA = models.inspectionModelQA();

  inspectionModelQA.find({}, function (err, docs) {


    res.json(docs);

  });

});

router.post('/api/pdfReportQA', function (req, res, next) {

  models.prepareDatabase2();

  var inspectionModelQA = models.inspectionModelQA();

  //   inspectionModelQA.find({'value.state':{$ne:0}},'value.inspection_id value.name value.inspection_with value.cycles value.users value.state',
  //   function(err, docs){
  //    var docsJson =  _.map(docs, function(obj){return obj.toObject().value});
  //   // fs.writeFile('pdfData.json',JSON.stringify(docsJson),function(){
  //     res.json(docsJson);
  //  // })
  //   });


  if ((typeof (req.body.limit) == "undefined") || (typeof (req.body.skip) == "undefined")) {
    res.JSON("Something Went Wrong");
  }

  else {
    var query = { 'value.state': { $ne: 0 } };
    if (req.body.hasOwnProperty('state') && req.body.hasOwnProperty('discipline_name') && req.body.hasOwnProperty('sub_discipline') && req.body.hasOwnProperty('name') &&
      req.body.hasOwnProperty('from') && req.body.hasOwnProperty('to')) {

      if (req.body.hasOwnProperty('state')) {
        if (req.body.state != "") {
          if (req.body.state == 'COMPLETED') {
            // query = { 'value.state': 2 };
            // query = {'value.filter_is_invalid' : 'false'};
            query['value.state'] = 2;
            query['value.filter_is_invalid'] = false;
            // console.log(query);
            //    query=JSON.stringify(query);
          }
          else if (req.body.state == 'PENDING') {

            query['value.state'] = 1;
            query['value.filter_is_invalid'] = false;
            //query.value.state = 1;
          }
          else if (req.body.state == 'INVALID') {

            //query={'value.is_invalid':true};
            query['value.is_invalid'] = true;
          }
        }
      }
      if (req.body.hasOwnProperty('discipline_name')) {
        if (req.body.discipline_name != "") {
          if (req.body.discipline_name != 'ALL') {
            query['value.discipline.name'] = req.body.discipline_name;

            if (req.body.hasOwnProperty('sub_discipline')) {
              if (req.body.sub_discipline != 'ALL') {
                query['value.discipline.subgroup.name'] = req.body.sub_discipline;
              }
            }
          }
        }
      }

      if (req.body.hasOwnProperty('email_address')) {
        if (req.body.email_address != 'ALL' && req.body.email_address != "") {
          query['value.vendor.email_address'] = req.body.email_address;
        }
      }

      if (req.body.hasOwnProperty('project_num')) {
        if (req.body.project_num != 'ALL' && req.body.project_num != "") {
          query['value.project.num'] = req.body.project_num;
        }
      }

      if (req.body.hasOwnProperty('name')) {
        if (req.body.name != 'ALL' && req.body.name != "") {
          query['value.inspection_with_filter.value'] = req.body.name;
        }
      }

      if (req.body.hasOwnProperty('from')) {
        if (req.body.from != "") {
          var startDate = moment(req.body.from, 'DD-MM-YYYY').unix();
          query['value.filter_auth_start_time'] = { $gte: startDate };
        }
      }

      if (req.body.hasOwnProperty('to')) {
        if (req.body.to != "") {
          var endDate = moment(req.body.to, 'DD-MM-YYYY').unix();
          query['value.filter_auth_end_time'] = { $lte: endDate };
        }
      }
    }


    inspectionModelQA.find(query,
      'id value.inspection_id value.name value.inspection_with value.cycles value.users value.state value.discipline value.project value.vendor value.is_invalid')
      .sort({ 'value.submission_datetime': 'desc' })
      .limit(req.body.limit)
      .skip(req.body.skip)
      .exec(function (err, docs) {
        var inspJson = _.map(docs, function (obj) {
          var rowValue = obj.toObject()
          rowValue.value.id = obj.id
          return rowValue.value
        });
        async.waterfall([
          function (callback) {
            inspectionModelQA.count(query, function (err, cnt) {
              callback(null, cnt);
            });
          },
          function (arg1, callback) {
            async.eachSeries(inspJson, function (obj, cb) {

              obj.number_of_cycles = obj.cycles.length;
              obj.project_name = obj.project.name;
              obj.project_num = obj.project.num;
              obj.location = obj.project.location.name;
              obj.vendor_name = obj.vendor.name;
              obj.vendor_email_address = obj.vendor.email_address;
              obj.sub_discipline = _.get(obj, 'discipline.subgroup.name', '');

              if (obj.discipline != null) {
                obj.discipline_name = obj.discipline.name;
                //console.log(obj.discipline_name)
              }

              var usersCnt = obj.users.length;
              if (usersCnt == 2) {
                var submitter = obj.cycles[0].submitters[0];
                obj.insp_start_date = obj.cycles[0][submitter].saved_timestamp;
                // console.log(obj.insp_start_date)
              }
              else if (usersCnt == 1) {
                var authoriser = obj.cycles[0].authorisers[0];
                obj.insp_start_date = obj.cycles[0][authoriser].saved_timestamp;
                //console.log(obj.insp_start_date)
              }

              if (obj.state == 2) {
                var authoriser = obj.cycles[obj.cycles.length - 1].authorisers[0];
                obj.insp_end_date = obj.cycles[0][authoriser].auth_timestamp;
                // console.log(obj.insp_end_date)
              }
              else {
                obj.insp_end_date = "";
              }
              if (obj.hasOwnProperty('inspection_with')) {
                console.log("Present");

                if (obj.inspection_with == "COMPLETED") {
                  var noOfUsers = obj.users.length;

                  if (noOfUsers == 2) {
                    var userEmail = obj.users[1];
                    var usersCycle = obj.cycles[0][userEmail];
                    obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;

                  }
                  else if (noOfUsers == 1) {
                    var userEmail = obj.users[0];
                    var usersCycle = obj.cycles[0][userEmail];
                    obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                  }
                  cb();
                }
                else {
                  var usersEmail = obj.inspection_with;
                  var position = obj.users.indexOf(usersEmail);

                  if (position == 0) // For 1st position
                  {
                    var userEmail = obj.users[position];

                    var usersCycle = obj.cycles[0][userEmail];
                    obj.insp_auth_name = usersCycle.inspector.first_name + " " + usersCycle.inspector.last_name;

                    cb();

                  }
                  else if (position == 1) // For 2nd position
                  {
                    var userEmail = obj.users[position];

                    var usersCycle = obj.cycles[0][userEmail];

                    if (usersCycle.auth.first_name == "" && usersCycle.auth.last_name == "") {

                      var usersModel = models.usersModel();
                      usersModel.find({ "value.email_address": userEmail }, 'value.email_address value.first_name value.last_name', function (err, res) {
                        var inspectorRes = _.map(res, function (obj) { return obj.toObject().value });
                        if (res.length > 0) {

                          obj.insp_auth_name = inspectorRes[0].first_name + " " + inspectorRes[0].last_name;

                          console.log("First name not present in auth ", obj.insp_auth_name);
                        }
                        console.log()
                        cb();

                      });
                    }
                    else {
                      obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                      cb();
                    }
                    //console.log(usersEmail," ", position,"..  . . .",obj.insp_auth_name)
                  }
                }

              }
              else {
                console.log("Not Present");
                var state = obj.state;
                console.log(state)
                if (state == 2) {
                  var noOfUsers = obj.users.length;
                  if (noOfUsers == 2) {
                    var userEmail = obj.users[1];

                    var usersCycle = obj.cycles[0][userEmail];
                    obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;

                  }
                  else if (noOfUsers == 1) {
                    var userEmail = obj.users[0];

                    var usersCycle = obj.cycles[0][userEmail];
                    obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                  }
                  cb();
                }

                else if (state == 1) {
                  var noOfUsers = obj.users.length;
                  if (noOfUsers == 2) {
                    var userEmail = obj.users[1];
                    var usersCycle = obj.cycles[0][userEmail];
                    if (usersCycle.auth.first_name == "" && usersCycle.auth.last_name == "") {

                      var usersModel = models.usersModel();
                      usersModel.find({ "value.email_address": userEmail }, 'value.email_address value.first_name value.last_name', function (err, res) {
                        var inspectorRes = _.map(res, function (obj) { return obj.toObject().value });
                        if (res.length > 0) {

                          obj.insp_auth_name = inspectorRes[0].first_name + " " + inspectorRes[0].last_name;
                          //   console.log(obj.insp_auth_name);
                        }
                        cb();

                      });
                    }
                    else {
                      obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                      cb();
                    }
                  }
                  else if (noOfUsers == 1) {
                    var userEmail = obj.users[0];

                    var usersCycle = obj.cycles[0][userEmail];
                    obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                    cb();
                  }
                }

              }


            }, function () {

              inspJson = _.map(inspJson, function (insp) {
                insp = _.omit(insp, ['cycles', 'discipline', 'inspection_with', 'vendor', 'project']);
                return insp;
              });
              var finalJson = {
                "total_rows": arg1,
                "rows": inspJson
              };
              //res.json(finalJson);
              callback(null, finalJson)
            });
          }], function (err, result) {

            res.json(result);
          });
      });
  }

});

router.get('/getDataToCopy', function (req, res, next) {
  var inspectionModel = models.inspectionModel();

  inspectionModel.find({}, function (err, docs) {
    //  console.log(docs);
  }).then(function (docsObs) {

    var docs = JSON.parse(JSON.stringify(docsObs));
    async.waterfall([
      function (callback) {
        docs = _.map(docs, function (insp) {
          insp = _.omit(insp, ['_id']);

          return insp;
        });
        callback(null, docs);
      },
      function (docs, callback) {
        console.log(docs)
        async.each(docs, function (arrObj, callback) {

          //  arrObj = _.omit(arrObj, '_id');
          // arrObj._id = undefined;
          // console.log(_.omit(arrObj, ['_id']));
          models.inspectionModel2().create(arrObj, function (err, result) {
          });
          callback();
        }, function (err) {
          if (err) {
            // do something with the error
          } else {
            //do something else after .each gets executed
            res.send("Inserted");
          }
        });

      }
    ],
      function (err, result) {
        console.log(err);
      });

  })

  // var copyTo = "function() { db['inspectionModel'].copyTo('inspectionModel2') };"

  // inspectionModel.eval(copyTo, [], function (err, result) {
  //   console.log(err);
  // });
});


router.get('/api/createInspectionMongoWithFiltersQA', function (req, res, next) {

  //  request('http://108.161.136.204:4985/traq_new_db/_design/get_allinspections/_view/all?stale=false', function (error, response, body) {
  //request('http://203.197.8.217:4985/ltrcb_db/_design/get_allinspections/_view/all?stale=false', function (error, response, body) {
  models.prepareDatabase2();
  var inspectionModelQA = models.inspectionModelQA();
  inspectionModelQA.find({}, function (err, docs) {
    //  console.log(docs);
  }).then(function (docs) {
    try {
      inspectionModelQA.remove({}, function (err) {
        console.log('Collection Removed');


        var inspJson = _.map(docs, function (obj) {
          return obj.toObject();
        });

        //  var resData = JSON.parse(body);
        //  console.log(resData.rows.length);

        async.each(inspJson, function (arrObj, callback) {
          arrObj.lastUpdated = new Date();

          var inspection_filter = {};

          console.log(arrObj.value)
          var noOfUsers = arrObj.value.users.length;
          if (arrObj.value.hasOwnProperty('inspection_with')) {
            console.log("Present");

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
              var auth_timestamp = arrObj.value.cycles[cyclesCount][userEmail].auth_timestamp;
              auth_timestamp = auth_timestamp.substring(0, 10);

              arrObj.value.filter_auth_start_time = moment(auth_timestamp, 'DD-MM-YYYY').unix();
              arrObj.value.filter_auth_end_time = moment(auth_timestamp, 'DD-MM-YYYY').unix();
              // console.log(moment(auth_timestamp,'DD-MM-YYYY').unix(),"   ",auth_timestamp);
            }
            else if (noOfUsers == 1) {
              var userEmail = arrObj.value.users[0];
              var auth_timestamp = arrObj.value.cycles[cyclesCount][userEmail].auth_timestamp;
              auth_timestamp = auth_timestamp.substring(0, 10);

              arrObj.value.filter_auth_start_time = moment(auth_timestamp, 'DD-MM-YYYY').unix();
              arrObj.value.filter_auth_end_time = moment(auth_timestamp, 'DD-MM-YYYY').unix();
            }
          }
          else if (arrObj.value.state == 1) {
            if (noOfUsers == 2) {
              var userEmail = arrObj.value.users[0];
              var auth_timestamp = arrObj.value.cycles[0][userEmail].saved_timestamp;
              auth_timestamp = auth_timestamp.substring(0, 10);

              arrObj.value.filter_auth_start_time = moment(auth_timestamp, 'DD-MM-YYYY').unix();
              arrObj.value.filter_auth_end_time = moment(auth_timestamp, 'DD-MM-YYYY').unix();
            }
            else if (noOfUsers == 1) {
              var userEmail = arrObj.value.users[0];
              var auth_timestamp = arrObj.value.cycles[0][userEmail].saved_timestamp;
              auth_timestamp = auth_timestamp.substring(0, 10);

              arrObj.value.filter_auth_start_time = moment(auth_timestamp, 'DD-MM-YYYY').unix();
              arrObj.value.filter_auth_end_time = moment(auth_timestamp, 'DD-MM-YYYY').unix();
            }
          }
          if (arrObj.value.hasOwnProperty('is_invalid')) {
            arrObj.value.filter_is_invalid = arrObj.value.is_invalid;
          }
          else {
            arrObj.value.filter_is_invalid = false;
          }
          console.log(arrObj);
          arrObj.value.inspection_with_filter = inspection_filter;
          models.inspectionModelQA().create(arrObj,
            function (err, result) {
              console.log(err, '.........', result)
            });
          callback();
        }, function (err) {
          if (err) {
            // do something with the error
          } else {
            //do something else after .each gets executed
            res.send("Inserted");
          }
        });
      });
    } catch (ex) {
      console.log(ex)
    }
  })
});

router.get('/api/switchModel', function (req, res, next) {

  var switchModel = {
    key: 'true',
    value: '1527066292147'
  }
  var updateModel = { 'key': 'false' };
  // models.switchModel().upsert(switchModel, function (err, result) {
  // });
  var query = { 'key': 'true' };
  models.switchModel().findOneAndUpdate(query, updateModel, { upsert: true }, function (err, doc) {
    if (err) return res.send(500, { error: err });
  });

  res.json('Created');
});

///////////////////////////////////////////////////////////////////////////////////////////**********************/

router.post('/api/:db/excelreport', function (req, res, next) {

  var dbName = req.params.db;

  console.log(dbName);
  var switchModel;
  if (dbName == "ei")
    switchModel = models.switchModel();
  else if (dbName == "cb")
    switchModel = models.switchModel3();
  else if (dbName == "sw")
    switchModel = models.switchModel4();
  else if (dbName == "mn")
    switchModel = models.switchModel5();

  else
    res.json({ "Err": "Database is wrong" })

  switchModel.find({ 'key': 'true' }).exec(function (err, docs) {
    var usersModel = models.usersModel(userModelName);
    var inspectionModel = models.inspectionModel(modelName);
    //console.log(docs[0].value);
    var modelName = 'inspectionModel_' + docs[0].value;
    var userModelName = 'usersModel_' + docs[0].value;
    if (dbName == "ei")                                        // traqModelLTRCB_DB
    {
      console.log(dbName);
      usersModel = models.usersModel(userModelName);
      inspectionModel = models.inspectionModel(modelName);
    }
    else if (dbName == "cb") {
      console.log(dbName);                            // traqModelLnT_DB
      usersModel = models.usersModel3(userModelName);
      inspectionModel = models.inspectionModel3(modelName);
    }
    else if (dbName == "sw") {
      console.log(dbName);                             // traqModelLnT_MN_DB
      usersModel = models.usersModel4(userModelName);
      inspectionModel = models.inspectionModel4(modelName);
    }
    else if (dbName == "mn") {
      console.log(dbName);                              // traqModelLnT_SW_DB
      usersModel = models.usersModel5(userModelName);
      inspectionModel = models.inspectionModel5(modelName);
    }
   

    if ((typeof (req.body.limit) == "undefined") || (typeof (req.body.skip) == "undefined")) {
      res.json("Something Went Wrong");
    }
    else if (req.body.limit > 10) {
      var response1 = {
        "status": "FAILED",
        "Msg": "Not able to access more than 10 Documents"
      }
      res.json(response1);
    }
    else {
      var query = { 'value.state': 2 };
      if (req.body.hasOwnProperty('user_type') && req.body.hasOwnProperty('inspector') && req.body.hasOwnProperty('discipline') &&
        req.body.hasOwnProperty('vendor') && req.body.hasOwnProperty('p_num')) {
        if (req.body.hasOwnProperty('user_type')) {
          if (req.body.user_type != "" && req.body.user_type != 'any') {
            if (req.body.user_type == 'inspector') {
              query['value.users.0'] = req.body.inspector;
            }
            else {
              query['value.inspection_with_filter.value'] = req.body.inspector;
            }
          }
        }
        if (req.body.hasOwnProperty('discipline')) {
          if (req.body.discipline != "") {
            if (req.body.discipline != 'any') {
              query['value.discipline.name'] = req.body.discipline;

              if (req.body.hasOwnProperty('subgroup')) {
                if (req.body.subgroup != 'any') {
                  query['value.discipline.subgroup.name'] = req.body.subgroup;
                }
              }
            }
          }
        }

        if (req.body.hasOwnProperty('vendor')) {
          if (req.body.vendor != 'any' && req.body.vendor != "") {
            if (req.body.vendor == "Other") {
              query['value.vendor.name'] = req.body.vendor;
            }
            else {
              query['value.vendor.email_address'] = req.body.vendor;
            }
          }
        }

        if (req.body.hasOwnProperty('p_num')) {
          if (req.body.p_num != 'any' && req.body.p_num != "") {
            query['value.project.num'] = req.body.p_num;
          }
        }

        if (req.body.hasOwnProperty('response')) {
          if (req.body.response != 'any' && req.body.response != "") {
            query['value.filter_response'] = req.body.response;
          }
        }
        var fullStartDate = "";
        var fullEndDate = "";
        var arrDates = [];
        if (req.body.hasOwnProperty('from')) {
          if (req.body.from != "") {
            var startDate1 = moment(req.body.from, 'DD-MM-YYYY');
            var fromDate = new Date(startDate1);
            var year = fromDate.getFullYear();
            var month = fromDate.getMonth() + 1;
            var date = fromDate.getDate();
            console.log(year + "..........." + date + "............" + month)
            if (date < 10) {
              date = '0' + date;
            }
            if (date < 10) {
              month = '0' + month;
            }
            var sdate = (year + "-" + month + "-" + date + " 00:00:00");
            console.log(">>>>>>>>>>>>>>  " + sdate);
            var fullStartDate = moment(sdate, 'YYYY-MM-DD HH:mm:ss').unix();
            //           var startDate = moment(req.body.from, 'DD-MM-YYYY').unix();
            // query['value.filter_submission_datetime'] = { $gte: fullStartDate };
            arrDates[0] = query['value.filter_submission_datetime'];
          }
        }

        if (req.body.hasOwnProperty('to')) {
          if (req.body.to != "") {
            var endDate1 = moment(req.body.to, 'DD-MM-YYYY');
            var fromDate = new Date(endDate1);
            var year = fromDate.getFullYear();
            var month = fromDate.getMonth() + 1;
            var date = fromDate.getDate();

            if (date < 10) {
              date = '0' + date;
            }
            if (date < 10) {
              month = '0' + month;
            }
            var edate = (year + "-" + month + "-" + date + " 23:59:59");
            var fullEndDate = moment(edate, 'YYYY-MM-DD HH:mm:ss').unix();
            // var endDate = moment(req.body.to, 'DD-MM-YYYY').unix();
            // query['value.filter_submission_datetime'] = { $lte: fullEndDate };
            arrDates[1] = query['value.filter_submission_datetime'];
          }
        }
      }

      if (req.body.from != "" && req.body.hasOwnProperty('from') && req.body.to != "" && req.body.hasOwnProperty('to')) {

        var objForQuery = [
          {
            "value.filter_submission_datetime": {
              $gte: fullStartDate
            }
          },
          {
            "value.filter_submission_datetime": {
              $lte: fullEndDate
            }
          }
        ]
        query['$and'] = objForQuery;
      }
      else if (req.body.from != "" && req.body.hasOwnProperty('from')) {
        query['value.filter_submission_datetime'] = { $gte: fullStartDate };
      }
      else if (req.body.to != "" && req.body.hasOwnProperty('to')) {
        query['value.filter_submission_datetime'] = { $lte: fullEndDate };
      }

      console.log(query)
      inspectionModel.find(query)
        .sort({ 'value.submission_datetime': 'desc' })
        .limit(req.body.limit)
        .skip(req.body.skip)
        .exec(function (err, docs) {
          var inspJson = _.map(docs, function (obj) {
            var rowValue = obj.toObject()
            rowValue.value.id = obj.id
            return rowValue.value
          });
          async.waterfall([

            function (callback) {
              inspectionModel.count(query, function (err, cnt) {
                callback(null, cnt);
              });
            },
            function (arg1, callback) {

              async.eachSeries(inspJson, function (obj, cb) {

                obj.number_of_cycles = obj.cycles.length;
                obj.project_name = _.get(obj, 'project.name', '');
                obj.project_num = _.get(obj, 'project.num', '');
                obj.location = _.get(obj, 'project.location.name', '');
                obj.vendor_name = _.get(obj, 'vendor.name', '');
                obj.vendor_email_address = _.get(obj, 'vendor.email_address', '');
                obj.sub_discipline = _.get(obj, 'discipline.subgroup.name', '');

                if (obj.discipline != null) {
                  obj.discipline_name = obj.discipline.name;
                  //console.log(obj.discipline_name)
                }

                var usersCnt = obj.users.length;
                if (usersCnt == 2) {
                  var submitter = obj.cycles[0].submitters[0];
                  obj.insp_start_date = obj.cycles[0][submitter].saved_timestamp;
                  // console.log(obj.insp_start_date)
                }
                else if (usersCnt == 1) {
                  var authoriser = obj.cycles[0].authorisers[0];
                  obj.insp_start_date = obj.cycles[0][authoriser].saved_timestamp;
                  //console.log(obj.insp_start_date)
                }

                if (obj.state == 2) {
                  var authoriser = obj.cycles[obj.cycles.length - 1].authorisers[0];
                  obj.insp_end_date = obj.cycles[0][authoriser].auth_timestamp;
                  // console.log(obj.insp_end_date)
                }
                else {
                  obj.insp_end_date = "";
                }
                if (obj.hasOwnProperty('inspection_with')) {
                  console.log("Present");

                  if (obj.inspection_with == "COMPLETED") {
                    var noOfUsers = obj.users.length;

                    if (noOfUsers == 2) {
                      var userEmail = obj.users[1];
                      var usersCycle = obj.cycles[0][userEmail];
                      obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;

                    }
                    else if (noOfUsers == 1) {
                      var userEmail = obj.users[0];
                      var usersCycle = obj.cycles[0][userEmail];
                      obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                    }
                    cb();
                  }
                  else {
                    var usersEmail = obj.inspection_with;
                    var position = obj.users.indexOf(usersEmail);

                    if (position == 0) // For 1st position
                    {
                      var userEmail = obj.users[position];

                      var usersCycle = obj.cycles[0][userEmail];
                      obj.insp_auth_name = usersCycle.inspector.first_name + " " + usersCycle.inspector.last_name;

                      cb();

                    }
                    else if (position == 1) // For 2nd position
                    {
                      var userEmail = obj.users[position];

                      var usersCycle = obj.cycles[0][userEmail];

                      if (usersCycle.auth.first_name == "" && usersCycle.auth.last_name == "") {


                        usersModel.find({ "value.email_address": userEmail }, 'value.email_address value.first_name value.last_name', function (err, res) {
                          var inspectorRes = _.map(res, function (obj) { return obj.toObject().value });
                          if (res.length > 0) {

                            obj.insp_auth_name = inspectorRes[0].first_name + " " + inspectorRes[0].last_name;

                            console.log("First name not present in auth ", obj.insp_auth_name);
                          }
                          console.log()
                          cb();

                        });
                      }
                      else {
                        obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                        cb();
                      }
                      //console.log(usersEmail," ", position,"..  . . .",obj.insp_auth_name)
                    }
                  }

                }
                else {
                  console.log("Not Present");
                  var state = obj.state;
                  console.log(state)
                  if (state == 2) {
                    var noOfUsers = obj.users.length;
                    if (noOfUsers == 2) {
                      var userEmail = obj.users[1];

                      var usersCycle = obj.cycles[0][userEmail];
                      obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;

                    }
                    else if (noOfUsers == 1) {
                      var userEmail = obj.users[0];

                      var usersCycle = obj.cycles[0][userEmail];
                      obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                    }
                    cb();
                  }

                  else if (state == 1) {
                    var noOfUsers = obj.users.length;
                    if (noOfUsers == 2) {
                      var userEmail = obj.users[1];
                      var usersCycle = obj.cycles[0][userEmail];
                      if (usersCycle.auth.first_name == "" && usersCycle.auth.last_name == "") {

                        //  var usersModel = models.usersModel();
                        usersModel.find({ "value.email_address": userEmail }, 'value.email_address value.first_name value.last_name', function (err, res) {
                          var inspectorRes = _.map(res, function (obj) { return obj.toObject().value });
                          if (res.length > 0) {

                            obj.insp_auth_name = inspectorRes[0].first_name + " " + inspectorRes[0].last_name;
                            //   console.log(obj.insp_auth_name);
                          }
                          cb();

                        });
                      }
                      else {
                        obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                        cb();
                      }
                    }
                    else if (noOfUsers == 1) {
                      var userEmail = obj.users[0];

                      var usersCycle = obj.cycles[0][userEmail];
                      obj.insp_auth_name = usersCycle.auth.first_name + " " + usersCycle.auth.last_name;
                      cb();
                    }
                  }

                }

              }, function () {

                inspJson = _.map(inspJson, function (insp) {
                  insp = _.omit(insp, ['filter_response', 'filter_auth_start_time', 'filter_auth_end_time', 'filter_is_invalid', 'inspection_with_filter']);
                  return insp;
                });
                console.log("---------", arg1)
                var finalJson = {
                  "total_rows": arg1,
                  "rows": inspJson
                };
                // res.json(finalJson);
                callback(null, finalJson);
              });
            }
          ], function (err, results) {
            res.json(results);
          });
        });
    }

  })
});


router.post('/api/:db/dailyreport', function (req, res, next) {

  var dbName = req.params.db;

  console.log(dbName);
  var switchModel;
  if (dbName == "cb")
    switchModel = models.switchModel();
  else if (dbName == "qa")
    switchModel = models.switchModel3();
  else if (dbName == "sw")
    switchModel = models.switchModel4();
  else if (dbName == "mn")
    switchModel = models.switchModel5();

  switchModel.find({ 'key': 'true' }).exec(function (err, docs) {
    var usersModel = models.usersModel(userModelName);
    var inspectionModel = models.inspectionModel(modelName);
    //console.log(docs[0].value);
    var modelName = 'inspectionModel_' + docs[0].value;
    var userModelName = 'usersModel_' + docs[0].value;
    if (dbName == "cb")                                        // traqModelLTRCB_DB
    {
      console.log(dbName);
      usersModel = models.usersModel(userModelName);
      inspectionModel = models.inspectionModel(modelName);
    }
    else if (dbName == "qa") {
      console.log(dbName);                            // traqModelLnT_DB
      usersModel = models.usersModel3(userModelName);
      inspectionModel = models.inspectionModel3(modelName);
    }
    else if (dbName == "sw") {
      console.log(dbName);                             // traqModelLnT_MN_DB
      usersModel = models.usersModel4(userModelName);
      inspectionModel = models.inspectionModel4(modelName);
    }
    else if (dbName == "mn") {
      console.log(dbName);                              // traqModelLnT_SW_DB
      usersModel = models.usersModel5(userModelName);
      inspectionModel = models.inspectionModel5(modelName);
    }

    if ((typeof (req.body.limit) == "undefined") || (typeof (req.body.skip) == "undefined")) {
      res.json("Something Went Wrong");
    }
    else {
      var query = { $or: [{ 'value.state': 1 }, { 'value.state': 2 }] };

      if (req.body.hasOwnProperty('fromDate')) {
        if (req.body.fromDate != "") {
          var startDate1 = moment(req.body.fromDate, 'DD-MM-YYYY');
          var fromDate = new Date(startDate1);
          var year = fromDate.getFullYear();
          var month = fromDate.getMonth() + 1;
          var date = fromDate.getDate();
          console.log(year + "..........." + date + "............" + month)
          if (date < 10) {
            date = '0' + date;
          }
          if (date < 10) {
            month = '0' + month;
          }
          console.log(">>>>>>>>>>>>>>  " + (year + "-" + month + "-" + date + " 00:00:00"));
          var fullStartDate = (year + "-" + month + "-" + date + " 00:00:00");

          query['value.submission_datetime'] = { $gte: fullStartDate };
        }
      }
      if (req.body.hasOwnProperty('toDate')) {
        if (req.body.toDate != "") {
          var endDate1 = moment(req.body.toDate, 'DD-MM-YYYY');
          var endDate = new Date(endDate1);
          var year = endDate.getFullYear();
          var month = endDate.getMonth() + 1;
          var date = endDate.getDate();

          if (date < 10) {
            date = '0' + date;
          }
          if (date < 10) {
            month = '0' + month;
          }
          var fullEndDate = (year + "-" + month + "-" + date + " 23:59:59");
          query['value.submission_datetime'] = { $lte: fullEndDate };
        }
      }
      console.log(query);
      inspectionModel.find(query)
        .sort({ 'value.submission_datetime': 'desc' })
        .limit(req.body.limit)
        .skip(req.body.skip)
        .exec(function (err, documents) {
          var inspJson = _.map(documents, function (obj) {
            var rowValue = obj.toObject()
            rowValue.value.id = obj.id
            return rowValue.value
          });
          var responseData = [];
          async.eachSeries(inspJson, function (obj, outerCB) {
            console.log(obj)
            var allCycles = obj.cycles;
            var userCount = obj.users.length;
            if (userCount == 1) {
              var user = obj.users[0];
              async.eachSeries(allCycles, function (cycle, callBack) {
                console.log("[[[[...]]]] " + cycle[user].checkpoints[0].response);
                responseData.push(retrievChecklistDataFor1User(obj, cycle, user));
                console.log(obj.inspection_id);
                callBack();
                // async.eachSeries(cycle[user].checkpoints, function(checkpoint, innerCB){

                //   if(checkpoint.response == 2 || checkpoint.response == 3)
                //   {
                //     var checkpointData = {};
                //     checkpointData.checkpoint_name = checkpoint.checkpoint;
                //     checkpointData.response = checkpoint.response;
                //     checkpointData.remarks = checkpoint.remarks;
                //     checkpointData.authoriser_name = cycle[user].auth.first_name + ' ' + cycle[user].auth.last_name;
                //     checkpointData.inspector_name = '---';
                //     checkpointData.inspection_id = obj.inspection_id;
                //     checkpointData.project = obj.project.name;
                //     checkpointData.level1_location = obj.project.location.name;
                //     checkpointData.discipline = obj.discipline.name;
                //     checkpointData.checklist_name = obj.name;
                //     checkpointData.forWhich = 'Checkpoint';
                //     checkpointData.inspection_status = obj.state;
                //     checkpointData.date = cycle[user].auth_timestamp;
                //     checkpointData.submission_datetime = obj.submission_datetime;
                //     responseData.push(checkpointData)
                //   }

                // }, function(){

                // });
              }, function () {
                outerCB();
              })
            }
            else if (userCount == 2) {
              var user1 = obj.users[0];

              async.eachSeries(allCycles, function (cycle, callBack) {

                async.eachSeries(cycle[user1].checkpoints, function (checkpoint, innerCB) {
                  if (checkpoint.response == 2 || checkpoint.response == 3) {
                    var checkpointData = {};
                    checkpointData.checkpoint_name = checkpoint.checkpoint;
                    checkpointData.response = checkpoint.response;
                    checkpointData.remarks = checkpoint.remarks;
                    checkpointData.authoriser_name = '---';
                    checkpointData.inspector_name = cycle[user1].inspector.first_name + ' ' + cycle[user1].inspector.last_name;
                    checkpointData.inspection_id = obj.inspection_id;
                    checkpointData.project = obj.project.name;
                    checkpointData.level1_location = obj.project.location.name;
                    checkpointData.discipline = obj.discipline.name;
                    checkpointData.checklist_name = obj.name;
                    checkpointData.forWhich = 'Checkpoint';
                    checkpointData.inspection_status = obj.state;
                    checkpointData.date = cycle[user1].auth_timestamp;
                    checkpointData.submission_datetime = obj.submission_datetime;
                    responseData.push(checkpointData)
                  }
                  innerCB();
                }, function () {
                  if (checkpoint.inspector.response == 2 || checkpoint.inspector.response == 3) {
                    var checkpointData = {};
                    checkpointData.checkpoint_name = "";
                    checkpointData.response = cycle[user1].inspector.response;
                    checkpointData.remarks = cycle[user1].inspector.remarks;
                    checkpointData.authoriser_name = '---';
                    checkpointData.inspector_name = cycle[user1].inspector.first_name + ' ' + cycle[user1].inspector.last_name;
                    checkpointData.inspection_id = obj.inspection_id;
                    checkpointData.project = obj.project.name;
                    checkpointData.level1_location = obj.project.location.name;
                    checkpointData.discipline = obj.discipline.name;
                    checkpointData.checklist_name = obj.name;
                    checkpointData.forWhich = 'Checkpoint';
                    checkpointData.inspection_status = obj.state;
                    checkpointData.date = cycle[user1].auth_timestamp;
                    checkpointData.submission_datetime = obj.submission_datetime;
                    responseData.push(checkpointData)
                  }
                  callBack();
                })


              }, function () {

              })
              var user2 = obj.users[1];
              async.eachSeries(allCycles, function (cycle, callBack) {
                // async.eachSeries(cycle[user2].checkpoints, function (checkpoint, innerCB) {
                //   if (checkpoint.response == 2 || checkpoint.response == 3) {
                //     var checkpointData = {};
                //     checkpointData.checkpoint_name = checkpoint.checkpoint;
                //     checkpointData.response = checkpoint.response;
                //     checkpointData.remarks = checkpoint.remarks;
                //     checkpointData.authoriser_name = cycle[user2].auth.first_name + ' ' + cycle[user2].auth.last_name;
                //     checkpointData.inspector_name = '---';
                //     checkpointData.inspection_id = obj.inspection_id;
                //     checkpointData.project = obj.project.name;
                //     checkpointData.level1_location = obj.project.location.name;
                //     checkpointData.discipline = obj.discipline.name;
                //     checkpointData.checklist_name = obj.name;
                //     checkpointData.forWhich = 'Checkpoint';
                //     checkpointData.inspection_status = obj.state;
                //     checkpointData.date = cycle[user2].auth_timestamp;
                //     checkpointData.submission_datetime = obj.submission_datetime;
                //     responseData.push(checkpointData)
                //   }
                //   innerCB();
                // }, function(){
                responseData.push(retrievChecklistDataFor1User(obj, cycle, user2)).then(function () {
                  if (checkpoint.auth.response == 2 || checkpoint.auth.response == 3) {
                    var checkpointData = {};
                    checkpointData.checkpoint_name = "";
                    checkpointData.response = cycle[user2].auth.response;
                    checkpointData.remarks = cycle[user2].auth.remarks;
                    checkpointData.authoriser_name = cycle[user2].auth.first_name + ' ' + cycle[user2].auth.last_name;
                    checkpointData.inspector_name = '---';
                    checkpointData.inspection_id = obj.inspection_id;
                    checkpointData.project = obj.project.name;
                    checkpointData.level1_location = obj.project.location.name;
                    checkpointData.discipline = obj.discipline.name;
                    checkpointData.checklist_name = obj.name;
                    checkpointData.forWhich = 'Checkpoint';
                    checkpointData.inspection_status = obj.state;
                    checkpointData.date = cycle[user2].auth_timestamp;
                    checkpointData.submission_datetime = obj.submission_datetime;
                    responseData.push(checkpointData)
                  }
                  callBack();
                })
              }, function () {
                outerCB();
              })
            }

          }, function () {
            res.json(responseData);
          });

        })
    }

  })
});

function retrievChecklistDataFor1User(obj, cycle, user) {
  var responseData = [];
  async.eachSeries(cycle[user].checkpoints, function (checkpoint, innerCB) {

    if (checkpoint.response == 2 || checkpoint.response == 3) {
      var checkpointData = {};
      checkpointData.checkpoint_name = checkpoint.checkpoint;
      checkpointData.response = checkpoint.response;
      checkpointData.remarks = checkpoint.remarks;
      checkpointData.authoriser_name = cycle[user].auth.first_name + ' ' + cycle[user].auth.last_name;
      checkpointData.inspector_name = '---';
      checkpointData.inspection_id = obj.inspection_id;
      checkpointData.project = obj.project.name;
      checkpointData.level1_location = obj.project.location.name;
      checkpointData.discipline = obj.discipline.name;
      checkpointData.checklist_name = obj.name;
      checkpointData.forWhich = 'Checkpoint';
      checkpointData.inspection_status = obj.state;
      checkpointData.date = cycle[user].auth_timestamp;
      checkpointData.submission_datetime = obj.submission_datetime;
      responseData.push(checkpointData)
    }
    innerCB();

  }, function () {
    return responseData;
  });
}


module.exports = router;
