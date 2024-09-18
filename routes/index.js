var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");
const passport = require("passport");
const upload = require("./multer")
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

router.get("/", function (req, res, next) {
  // res.send("HOMEPAGE")
  res.render("index",{error: req.flash('error'), nav:false})
});
router.get("/register",function( req,res){
  res.render("register",{nav:false})
})


router.get("/feed", async function (req, res, next) {
  const user = await userModel.findOne({username:req.session.passport.user})
  const posts = await postModel.find()
  .populate("user")
 res.render("feed",{user,posts,nav:true})
});

router.post("/fileupload", isLoggedIn, upload.single("image"), async function (req, res, next) {
  if (!req.file){
    return res.status(400).send("No files were uploaded.")
  }
  const user = await userModel.findOne({username:req.session.passport.user})
  user.profileImage = req.file.filename
  await user.save();
  res.redirect("/profile")
 });
 


router.get("/profile", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({
    username:req.session.passport.user
  })
  .populate("posts")
  res.render("profile",{user, nav:true})
});

router.get("/show/posts", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({
    username:req.session.passport.user
  })
  .populate("posts")
  res.render("show",{user, nav:true})
});
router.post("/show/posts/:cardid", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({
    username:req.session.passport.user
  })
  .populate("posts")
  res.render("show",{user, nav:true})
});

router.get("/add", isLoggedIn, async function (req, res, next) {
  let user = await userModel.findOne({
    username:req.session.passport.user
  })
  res.render("add",{user,nav:true})
});
router.post("/createpost", isLoggedIn,upload.single("postImage"), async function (req, res, next) {
  if (!req.file){
    return res.status(400).send("mo files were uploaded.")
  };
  const user = await userModel.findOne({
    username:req.session.passport.user
  });
  const post= await postModel.create({
    user: user._id,
    title:req.body.title,
    description:req.body.description,
    image:req.file.filename
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

// Edit profile GET route
router.get("/edit", isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });
  res.render("edit", { user, nav: true });
});

// Edit profile POST route
router.post("/edit", isLoggedIn, async function (req, res, next) {
  const { email, name, contact } = req.body;
  const user = await userModel.findOne({ username: req.session.passport.user });

  // Update the user details
  user.email = email;
  user.name = name;
  user.contact = contact;

  await user.save();
  res.redirect("/profile");
});

router.get("/post/:id", isLoggedIn, async function (req, res, next) {
  try {
    const post = await postModel.findById(req.params.id).populate("user");

    // Render the detailed view page
    res.render("postDetail", { post, nav: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
});


router.post("/register", function (req, res) {
  const { username, email, name,contact } = req.body;
  const userdata = new userModel({ username, email, name,contact });
  userModel.register(userdata, req.body.password).then(function () {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/profile");
    });
  });
});

router.post(
  "/login",
  passport.authenticate(
    "local",
    {
      successRedirect: "/profile",
      failureRedirect: "/",
      failureFlash:true
    }
  ),
  function (req, res) {}
);

router.get("/logout",function(req,res,next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})

function isLoggedIn (req,res,next){
  if(req.isAuthenticated()) return next();
  res.redirect("/")
}
module.exports = router;
