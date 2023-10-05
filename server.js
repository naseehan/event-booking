const express = require("express")
const app = express()
const mongoose = require("mongoose")
const dotenv = require('dotenv')
dotenv.config()
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const cors = require('cors')

app.use(cookieParser())
app.use(cors());


app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// connect to mongodb
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

// user schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

// user model
const User = mongoose.model('User', userSchema)

// signup route
app.post("/signup", async(req, res) => {
 try {
    const {email, password} = req.body
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User ({ email, password: hashedPassword})
    await user.save()
    res.status(201).json({ message: 'User created successfully'})
 } catch (error) {
    res.status(500).json({ error: 'Internal server error'})
 }
})


// logging in user
app.post("/login" , async( req,res) => {
    try {
        const { email, password} = req.body
        const existingUser = await User.findOne({ email })

        if(!existingUser){
            return res.status(400).json({message: "User doesn't exist"})
        }

        const isPasswordTrue = await bcrypt.compare(password, existingUser.password)

        if(!isPasswordTrue) {
            return res.status(300).json({ message: "Incorrect Email or Password"})
        }
        if(isPasswordTrue){
        jwt.sign({email: existingUser.email, id:existingUser._id}, process.env.JWT_SECRET, {} , (err, token) => {
            if(err) throw err;
            res.cookie('token', token, { httpOnly: true})
            res.status(201).json({ existingUser: existingUser._id })
        })
    }
        // res.json({ email: existingUser.email, password: existingUser.password})
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
})


app.get("/profile", (req, res) => {
const {token} = req.cookies
if(token) {
    jwt.verify(token, process.env.JWT_SECRET, {}, (err, user) => {
        if(err) throw err;
        express.json(user)
    })
} else {
    res.json(null)
}
})

app.listen(process.env.PORT , () => {
    const port = process.env.PORT
    console.log("server started in port " + port);
})