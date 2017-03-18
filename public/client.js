 function myHeader() {
    var str = "<a href=\"listpolls\">All Polls</a><span>&#32;</span>";
    if (authuser !== "") {
      str += "<a href=\"newpoll\">New Poll</a><span>&#32;</span>";
      str += "<a href=\"mypolls\">My Polls</a><span>&#32;</span>";
      str += "<a href=\"logout\">Logout:" + authuser + "</a><span>&#32;</span>";
    }
   else {
      str += "<a href=\"login\">Login</a><span>&#32;</span>";
      str += "<a href=\"register\">Register</a><span>&#32;</span>";     
   }
   
    $(".myhdr").html(str);
  }

  /*

$(function() {
  
 
  console.log("Document ready!");
  
  function dataReady(data) {
    console.log("data=" + JSON.stringify(data));
  }
  
  console.log("sending get request...");
  $.get('/test', dataReady);

  
});

  */