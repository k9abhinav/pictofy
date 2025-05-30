const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect("mongodb+srv://abhinava03kks:pinterest@pinterest.oltmm1v.mongodb.net/?retryWrites=true&w=majority").then((response)=>{
  console.log("Connected to postModel DB")
})
.catch((error)=>{
  console.log(error);
  console.log("Not connected to the database");
});

const postSchema = new mongoose.Schema({
 
 title:String,
 description:String,
 image:String,
 user:{
  type:mongoose.Schema.Types.ObjectId,
  ref:"User"
},
likes: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
}], 

});
module.exports = mongoose.model('Post', postSchema);


