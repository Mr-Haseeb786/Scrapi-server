const bcrypt = require("bcryptjs");
const {
  insertUser,
  getUserByEmail,
  addFavourites,
} = require("../utils/dbHandlers");
const { createJwtToken, verifyToken } = require("../utils/jwtAuth");

async function handleRegistNewUser(req, res) {
  const { username, password, email } = req.body;

  console.log(password);
  const passwordHash = await bcrypt.hash(password, 12);
  console.log(passwordHash);

  const user = {
    username,
    email,
    passwordHash,
  };

  try {
    const newUser = await insertUser(user);
    return res.status(201).json({
      message: "New User Registered Successfully",
      userId: newUser._id,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error Registering the user" });
  }
}

async function handleUserSignIn(req, res) {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "No Email or Password Provided" });

  try {
    const user = await getUserByEmail(email);
    if (!user)
      return res.status(401).json({ message: "User Email Does not Exist" });

    const passwordMatched = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatched)
      return res.status(401).json({ message: "Incorrect Password" });

    const userInfo = {
      userId: user._id,
      username: user.username,
      email: user.email,
    };

    const token = createJwtToken(userInfo);
    res.cookie("token", token);

    return res.json({ message: "User LoggedIn ", userInfo });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error searching for User" });
  }
}

async function handleGetUserFavourites(req, res) {}

async function handleSetUserFavourites(req, res) {
  const {
    title,
    imgLink,
    price,
    linkToProduct,
    producOriginSite,
    reviews,
    ratings,
  } = req.body;

  if (
    !title ||
    !imgLink ||
    !price ||
    !linkToProduct ||
    !producOriginSite ||
    !reviews ||
    !ratings
  ) {
    return res.status(400).json({ message: "Product Details are missing" });
  }

  let userDetails = null;

  const { token } = req.cookies;

  console.log(token);

  try {
    userDetails = verifyToken(token);
    console.log(userDetails);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      message:
        "Your Cookies have been cleared or altered. You need to login again to view Your Favourites",
    });
  }

  try {
    const favProduct = await addFavourites(userDetails.userId, req.body);

    res
      .status(201)
      .json({ message: "Added to Favourites", favProduct: favProduct._id });
  } catch (error) {
    res.json({ message: "There was an error inserting in db" });
  }
}

module.exports = {
  handleRegistNewUser,
  handleUserSignIn,
  handleGetUserFavourites,
  handleSetUserFavourites,
};
