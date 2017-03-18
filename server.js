var express = require('express');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');
var app = express();


/////// FOR SQLITE3   ////////
var sqlite3 = require("sqlite3").verbose();
var fs = require("fs");
var file = "new.db"; 
var exists = fs.existsSync(file);
console.log("exists=" + exists);
var db = new sqlite3.Database(file);
console.log("db=" + db);
//////// FOR EJS //////////
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
//////////////////////////



////// DATABASE /////////////////////////////////////////////////////////
if (false) {
  db.serialize(function() {
    //db.run("DROP TABLE polls");
    //console.log("DROPPING TABLE!");
    db.run("CREATE TABLE polls ( ID	INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE, name TEXT, option TEXT, votes INTEGER, owner INTEGER)");
    //db.run("CREATE TABLE users ( ID	INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE, username TEXT, password TEXT)");
   
    console.log("CREATING TABLE!");
  });
}

if (false) {
  db.each("select name from sqlite_master where type='table'", function (err, table) {
          console.log(table);
  });
}

function procRegister(rb) {
  db.serialize(function() {
    var stmt = db.prepare("INSERT INTO users(username, password) VALUES(?,?)");
    stmt.run(rb.username, rb.password);  
    stmt.finalize();
  });
  
  showTable("users");
}

function procLogin(req, res) {
  //console.log("req.body.username=" + req.body.username); 
  //console.log("req.body.password=" + req.body.password); 
  db.each("SELECT * FROM users where username = '" + req.body.username + "' and password = '" + req.body.password + "'", 
    function(err, row) { 
      //console.log("row.username=" + row.username); 
      req.session.authuser = row.username;
    },
      function complete(err, found) {
        //res.status(500).send({error: 'you have an error'}); 
        if (req.session.authuser === undefined) {
          res.writeHead(500, {"Content-Type": "application/json"});
          res.end();
        }
        else  
        {
          //res.writeHead(200, {"Content-Type": "application/json"});
          res.end('{"success" : "Updated Successfully", "status" : 200}');
        }
        
  });
  
}

function newPollRec(name,option,votes,owner) {
  db.serialize(function() {
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

function procDelPoll(rb) {  
  db.serialize(function() {
    var stmt = db.prepare("DELETE FROM polls where name = '" + rb.name + "'");
    stmt.run();  
    stmt.finalize();
  });
  
  showTable("polls");
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
app.use(cookieParser());
app.use(expressSession({secret: 'viush78474hffhs4'}));

app.get("/", function (req, res) {
  //req.session.authuser = undefined;          // temporarily hardcode no logged in user. 
  req.session.authuser = "cpinheir";  // temporarily hardcode a logged in user. 
  console.log("req.session.authuser=" + req.session.authuser);
  
  res.redirect('/listpolls');
});

app.get('/newpoll', function(req, res) {
   if (req.session.authuser === undefined) {
     res.render('listpolls', {   
       authuser: req.session.authuser
     });
   }
   else {
      res.render('newpoll', {   
        authuser: req.session.authuser
      });
   }
  
  //res.sendFile(__dirname + '/views/newpoll.html');
});

app.get('/listpolls', function(req, res) {  
  console.log("req.session.authuser=" + req.session.authuser);
  res.render('listpolls', {   
    authuser: req.session.authuser
  });
  
  //res.sendFile(__dirname + '/views/listpolls.html'); 
});

app.get('/showpoll', function(req, res) {
  console.log("req.parms=" + JSON.stringify(req.params));
  console.log("req.query=" + JSON.stringify(req.query));
  
  res.render('showpoll', {   
    pollname: req.query.name,
    authuser: req.session.authuser
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

app.post('/savepoll', function(req,res){
    console.log(req.body);
    console.log("name=" + req.body.name);
    procNewPoll(req.body);    
});

app.post('/deletepoll', function(req,res){
    console.log(req.body);
    console.log("name=" + req.body.name);
    procDelPoll(req.body);    
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

app.post('/procregister', function(req,res){
    console.log(req.body);
    console.log("username=" + req.body.username);
    procRegister(req.body);    
});

app.post('/proclogin', function(req,res){
    console.log(req.body);
    console.log("username=" + req.body.username);
    procLogin(req, res);    
});

app.get('/mypolls', function(req, res) {
   if (req.session.authuser === undefined) {
     res.render('listpolls', {   
       authuser: req.session.authuser
     });
   }
   else {
     res.render('mypolls', {   
        authuser: req.session.authuser
     });
     
     //res.sendFile(__dirname + '/views/mypolls.html');
   }  
})

app.get('/register', function(req, res) { 
  res.render('register', {   
    authuser: req.session.authuser
  });
})

app.get('/login', function(req, res) { 
  res.render('login', {   
    authuser: req.session.authuser
  });
})

app.get('/logout', function(req, res) {
  req.session.authuser = undefined;
  
  res.render('listpolls', {   
    authuser: req.session.authuser
  });
})

app.get('/test', function(req, res) {
    console.log('GET:....slow url is responding');
    var retObj = { "test" : "cool" };
    //res.write(retObj);
    res.send(retObj);
    //res.sendStatus(200);

})

app.get('/testEJS', function(req, res) {
  res.render('testEJS', {   
    title: "EJS example",
    supplies: [ "fork", "knife", "spoon"]
  });
});

// listen for requests :)
app.listen(8080);