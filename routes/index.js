var express = require("express");
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");
const passport = require("passport");
const upload = require("./multer")
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));
const { sendPasswordResetEmail } = require('./mailer'); 
const crypto = require('crypto');

// Generate a password reset token
const generateToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

router.get("/", function (req, res, next) {
  // res.send("HOMEPAGE")
  res.render("index",{error: req.flash('error'), nav:false})
});
router.get("/register",function( req,res){
  res.render("register",{nav:false})
})


router.get("/feed", isLoggedIn,async function (req, res) {
  const user = await userModel.findOne({username:req.session.passport.user})
  const posts = await postModel.find().populate("user")
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
  .populate({
    path: 'posts',
    populate: { path: 'user' } // Also populating the user field within each post
  })
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
    const user = await userModel.findById(req.user._id); 
    // Render the detailed view page
    res.render("postDetail", { post,user, nav: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
});

// -----------------------LIKES--------------------------

router.post("/post/:id/like", isLoggedIn, async function (req, res) {
  try {
    const post = await postModel.findById(req.params.id);
    const user = await userModel.findOne({ username: req.session.passport.user });

    // Check if user has already liked the post
    if (post.likes.includes(user._id)) {
      return res.status(400).send("You already liked this post.");
    }

    // Add user's ID to the likes array
    post.likes.push(user._id);
    await post.save();

    res.redirect(`/post/${post._id}`);
    // res.redirect("/feed");
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong.");
  }
});

router.post("/post/:id/unlike", isLoggedIn, async function (req, res) {
  try {
    const post = await postModel.findById(req.params.id);
    const user = await userModel.findOne({ username: req.session.passport.user });

    // Check if user has liked the post
    if (!post.likes.includes(user._id)) {
      return res.status(400).send("You haven't liked this post.");
    }

    // Remove user's ID from the likes array
    post.likes = post.likes.filter(userId => !userId.equals(user._id));
    await post.save();

    res.redirect(`/post/${post._id}`);
    // res.redirect("/feed");

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

// Forgot password


// In your router file (e.g., routes/index.js)
router.get("/forgot-password", function (req, res) {
  res.render("forgot-password",{nav:false}); // Render the forgot password form
});

router.post("/forgot-password", async function (req, res) {
  const { email } = req.body;
  const user = await userModel.findOne({ email });

  if (!user) {
    return res.status(400).send("User not found");
  }

  // Generate a password reset token
  const token = generateToken();

  // Store the token in the user document (you may need to create a field for this)
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
  await user.save();

  // Send the password reset email
  await sendPasswordResetEmail(user.email, token);

  res.send("Password reset link has been sent to your email.");
});
// Add this in your router file
router.get("/reset-password/:token", function (req, res) {
  // Verify the token here
  // If valid, render the reset password form
  res.render("reset-password", { nav: false, token: req.params.token });
});

router.post("/reset-password", async function (req, res) {
  const { password, token } = req.body;

  const user = await userModel.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() } // Check if the token has not expired
  });

  if (!user) {
    return res.status(400).send("Invalid or expired token");
  }

  // Update the user's password
  user.password = userModel.hashPassword(password); // Replace with your password hashing logic
  user.resetPasswordToken = undefined; // Clear the reset token
  user.resetPasswordExpires = undefined; // Clear the expiration
  await user.save();

  res.send("Password has been reset successfully.");
});


module.exports = router;
