const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const path=require('path');
const eventRoutes = require("./routes/event");
const pool = require('./dbconnect'); // Import the database connection if required for global use
const students = require('./routes/student');
const organizers = require('./routes/organizer');
const registersRoutes = require('./routes/registers');
const registrationRoutes = require('./routes/registration');
const paymentRoutes=require('./routes/payment');
const phonenumber=require('./routes/phoneno');
const session = require('express-session');
const app = express();
const PORT = 3000;

// Middleware

app.set('views', path.join(__dirname, 'views'));
app.set('view engine','ejs')
app.use(bodyParser.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret123', // Replace with a secure key
    resave: false,             // Prevents resaving unchanged sessions
    saveUninitialized: true,   // Saves uninitialized sessions
    cookie: {
        maxAge: 1000 * 60 * 60, // Session expiration (1 hour)
        secure: false          // Set to true if using HTTPS
    }
  }));


// Routes
app.use("/events", eventRoutes);
app.use('/students',students);
app.use('/organizer',organizers);
app.use('/registers', registersRoutes);
app.use("/registration", registrationRoutes);
app.use("/payments",paymentRoutes);
app.use("/phoneno",phonenumber);


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
