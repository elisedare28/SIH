
import express from 'express';
import {createServer} from 'http';
import { Server as socketIo } from 'socket.io';
import cors from 'cors';
import dotenv from "dotenv";
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import userRoute from "./routes/User.js";
dotenv.config();

const app = express();
const server = createServer(app);
const io = new socketIo(server,{
  cors:{
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST'],
  },
});

// Middleware to handle CORS
app.use(cors());
app.use(bodyParser.json());
  // Serve static files if needed
app.use(express.static('public')); 

const connect = async ()=> {
  try{
      await mongoose.connect(process.env.MONGO_URL);
      console.log("Connected to MongoDB")
  } catch (error){
      throw error;
  }
};
mongoose.connection.on("disconnected",()=>{
  console.log("MongoDB disconnected");
})
mongoose.connection.on("connected",()=>{
  console.log("MongoDB connected");
})




app.use("/api/users",userRoute);




let data = Array.from({ length: 100 }, () => Array(100).fill(''));
let users = {}; // Track users

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  
  users[socket.id] = { id: socket.id, currentCell: null, username: `User ${socket.id.slice(0, 4)}` };
  io.emit('update-users', users); // Notify all clients about the new user

  // Send current data to the newly connected client
  socket.emit('spreadsheet-update', data);

  
  socket.on('character-update', ({ cell, character }) => {
    const [row, col] = cell;
    data[row][col] = character; 
    io.emit('character-update', { cell, character }); 
  });

  
  socket.on('user-cell-update', ({ row, col, userId }) => {
    if (users[userId]) {
      users[userId].currentCell = { row, col };
      io.emit('update-users', users); 
    }
  });

  
  socket.on('spreadsheet-update', (update) => {
    data = update; 
    io.emit('spreadsheet-update', data); // Broadcast the update to all clients
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    delete users[socket.id];
    io.emit('update-users', users); // Notify all clients about the user disconnecting
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  connect();
  console.log(`Server is running on port ${PORT}`);
});
