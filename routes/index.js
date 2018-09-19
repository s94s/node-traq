var express = require('express');
var router = express.Router();
var request = require('request');
var models = require('../models/index')();
var ne = require('node-each');
var async = require('async');
var _ = require('lodash');
var fs = require('fs');
var moment = require('moment');
var mongoXlsx = require('mongo-xlsx');
var path = require('path');
var mime = require('mime');

models.prepareDatabase();
models.prepareDatabase3();
models.prepareDatabase4();
models.prepareDatabase5();


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
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


    if ((typeof (req.body.limit) == "undefined") || (typeof (req.body.skip) == "undefined")) {
      res.JSON("Something Went Wrong");
    }
//    else if (req.body.limit > 10) {
//      var response1 = {
//        "status": "FAILED",
//        "Msg": "Not able to access more than 10 Documents"
//      }
//      res.JSON(response1);
//    }
    else {
console.log("Datas : "+JSON.stringify(req.body));
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
        .exec(function (err, docs) 
        {
          var inspJson = _.map(docs, function (obj)
          {
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

              async.eachSeries(inspJson, function (obj, cb) 
              {

                obj.number_of_cycles = obj.cycles.length;
                obj.project_name = _.get(obj, 'project.name', '');''
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
                    else if (noOfUsers == 1) {
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
          ], function (err, results) 
          {
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
              // auth_timestamp = auth_timestamp.substring(0, 10);

              arrObj.value.filter_auth_start_time = moment(auth_timestamp, 'DD-MM-YYYY HH:mm:ss').unix();
              arrObj.value.filter_auth_end_time = moment(auth_timestamp, 'DD-MM-YYYY HH:mm:ss').unix();
              // console.log(moment(auth_timestamp,'DD-MM-YYYY').unix(),"   ",auth_timestamp);
            }
            else if (noOfUsers == 1) {
              var userEmail = arrObj.value.users[0];
              var auth_timestamp = arrObj.value.cycles[cyclesCount][userEmail].auth_timestamp;
              //  auth_timestamp = auth_timestamp.substring(0, 10);

              arrObj.value.filter_auth_start_time = moment(auth_timestamp, 'DD-MM-YYYY HH:mm:ss').unix();
              arrObj.value.filter_auth_end_time = moment(auth_timestamp, 'DD-MM-YYYY HH:mm:ss').unix();
            }
          }
          else if (arrObj.value.state == 1) {
            if (noOfUsers == 2) {
              var userEmail = arrObj.value.users[0];
              var auth_timestamp = arrObj.value.cycles[0][userEmail].saved_timestamp;
              // auth_timestamp = auth_timestamp.substring(0, 10);
              arrObj.value.filter_response = arrObj.value.cycles[cyclesCount][userEmail].auth.response;
              arrObj.value.filter_auth_start_time = moment(auth_timestamp, 'DD-MM-YYYY HH:mm:ss').unix();
              arrObj.value.filter_auth_end_time = moment(auth_timestamp, 'DD-MM-YYYY HH:mm:ss').unix();
            }
            else if (noOfUsers == 1) {
              var userEmail = arrObj.value.users[0];
              var auth_timestamp = arrObj.value.cycles[0][userEmail].saved_timestamp;
              //  auth_timestamp = auth_timestamp.substring(0, 10);
              arrObj.value.filter_response = arrObj.value.cycles[cyclesCount][userEmail].auth.response;
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
          console.log(arrObj);
          arrObj.value.inspection_with_filter = inspection_filter;
          models.inspectionModelQA().create(arrObj,
            function (err, result) {
              console.log(err, '.........', result)
              callback();
            });

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
//    else if (req.body.limit > 10) {
//      var response1 = {
//        "status": "FAILED",
//        "Msg": "Not able to access more than 10 Documents"
//      }
//      res.json(response1);
//    }
    else {
console.log("Request Body-:"+JSON.stringify(req.body));
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


//////////////////////////////////////////////////Daily Reports
router.post('/api/:db/dailyreport', function (req, res, next) {
  var dbName = req.params.db;
  console.log(dbName);
  var checklistRowsModel;
  if (dbName == "ei")
     checklistRowsModel = models.checklistRowsModel();
  else if (dbName == "cb")
     checklistRowsModel = models.checklistRowsModel3();
  else if (dbName == "sw")
     checklistRowsModel = models.checklistRowsModel4();
  else if (dbName == "mn")
     checklistRowsModel = models.checklistRowsModel5();  

    var query = {};
    var fullStartDate = "";
    var fullEndDate = "";
    var arrDates = [];
    if(req.body.hasOwnProperty('fromDate')){     
      if (req.body.fromDate != "") {
        var startDate1 = moment(req.body.fromDate, 'DD-MM-YYYY');
        var fromDate = new Date(startDate1);
        var year = fromDate.getFullYear();
        var month = fromDate.getMonth() + 1;
        var date = fromDate.getDate();
        //console.log(year + "..........." + date + "............" + month)
        if (date < 10) {
          date = '0' + date;
        }
        if (date < 10) {
          month = '0' + month;
        }
        var sdate = (year + "-" + month + "-" + date + " 00:00:00");       
        fullStartDate = moment(sdate, 'YYYY-MM-DD HH:mm:ss').unix();        
      //  query.filter_submission_datetime = {$gte : fullStartDate};
        arrDates[0] = query['filter_submission_datetime'];
      } 
    }
    if(req.body.hasOwnProperty('toDate')){     
      if (req.body.toDate != "") {
        var endDate1 = moment(req.body.toDate, 'DD-MM-YYYY');
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
        fullEndDate = moment(edate, 'YYYY-MM-DD HH:mm:ss').unix();
       // query.filter_submission_datetime = {$lte : fullEndDate};
        arrDates[1] = query['filter_submission_datetime'];
      } 
    }
    
    if (req.body.fromDate != "" && req.body.hasOwnProperty('fromDate') && req.body.toDate != "" && req.body.hasOwnProperty('toDate')) {

      var objForQuery = [
        {
          "filter_submission_datetime": {
            $gte: fullStartDate
          }
        },
        {
          "filter_submission_datetime": {
            $lte: fullEndDate
          }
        }
      ]
      query['$and'] = objForQuery;
    }
    else if (req.body.fromDate != "" && req.body.hasOwnProperty('fromDate')) {
      query['filter_submission_datetime'] = { $gte: fullStartDate };
    }
    else if (req.body.toDate != "" && req.body.hasOwnProperty('toDate')) {
      query['filter_submission_datetime'] = { $lte: fullEndDate };
    }
  
    checklistRowsModel.find(query)
      .sort({ 'submission_datetime': 'desc', 'sortingFilter' : 'desc' })
      .limit(req.body.limit)
      .skip(req.body.skip)
      .exec(function (err, documents) {
        var inspJson = _.map(documents, function (obj) {
          var rowValue = obj.toObject()
          return rowValue
        });
        var checklistsCount = 0;
        checklistRowsModel.count(query, function (err, cnt) {
          checklistsCount = cnt;
          // var groupedChecklist = _.groupBy(inspJson, 'inspection_id');
          // console.log("Grouped Data :  "+JSON.stringify(groupedChecklist));
          // var groupedChecklist = _.uniq(_.map(inspJson, 'inspection_id'));
          // console.log("Grouped Data :  "+JSON.stringify(groupedChecklist));
          
          // async.eachSeries(groupedChecklist, function(checklistSingle, cb) {

          //   var checklistObj = _.find(inspJson, function (obj) { return obj.inspection_id == checklistSingle; });
          //   console.log(JSON.stringify(checklistObj));
          // });

          var finalJson = {
            "total_rows": checklistsCount,
            "rows": inspJson
          };
          res.json(finalJson);
        });
      })
  
});


router.post('/api/:db/downloaddailyreports', function (req, res, next) {

  req.setTimeout(5000000);
  var dbName = req.params.db;
  console.log(dbName);
  var checklistRowsModel;
  if (dbName == "ei")
    checklistRowsModel = models.checklistRowsModel();
  else if (dbName == "cb")
    checklistRowsModel = models.checklistRowsModel3();
  else if (dbName == "sw")
    checklistRowsModel = models.checklistRowsModel4();
  else if (dbName == "mn")
    checklistRowsModel = models.checklistRowsModel5();

  var filtersData = JSON.parse(JSON.stringify(req.body));
  var fullStartDate = "";
  var fullEndDate = "";
  var arrDates = [];
  var query = {};
  if (filtersData.hasOwnProperty('fromDate')) {
    if (filtersData.fromDate != "") {
      var startDate1 = moment(filtersData.fromDate, 'DD-MM-YYYY');
      var fromDate = new Date(startDate1);
      var year = fromDate.getFullYear();
      var month = fromDate.getMonth() + 1;
      var date = fromDate.getDate();
      //console.log(year + "..........." + date + "............" + month)
      if (date < 10) {
        date = '0' + date;
      }
      if (date < 10) {
        month = '0' + month;
      }
      var sdate = (year + "-" + month + "-" + date + " 00:00:00");
      //console.log(">>>>>>>>>>>>>>  " + sdate);
      var fullStartDate = moment(sdate, 'YYYY-MM-DD HH:mm:ss').unix();
      
      arrDates[0] = query['filter_submission_datetime'];
    }
  }

  if (filtersData.hasOwnProperty('toDate')) {
    if (filtersData.toDate != "") {
      var endDate1 = moment(filtersData.toDate, 'DD-MM-YYYY');
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
      
      arrDates[1] = query['filter_submission_datetime'];
    }
  }


  if (filtersData.fromDate != "" && filtersData.hasOwnProperty('fromDate') && filtersData.toDate != "" && filtersData.hasOwnProperty('toDate')) {

    var objForQuery = [
      {
        "filter_submission_datetime": {
          $gte: fullStartDate
        }
      },
      {
        "filter_submission_datetime": {
          $lte: fullEndDate
        }
      }
    ]
    query['$and'] = objForQuery;
  }
  else if (filtersData.fromDate != "" && filtersData.hasOwnProperty('fromDate')) {
    query['filter_submission_datetime'] = { $gte: fullStartDate };
  }
  else if (filtersData.toDate != "" && filtersData.hasOwnProperty('toDate')) {
    query['filter_submission_datetime'] = { $lte: fullEndDate };
  }

  console.log("Query filters :   " + JSON.stringify(query));
  checklistRowsModel.find(query)
    .maxTime(300000)
    .sort({ 'submission_datetime': 'desc', 'sortingFilter' : 'desc' })
    // .limit(req.body.limit)
    // .skip(req.body.skip)
    .exec(function (err, docs) {
      var checklistJsonAll = _.map(docs, function (obj) {
        var rowValue = obj.toObject()
        return rowValue
      });

      checklistJsonAll = JSON.parse(JSON.stringify(checklistJsonAll));
      console.log(checklistJsonAll.length)
      var finalPreparedJson = [];
      async.each(checklistJsonAll, function (checklistJson, outerCallBack) {
        var prepareJson = {};

        if(checklistJson.hasOwnProperty('submission_datetime')) {
          var strDate =  _.get(checklistJson, 'submission_datetime', '');         
          
          var sDate = moment(strDate, 'YYYY-MM-DD HH:mm:ss').add(19800, 's');
          console.log(sDate);
          sDate = sDate.format('DD-MM-YYYY HH:mm:ss');
          prepareJson.Submission_Date = sDate;
        }
        if(checklistJson.hasOwnProperty('inspection_id')) {
          prepareJson.Inspection_Id = checklistJson.inspection_id;
        }
        if(checklistJson.hasOwnProperty('project')) {
          prepareJson.Project_Name = checklistJson.project;
        }
        if(checklistJson.hasOwnProperty('level1_location')) {
          prepareJson.Location = checklistJson.level1_location;
        }
        if(checklistJson.hasOwnProperty('discipline')) {
          prepareJson.Discipline = checklistJson.discipline;
        }
        if(checklistJson.hasOwnProperty('sub_discipline')) {
          prepareJson.Subgroup = checklistJson.sub_discipline;
        }
        if(checklistJson.hasOwnProperty('checklist_name')) {
          prepareJson.Checklist_Name = checklistJson.checklist_name;
        }
        if(checklistJson.hasOwnProperty('checkpoint_name')) {
          prepareJson.Checkpoint_Name = checklistJson.checkpoint_name;
        }
        if(checklistJson.hasOwnProperty('forWhich')) {
          prepareJson.Rejected_For = checklistJson.forWhich;
        }
        if(checklistJson.hasOwnProperty('remarks')) {
          prepareJson.Reason = checklistJson.remarks;
        }
        if (checklistJson.hasOwnProperty('response')) {
          var response = checklistJson.response;          
          if (response == 2)
            prepareJson.Response = 'AWC';
          else if (response == 3)
            prepareJson.Response = 'R';
          else
            prepareJson.Response = '';
        }
        if(checklistJson.hasOwnProperty('authoriser_name')) {
          prepareJson.Authoriser_Name = checklistJson.authoriser_name;
        }
        if(checklistJson.hasOwnProperty('inspector_name')) {
          prepareJson.Inspector_Name = checklistJson.inspector_name;
        }
        if(checklistJson.hasOwnProperty('iterations')) {
          prepareJson.Iterations = checklistJson.iterations;
        }
        if (checklistJson.hasOwnProperty('inspection_status')) {
          var status = checklistJson.inspection_status;          
          if (status == 1)
            prepareJson.Inspection_Status = 'Pending';
          else if (status == 2)
            prepareJson.Inspection_Status = 'Completed';
          else
            prepareJson.Inspection_Status = '';
        }
        finalPreparedJson.push(prepareJson);
        outerCallBack();
        
      }, function () {

        var dateNow = moment(Date.now()).format('DD_MM_YYYY')
        var options = {
          save: true,
          sheetName: [],
          fileName: "TraQ_Daily_Report_" + dateNow + ".xlsx",
          defaultSheetName: "TraQ_Daily_Report_" + dateNow
        }

        var model = mongoXlsx.buildDynamicModel(finalPreparedJson);

        mongoXlsx.mongoData2Xlsx(finalPreparedJson, model, options, function (err, data) {
          console.log('File saved at:', data.fullPath);

          var file = data.fullPath;
          var resData = {
            "url": file
          }
          res.json(resData);
        })
      });
    })
});


router.post('/api/:db/downloadexcel', function (req, res, next) {

  req.setTimeout(5000000);
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

    if (req.body.hasOwnProperty('filters'))
      var filtersData = req.body.filters;
    if (req.body.hasOwnProperty('columns'))
      var columnsData = req.body.columns;

    var query = { 'value.state': 2 };
    if (filtersData.hasOwnProperty('user_type') && filtersData.hasOwnProperty('inspector') && filtersData.hasOwnProperty('discipline') &&
      filtersData.hasOwnProperty('vendor') && filtersData.hasOwnProperty('p_num')) {
      if (filtersData.hasOwnProperty('user_type')) {
        if (filtersData.user_type != "" && filtersData.user_type != 'any') {
          if (filtersData.user_type == 'inspector') {
            query['value.users.0'] = filtersData.inspector;
          }
          else {
            query['value.inspection_with_filter.value'] = filtersData.inspector;
          }
        }
      }
      if (filtersData.hasOwnProperty('discipline')) {
        if (filtersData.discipline != "") {
          if (filtersData.discipline != 'any') {
            query['value.discipline.name'] = filtersData.discipline;

            if (filtersData.hasOwnProperty('subgroup')) {
              if (filtersData.subgroup != 'any') {
                query['value.discipline.subgroup.name'] = filtersData.subgroup;
              }
            }
          }
        }
      }

      if (filtersData.hasOwnProperty('vendor')) {
        if (filtersData.vendor != 'any' && filtersData.vendor != "") {
          if (filtersData.vendor == "Other") {
            query['value.vendor.name'] = filtersData.vendor;
          }
          else {
            query['value.vendor.email_address'] = filtersData.vendor;
          }
        }
      }

      if (filtersData.hasOwnProperty('p_num')) {
        if (filtersData.p_num != 'any' && filtersData.p_num != "") {
          query['value.project.num'] = filtersData.p_num;
        }
      }

      if (filtersData.hasOwnProperty('response')) {
        if (filtersData.response != 'any' && filtersData.response != "") {
          query['value.filter_response'] = filtersData.response;
        }
      }
      var fullStartDate = "";
      var fullEndDate = "";
      var arrDates = [];
      if (filtersData.hasOwnProperty('from')) {
        if (filtersData.from != "") {
          var startDate1 = moment(filtersData.from, 'DD-MM-YYYY');
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
          //           var startDate = moment(filtersData.from, 'DD-MM-YYYY').unix();
          // query['value.filter_submission_datetime'] = { $gte: fullStartDate };
          arrDates[0] = query['value.filter_submission_datetime'];
        }
      }

      if (filtersData.hasOwnProperty('to')) {
        if (filtersData.to != "") {
          var endDate1 = moment(filtersData.to, 'DD-MM-YYYY');
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
          // var endDate = moment(filtersData.to, 'DD-MM-YYYY').unix();
          // query['value.filter_submission_datetime'] = { $lte: fullEndDate };
          arrDates[1] = query['value.filter_submission_datetime'];
        }
      }


      if (filtersData.from != "" && filtersData.hasOwnProperty('from') && filtersData.to != "" && filtersData.hasOwnProperty('to')) {

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
      else if (filtersData.from != "" && filtersData.hasOwnProperty('from')) {
        query['value.filter_submission_datetime'] = { $gte: fullStartDate };
      }
      else if (filtersData.to != "" && filtersData.hasOwnProperty('to')) {
        query['value.filter_submission_datetime'] = { $lte: fullEndDate };
      }
    }
      console.log("Query filters.. "+JSON.stringify(req.body));
    inspectionModel.find(query)
      .maxTime(300000)
      //.sort({ 'value.submission_datetime': 'desc' })
      // .limit(req.body.limit)
      // .skip(req.body.skip)
      .exec(function (err, docs) {

        var inspJsonAll = _.map(docs, function (obj) {
          var rowValue = obj.toObject()
          rowValue.value.id = obj.id         
          return rowValue.value
        });

        inspJsonAll = JSON.parse(JSON.stringify(inspJsonAll));
        console.log(inspJsonAll.length);
        var finalPreparedJson = [];
        async.each(inspJsonAll, function (inspJson, outerCallBack) {
          var prepareJson = {};
          if (columnsData.hasOwnProperty('project_number')) {
            prepareJson.ProjectNumber = inspJson.project.num;
          //  console.log(inspJson.project.num)
          }
          if (columnsData.hasOwnProperty('project_name')) {
            prepareJson.ProjectTitle = inspJson.project.name;
          }
          if (columnsData.hasOwnProperty('discipline_name')) {
            prepareJson.DisciplineName = _.get(inspJson, 'discipline.name', '');
          }
          if (columnsData.hasOwnProperty('subgroup_name')) {
            prepareJson.SubgroupName = _.get(inspJson, 'discipline.subgroup.name', '');
          }
          if (columnsData.hasOwnProperty('inspection_id')) {
            prepareJson.InspectionId = inspJson.inspection_id;
            //console.log(inspJson.inspection_id);
          }
          if (columnsData.hasOwnProperty('checklist_id')) {
            prepareJson.ChecklistId = inspJson.identifier;
          }
          if (columnsData.hasOwnProperty('checklist_name')) {
            prepareJson.ChecklistName = inspJson.name;
          }
          if (columnsData.hasOwnProperty('loc_1')) {
            prepareJson.Location_1 = _.get(inspJson.project.location, 'name', '');
//          if (columnsData.hasOwnProperty('loc_2')) {
//              if(inspJson.hasOwnProperty('project')) {
//                  if(inspJson.project.hasOwnProperty('location')) {
//            if (inspJson.project.location.hasOwnProperty('location')) {
//              prepareJson.Location_2 = inspJson.project.location.location.name;
//              if (columnsData.hasOwnProperty('loc_3')) {
//                if (inspJson.project.location.location.hasOwnProperty('location')) {
//                  prepareJson.Location_3 = inspJson.project.location.location.location.name;
//                  if (columnsData.hasOwnProperty('loc_4')) {
//                    if (inspJson.project.location.location.location.hasOwnProperty('location'))
//                      prepareJson.Location_4 = inspJson.project.location.location.location.location.name;
//                    else
//                      prepareJson.Location_4 = "";
//                  }
//                } else
//                  prepareJson.Location_3 = "";
//              }
//            } else 
//              prepareJson.Location_2 = "";
//            } 
//          } 
//          }              
          }
            if (columnsData.hasOwnProperty('loc_2')) {
                            if (inspJson.hasOwnProperty('project')) {
                                if (inspJson.project.hasOwnProperty('location')) {
                                    if (inspJson.project.location.hasOwnProperty('location')) {
                                        prepareJson.Location_2 = inspJson.project.location.location.name;
                                    } else {
                                        prepareJson.Location_2 = "";   
                                    }
                                } else {
                                    prepareJson.Location_2 = "";
                                }
                            } else {
                                prepareJson.Location_2 = "";
                            }
                        }
                        if (columnsData.hasOwnProperty('loc_3')) {
                            if (inspJson.hasOwnProperty('project')) {
                                if (inspJson.project.hasOwnProperty('location')) {
                                    if (inspJson.project.location.hasOwnProperty('location')) {
                                        if (inspJson.project.location.location.hasOwnProperty('location')) {
                                            prepareJson.Location_3 = inspJson.project.location.location.location.name;
                                        } else {
                                            prepareJson.Location_3 = "";   
                                        }
                                    } else {
                                        prepareJson.Location_3 = "";
                                    }
                                } else {
                                    prepareJson.Location_3 = "";
                                }
                            } else {
                                prepareJson.Location_3 = "";
                            }
                        }
                        if (columnsData.hasOwnProperty('loc_4')) {
                            if (inspJson.hasOwnProperty('project')) {
                                if (inspJson.project.hasOwnProperty('location')) {
                                    if (inspJson.project.location.hasOwnProperty('location')) {
                                        if (inspJson.project.location.location.hasOwnProperty('location')) {
                                            if (inspJson.project.location.location.location.hasOwnProperty('location'))
                                                prepareJson.Location_4 = inspJson.project.location.location.location.location.name;
                                            else {
                                                prepareJson.Location_4 = "";   
                                            }
                                        } else {
                                            prepareJson.Location_4 = "";
                                        }
                                    } else {
                                        prepareJson.Location_4 = "";
                                    }
                                } else {
                                    prepareJson.Location_4 = "";
                                }
                            } else {
                                prepareJson.Location_4 = "";
                            }
                        }
          if (columnsData.hasOwnProperty('loc_desc')) {
            prepareJson.LocationDescription = inspJson.project.location_description;
          }
          if (columnsData.hasOwnProperty('tags')) {
            var tags = "";
            async.eachSeries(inspJson.tags, function (tag, callb) {
              tags = tags + "," + tag;
            })
            var ind = tags.lastIndexOf(",");
            tags = tags.slice(0, ind);
            prepareJson.Tags = tags;
          }
             if (columnsData.hasOwnProperty('vendor')) {
            prepareJson.Vendor = _.get(inspJson.vendor, 'name', '');
          }
          if (columnsData.hasOwnProperty('start_date')) {
            var userCount = inspJson.users.length;
            if (userCount == 2) {
              var inspectorEmail = inspJson.cycles[0].submitters;
              var strDate = _.get(inspJson.cycles[0][inspectorEmail], 'saved_timestamp', '');
              var sDate = moment(strDate, 'DD-MM-YYYY HH:mm:ss').add(19800, 's');
              sData = sDate.format('DD-MM-YYYY HH:mm:ss');
            //  console.log("Start date-- = "+sDate)
            //  prepareJson.StartDate = _.get(inspJson.cycles[0][inspectorEmail], 'saved_timestamp', '');
            prepareJson.StartDate =sData;
          }
            else if (userCount == 1) {
              var authoriserEmail = inspJson.cycles[0].authorisers;
              var strDate = _.get(inspJson.cycles[0][authoriserEmail], 'saved_timestamp', '');
              var sDate = moment(strDate, 'DD-MM-YYYY HH:mm:ss').add(19800, 's');
              sData = sDate.format('DD-MM-YYYY HH:mm:ss');
              //console.log("Start date-- = "+sDate)
            //  prepareJson.StartDate = _.get(inspJson.cycles[0][authoriserEmail], 'saved_timestamp', '');
            prepareJson.StartDate =sData;
          }
          }
          if (columnsData.hasOwnProperty('inspection_date')) {
            var authoriserEmail = inspJson.cycles[inspJson.cycles.length - 1].authorisers;
            var strDate  = _.get(inspJson.cycles[inspJson.cycles.length - 1][authoriserEmail], 'submission_timestamp', '');
            var sDate = moment(strDate, 'DD-MM-YYYY HH:mm:ss').add(19800, 's');
            sData = sDate.format('DD-MM-YYYY HH:mm:ss');
            prepareJson.SubmittedDate =sData;
        
        
          }
          if (columnsData.hasOwnProperty('authorisation_date')) {
             var authoriserEmail = inspJson.cycles[inspJson.cycles.length - 1].authorisers;
            // prepareJson.AuthorisedDate = _.get(inspJson.cycles[inspJson.cycles.length - 1][authoriserEmail], 'auth_timestamp', '');
        
            var strDate  = _.get(inspJson.cycles[inspJson.cycles.length - 1][authoriserEmail], 'auth_timestamp', '');
            var sDate = moment(strDate, 'DD-MM-YYYY HH:mm:ss').add(19800, 's');
            sData = sDate.format('DD-MM-YYYY HH:mm:ss');
            prepareJson.AuthorisedDate =sData;
        
        
          }
       
          if (columnsData.hasOwnProperty('inspector_id')) {
            var inspectorEmail = inspJson.cycles[inspJson.cycles.length - 1].submitters;
            prepareJson.InspectorId = _.get(inspJson.cycles[inspJson.cycles.length - 1][inspectorEmail], 'inspector.identifier', '');
          }
          if (columnsData.hasOwnProperty('inspector_name')) {
            var inspectorEmail = inspJson.cycles[inspJson.cycles.length - 1].submitters;
            //console.log(inspJson.inspection_id + "................>>>>> Emailid----   " + inspJson.cycles[inspJson.cycles.length - 1][inspectorEmail]);
            if (inspJson.cycles[inspJson.cycles.length - 1].hasOwnProperty(inspectorEmail)) {
              prepareJson.InspectorName = inspJson.cycles[inspJson.cycles.length - 1][inspectorEmail].inspector.first_name + ' ' +
                inspJson.cycles[inspJson.cycles.length - 1][inspectorEmail].inspector.last_name;
            } else {
              prepareJson.InspectorName = '';
            }
          }
          if (columnsData.hasOwnProperty('inspector_organization')) {
            var inspectorEmail = inspJson.cycles[inspJson.cycles.length - 1].submitters;
            if (inspJson.cycles[inspJson.cycles.length - 1].hasOwnProperty(inspectorEmail))
              prepareJson.InspectorOrganization = inspJson.cycles[inspJson.cycles.length - 1][inspectorEmail].inspector.company;
          }
          if (columnsData.hasOwnProperty('inspector_response')) {
            var inspectorEmail = inspJson.cycles[inspJson.cycles.length - 1].submitters;
            if (inspJson.cycles[inspJson.cycles.length - 1].hasOwnProperty(inspectorEmail))
              var response = inspJson.cycles[inspJson.cycles.length - 1][inspectorEmail].inspector.response;
            if (response == 1)
              prepareJson.InspectorResponse = 'A';
            else if (response == 2)
              prepareJson.InspectorResponse = 'AWC';
            else if (response == 3)
              prepareJson.InspectorResponse = 'R';
            else
              prepareJson.InspectorResponse = '';
          }
          if (columnsData.hasOwnProperty('inspector_designation')) {
            var inspectorEmail = inspJson.cycles[inspJson.cycles.length - 1].submitters;
            if (inspJson.cycles[inspJson.cycles.length - 1].hasOwnProperty(inspectorEmail))
              prepareJson.InspectorDesignation = inspJson.cycles[inspJson.cycles.length - 1][inspectorEmail].inspector.designation;
          }
          if (columnsData.hasOwnProperty('inspector_comments')) {
            var inspectorEmail = inspJson.cycles[inspJson.cycles.length - 1].submitters;
            if (inspJson.cycles[inspJson.cycles.length - 1].hasOwnProperty(inspectorEmail)) {
              var response = inspJson.cycles[inspJson.cycles.length - 1][inspectorEmail].inspector.remarks;
              if (response == 1)
                prepareJson.InspectorComments = 'A';
              else if (response == 2)
                prepareJson.InspectorComments = 'AWC';
              else if (response == 3)
                prepareJson.InspectorComments = 'R';
              else
                prepareJson.InspectorComments = '';
            }
          }
          if (columnsData.hasOwnProperty('authoriser_id')) {
            var authoriserEmail = inspJson.cycles[inspJson.cycles.length - 1].authorisers;
            prepareJson.AuthoriserId = inspJson.cycles[inspJson.cycles.length - 1][authoriserEmail].auth.identifier;
          }
          if (columnsData.hasOwnProperty('authoriser_name')) {
            var authoriserEmail = inspJson.cycles[inspJson.cycles.length - 1].authorisers;
            prepareJson.AuthoriserName = inspJson.cycles[inspJson.cycles.length - 1][authoriserEmail].auth.first_name + ' ' +
              inspJson.cycles[inspJson.cycles.length - 1][authoriserEmail].auth.last_name;
          }
          if (columnsData.hasOwnProperty('authoriser_organization')) {
            var authoriserEmail = inspJson.cycles[inspJson.cycles.length - 1].authorisers;
            prepareJson.AuthoriserOrganization = inspJson.cycles[inspJson.cycles.length - 1][authoriserEmail].auth.company;
          }
          if (columnsData.hasOwnProperty('authoriser_designation')) {
            var authoriserEmail = inspJson.cycles[inspJson.cycles.length - 1].authorisers;
            prepareJson.AuthoriserDesignation = inspJson.cycles[inspJson.cycles.length - 1][authoriserEmail].auth.designation;
          }
          if (columnsData.hasOwnProperty('authoriser_response')) {
            var authoriserEmail = inspJson.cycles[inspJson.cycles.length - 1].authorisers;
            var response = inspJson.cycles[inspJson.cycles.length - 1][authoriserEmail].auth.response;
            if (response == 1)
              prepareJson.AuthoriserResponse = 'A';
            else if (response == 2)
              prepareJson.AuthoriserResponse = 'AWC';
            else if (response == 3)
              prepareJson.AuthoriserResponse = 'R';
            else
              prepareJson.AuthoriserResponse = '';
          }
          if (columnsData.hasOwnProperty('authoriser_comments')) {
            var authoriserEmail = inspJson.cycles[inspJson.cycles.length - 1].authorisers;
            prepareJson.AuthoriserComments = inspJson.cycles[inspJson.cycles.length - 1][authoriserEmail].auth.remarks;
          }
          finalPreparedJson.push(prepareJson);
          outerCallBack();
        }, function () {

          //console.log("Data from Mongo = = =  " + JSON.stringify(finalPreparedJson))

 var dateNow = moment(Date.now()).format('DD_MM_YYYY')
        var options =  {
          save: true,
          sheetName: [],
          fileName: "TraQ_Report_" + dateNow + ".xlsx",
    defaultSheetName: "TraQ_Report_" + dateNow
        }


          var model = mongoXlsx.buildDynamicModel(finalPreparedJson);

          //console.log(model)
          /* Generate Excel */
          mongoXlsx.mongoData2Xlsx(finalPreparedJson, model, options, function (err, data) {
            console.log('File saved at:', data.fullPath);

            // res.sendFile('f:/git/Track-nodejs/'+data.fullPath, function (err) {
            //   console.log('---------- error downloading file: ' + err);
            // });
            // res.download('/git/Track-nodejs/'+data.fullPath);


            var file = data.fullPath;
            //   console.log(file);
            //   var filename = path.basename(file);
            //   var mimetype = mime.lookup(file);
            // console.log("file name : "+mimetype);
            //   res.setHeader('Content-disposition', 'attachment; filename=' + filename);
            //   res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            //   res.download(file, function(err){
            //     if(err) console.log(err);
            //   });
            var resData = {
              "url": file
            }
            res.json(resData);
            // var filestream = fs.createReadStream(file);
            // filestream.pipe(res);
          })
        });
      })
  })
});


router.post('/api/:db/detailedreport', function (req, res, next) {
  var dbName = req.params.db;
  console.log(dbName);

var checklistRowsModel;
 if (dbName == "ei")
     checklistRowsModel = models.checklistRowsModel();
  else if (dbName == "cb")
     checklistRowsModel = models.checklistRowsModel3();
  else if (dbName == "sw")
     checklistRowsModel = models.checklistRowsModel4();
  else if (dbName == "mn")
     checklistRowsModel = models.checklistRowsModel5(); 

    var query = {};
    var fullStartDate = "";
    var fullEndDate = "";
    var arrDates = [];
    if(req.body.hasOwnProperty('fromDate')){     
      if (req.body.fromDate != "") {
        var startDate1 = moment(req.body.fromDate, 'DD-MM-YYYY');
        var fromDate = new Date(startDate1);
        var year = fromDate.getFullYear();
        var month = fromDate.getMonth() + 1;
        var date = fromDate.getDate();
        //console.log(year + "..........." + date + "............" + month)
        if (date < 10) {
          date = '0' + date;
        }
        if (date < 10) {
          month = '0' + month;
        }
        var sdate = (year + "-" + month + "-" + date + " 00:00:00");       
        fullStartDate = moment(sdate, 'YYYY-MM-DD HH:mm:ss').unix();        
      //  query.filter_submission_datetime = {$gte : fullStartDate};
        arrDates[0] = query['filter_submission_datetime'];
      } 
    }
    if(req.body.hasOwnProperty('toDate')){     
      if (req.body.toDate != "") {
        var endDate1 = moment(req.body.toDate, 'DD-MM-YYYY');
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
        fullEndDate = moment(edate, 'YYYY-MM-DD HH:mm:ss').unix();
       // query.filter_submission_datetime = {$lte : fullEndDate};
        arrDates[1] = query['filter_submission_datetime'];
      } 
    }
    
    if (req.body.fromDate != "" && req.body.hasOwnProperty('fromDate') && req.body.toDate != "" && req.body.hasOwnProperty('toDate')) {

      var objForQuery = [
        {
          "filter_submission_datetime": {
            $gte: fullStartDate
          }
        },
        {
          "filter_submission_datetime": {
            $lte: fullEndDate
          }
        }
      ]
      query['$and'] = objForQuery;
    }
    else if (req.body.fromDate != "" && req.body.hasOwnProperty('fromDate')) {
      query['filter_submission_datetime'] = { $gte: fullStartDate };
    }
    else if (req.body.toDate != "" && req.body.hasOwnProperty('toDate')) {
      query['filter_submission_datetime'] = { $lte: fullEndDate };
    }
  
    checklistRowsModel.find(query)
      // .sort({ 'count_sorted': 'desc' })
      .sort({ 'submission_datetime': 'desc', 'sortingFilter' : 'desc' })
      .limit(req.body.limit)
      .skip(req.body.skip)
      .exec(function (err, documents) {
        var inspJson = _.map(documents, function (obj) {
          var rowValue = obj.toObject()
          return rowValue
        });
  // console.log("Detailed report Totar Rows Retrieved = "+inspJson.length);
  // console.log("Detailed report = "+inspJson.length);
        var checklistsCount = 0;
        checklistRowsModel.count(query, function (err, cnt) {
          checklistsCount = cnt;

          var finalJson = {
            "total_rows": checklistsCount,
            "rows": inspJson
          };
          console.log("Detailed report = "+finalJson.total_rows);
          res.json(finalJson);
        });
      })
  
  
});


router.get('/download/:url', function (req, res, next) {

  var url = req.params.url;
  console.log(url)
  res.download(url);

})

module.exports = router;
