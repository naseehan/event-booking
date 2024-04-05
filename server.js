const express = require("express");
const bodyParser = require('body-parser');

const path = require('path');
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const stripe = require('stripe')(process.env.STRIPE_SECRET)

app.use(cookieParser());
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '..', 'client', 'build')));


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// connect to mongodb
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// user schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
// create event schema
const eventSchema = new mongoose.Schema({
  name: String,
  category: String,
  place: String,
  price: Number,
  date: String,
  time: String,
  venue: String,
  description: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});
// create cart schema
const cartSchema = new mongoose.Schema({
  name: String,
  price: Number,
  place: String,
  time: String,
  venue: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

// user model
const User = mongoose.model("User", userSchema);
const Event = mongoose.model("Event", eventSchema);
const Cart = mongoose.model("Cart", cartSchema);




// signup route
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });

    // if email already exists
    if(existingUser){
      return res.status(400).json({ message: "Email already in use"})
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// logging in user
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(400).json({ message: "User doesn't exist" });
    }

    const isPasswordTrue = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordTrue) {
      return res.status(300).json({ message: "Incorrect Email or Password" });
    }
    // if(isPasswordTrue){
    const expiry = 10;
    jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: expiry },
      (err, token) => {
        if (err) throw err;
        res.cookie("token", token, { expiresIn: expiry, httpOsnly: true });
        res.cookie("email", email, { expiresIn: expiry });
        res.cookie("userId", existingUser._id, { expiresIn: expiry });

        const result = {
          existingUser,
          token,
          email,
        };
        res.status(201).json({ message: 201, result });
      }
    );
    // }
    // res.json({ email: existingUser.email, password: existingUser.password})
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// route for creating event
app.post("/createEvent", async (req, res) => {
  try {
    const { name, category, place, price, date, time, venue, description } = req.body;
    const userId = req.body.createdBy;

    const dateString = date;

    // Convert the string to a Date object
    const newDate = new Date(dateString);
  
    // Options for formatting the date
    const options = {
      day: "numeric",
      month: "long",
    };
  
    // Format the date
    const formattedDate = new Intl.DateTimeFormat("en-US", options).format(
      newDate
    );
  

    const newEvent = new Event({
      name,
      category,
      place,
      price,
      date: formattedDate,
      time,
      venue,
      description,
      createdBy: userId,
    });
    await newEvent.save();
    res.status(201).json({ message: "Event created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
// for getting each events created by users
app.get("/getEachEvent", async (req, res) => {
  try {
    const userId = req.headers["userid"];
    const getEvent = await Event.find({ createdBy: userId });
    res.json(getEvent);
  } catch (error) {
    res.status(500).json({ error: "Could'nt get events" });
  }
});
// for getting all events
app.get("/getEvent", async (req, res) => {
  try {
    // const userId = req.headers["userid"];
    const getEvent = await Event.find();
    res.json(getEvent);
  } catch (error) {
    res.status(500).json({ error: "Could'nt get events" });
  }
});

// route for deleting event
app.delete("/events/:eventId", async (req, res) => {
  try {
    const eventId = req.params.eventId;
    await Event.findByIdAndDelete(eventId);
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// route for cart page
app.post("/cart", async (req, res) => {
  try {
    const {name, place, price, time, venue} = req.body;
    const userId = req.body.createdBy;

    const cart = new Cart({
      name,
      place,
      price,
      time,
      venue,
      createdBy: userId,
    });
    await cart.save();
    res.status(201).json({ message: "Saved to cart successfully"});

  } catch (error) {
    res.status(500).json({ error: "Internal server error"});
  }
})

// route for getting items from cart
app.get("/getCart", async (req, res) => {
  try {
    const userId = req.headers["userid"];
    const getCart = await Cart.find({ createdBy: userId});
    res.json(getCart);
  } catch (error) {
    res.status(500).json({ error: "Could'nt get cart items" });
  }
});

// route for deleting items from cart
app.delete("/deleteCart/:cartId", async (req, res) => {
  try {
    const cartId = req.params.cartId;
    await Cart.findByIdAndDelete(cartId);
    res.status(200).json({ message: "Cart item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
})

// route for stripe
app.post("/purchase",async(req, res)=> {
  try{
  const {products} = req.body;

  const lineItems = products.map((product)=>({
    price_data:{
      currency:"inr",
      product_data:{
        name:product.name,
        images:[product.image]
        // venue:product.venue,
        // price:product.price,
        // place:product.place,
      },
      unit_amount:Math.round(product.price * 100),
    },
    quantity:1
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types:["card"],
    line_items:lineItems,
    mode:"payment",
    success_url:"https://noble-events.onrender.com/success",
    cancel_url:"https://noble-events.onrender.com/cancel"
  })
console.log(session);
  res.json({ id:session.id, })
}catch(error){
  res.status(500).json({ message: "Internal server error" })
 
}
})

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, {}, (err, user) => {
      if (err) throw err;
      express.json(user);
    });
  } else {
    res.json(null);
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
 });


app.listen(process.env.PORT, () => {
  const port = process.env.PORT || 3001;
  console.log("server started in port " + port);
});
