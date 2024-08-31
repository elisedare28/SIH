import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import zod from "zod";
import User from "../models/User.js";

const router = express.Router();

// first we will create schema using zod for schema validation
const signupSchema = zod.object({
    email : zod.string().email(),
    name : zod.string(),
    password : zod.string()
});

//Sign Up Route 

router.post("/signup",async (req,res) => {
    // Schema Validation to ensure that user has entered correct inputs
    const {success} = signupSchema.safeParse(req.body);
    if(!success){
        return res.status(411).json({
            message: " Incorrect Inputs"
        })
    }
    
    const hashedPassword = await bcrypt.hash(req.body.password,10); // Hash the Password given by user
    
    try{
        const newUser = await User.create({
            name:req.body.name,
            email:req.body.email,
            password:hashedPassword // Hashed password will be store in DB

        });
        
        const token = jwt.sign({id : newUser._id},process.env.JWT_SECRET);

        res.status(201).json({ 
            message: "User created successfully",
             user: newUser,
             token:token
        });

    }catch(err){
        console.error("Error creating user:", err);
        res.status(500).json({ error: "Failed to create userl" });

    }

})

// Sign In route 

//Create schema using zod for Sign In
const signinBody = zod.object({
    email : zod.string().email(),
    password: zod.string()
})

// Create a POST route for SignIn 
router.post("/signin", async (req, res) => {
    const { success } = signinBody.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        })
    }

    try{
        const user = await User.findOne({
            email:req.body.email
        })
        
        if(!user){
            res.status(500).json({
                message:"User not found"
            })
            return;
        }
        
        const isCorrectPassword = await bcrypt.compare(req.body.password, user.password);
    
        if(isCorrectPassword){
            const token = jwt.sign({id : user._id},process.env.JWT_SECRET);
            
            res.status(200).json({
                message:"Login Successfully",
                token:token
            })
        }
        else{
            res.status(400).json({
                message:"Wrong Username or Password"
            })
        }
        
    }catch(err){
        console.error("Error finding user:", err);
        res.status(500).json({ error: "Failed to Login" });

    }
})

export default router;