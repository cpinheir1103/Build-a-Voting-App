var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var sqlite3 = require("sqlite3").verbose();
var fs = require("fs");
var file = "new.db"; 
var exists = fs.existsSync(file);
console.log("exists=" + exists);
var db = new sqlite3.Database(file);
console.log("db=" + db);

//////// FOR EJS /////
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
/////////////////////

////// DATABASE /////////////////////////////////////////////////////////
if (false) {
  db.serialize(function() {
    //db.run("DROP TABLE searchres");
    //console.log("DROPPING TABLE!");
    db.run("CREATE TABLE polls ( ID	INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE, name TEXT, option TEXT, votes INTEGER, owner INTEGER)");
    db.run("CREATE TABLE users ( ID	INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE, username TEXT, password TEXT)");
   
    console.log("CREATING TABLE!");
  });
}

if (false) {
  db.each("select name from sqlite_master where type='table'", function (err, table) {
          console.log(table);
  });
}

function newPollRec(name,option,votes,owner) {
  db.serialize(function() {

    //console.log("term=" + term);
    //console.log("stime=" + stime);
    var stmt = db.prepare("INSERT INTO polls(name, option, votes, owner) VALUES(?,?,?,?)");
    stmt.run(name, option, votes, owner);  
    stmt.finalize();
  });
  
  showTable("polls");
}

function procNewPoll(rb) {
  var optsArr = (rb.options).split(",");  // split options string into an array of options
  for (var i=0; i<optsArr.length; i++)
    newPollRec(rb.name, optsArr[i], 1, 0);
}

function procVote(rb) {  
  //rb.name  rb.options  
  db.serialize(function() {
    //UPDATE polls SET votes = votes + 1  WHERE name = '' and option = '';
    var stmt = db.prepare("UPDATE polls SET votes = votes + 1  WHERE name = '" + rb.name + "' and option = '" + rb.options + "';");
    stmt.run();  
    stmt.finalize();
  });
  
  showTable("polls");
}

function showTable(tbl) {
  db.serialize(function(url) {
    db.each("SELECT * FROM " + tbl, function(err, row) {
      console.log(row);
    });
  });
}

function getAllPollRecs(req, res) {
  var retArr = [];
  db.each("SELECT distinct name FROM polls", function(err, row) { 
      retArr.push({ "name": row.name });
      console.log(row.ID + ": " + row.name);
    },
      function complete(err, found) {
        res.writeHead(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify(retArr)); 
        res.end();
  });
  
}

function getAllOptionRecs(req, res) {
  var retArr = [];
  //req.query={"optname":"who are the cutest actresses"}
  db.each("SELECT * FROM polls where name='" + req.query.optname + "'", function(err, row) {
      retArr.push({ "name": row.name, "option": row.option, "votes": row.votes });
      console.log(row.ID + ": " + row.name + ": " + row.option + ": " + row.votes);
    },
      function complete(err, found) {
        res.writeHead(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify(retArr)); 
        res.end();
  });
}


////// ROUTING ///////////////////////////////////////////////////////////////////

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/newpoll', function(req, res) {
  res.sendFile(__dirname + '/views/newpoll.html');
});

app.get('/listpolls', function(req, res) {
  res.sendFile(__dirname + '/views/listpolls.html');
});

app.get('/showpoll', function(req, res) {
  console.log("req.parms=" + JSON.stringify(req.params));
  console.log("req.query=" + JSON.stringify(req.query));
  
  res.render('showpoll', {   
    pollname: req.query.name
  });
});

app.get('/getAllPolls', function(req, res) {
  getAllPollRecs(req, res);
});

app.get('/getAllOptions', function(req, res) {
  console.log("opts req.parms=" + JSON.stringify(req.params));
  console.log("opts req.query=" + JSON.stringify(req.query));
  getAllOptionRecs(req, res);
});


app.get('/testEJS', function(req, res) {
  res.render('testEJS', {   
    title: "EJS example",
    supplies: [ "fork", "knife", "spoon"]
  });
});

app.post('/savepoll', function(req,res){
    console.log(req.body);
    console.log("name=" + req.body.name);
    procNewPoll(req.body);    
});

app.post('/saveoption', function(req,res){
    console.log(req.body);
    console.log("name=" + req.body.name);
    console.log("option=" + req.body.options);
    procNewPoll(req.body);    
});

app.post('/vote', function(req,res){
    console.log(req.body);
    console.log("name=" + req.body.name);
    console.log("option=" + req.body.options);
    procVote(req.body);    
});

app.get('/test', function(req, res) {
 
    console.log('GET:....slow url is responding');
    var retObj = { "test" : "cool" };
    //res.write(retObj);
    res.send(retObj);
    //res.sendStatus(200);

})

// listen for requests :)
app.listen(8080);