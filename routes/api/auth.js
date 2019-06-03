const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const config = require("config");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator/check");

const bcrypt = require("bcryptjs");
// @toute   GET api/auth
// @desc    test route
// @access  Public
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch {
    console.error(err.message);
    res.status.send("server error");
  }
});

// @toute   GET api/auth
// @desc    authenicate user & get token
// @access  Public
router.post(
  "/",
  [
    check("email", "please inculde valid email").isEmail(),
    check("password", "password is required").isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    console.log(req.body);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });

      // see if user exist
      if (!user) {
        res.status(400).json({ errors: [{ msg: "invalid credentials " }] });
      }

      // return jsonwebtoken
      const paylaod = {
        user: {
          id: user._id
        }
      };
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        res.status(400).json({ errors: [{ msg: "invalid credentials " }] });
      }

      jwt.sign(
        paylaod,
        config.get("jwtToken"),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("serveur error");
    }
  }
);

module.exports = router;
