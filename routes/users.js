const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");
require('dotenv').config();


mongoose.connect(process.env.URL).then((response)=>{
  console.log("Connected to userModdel DB")
})
.catch((error)=>{
  console.log(error);
  console.log("Not connected to the database");
});
const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  email: String,
  password: String,
  profileImage: String,
  contact: Number,
  boards: {
    type: Array,
    default: [],
  },
  posts: [{
   type: mongoose.Schema.Types.ObjectId,
   ref: "Post",
 }]
});
userSchema.plugin(plm);
module.exports = mongoose.model("User", userSchema);
