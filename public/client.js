$(function() {
  
  console.log("Document ready!");
  
  function dataReady(data) {
    console.log("data=" + JSON.stringify(data));
  }
  
  console.log("sending get request...");
  $.get('/test', dataReady);
  
  
  
  
});

