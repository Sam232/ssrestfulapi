const express = require("express");
const bodyParser = require("body-parser");
const AdminRoute = require("./server/routes/Admin");
const UserRoute = require("./server/routes/User");
const path = require("path");
const database = require("./server/config/Database");
const allowCrossDomain = require("./server/config/Cors");

//Load database
database();
 
//Creating Express Instance
const app = express();

//Server public directory
app.use(express.static(path.join(__dirname, "/server/public")));

//BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

//Allow Cross Domain
app.use(allowCrossDomain);

//Defining Routes
app.use("/admin/7f2db1e4-66ed", AdminRoute);
app.use("/user", UserRoute);
app.use((req, res, next) => {
  res.status(404).json({
    errorMsg: "Endpoint not found"
  });
}); 

//Starting Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`)
});


