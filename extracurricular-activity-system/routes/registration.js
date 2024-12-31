const express = require('express');
const router = express.Router();
const pool = require('../dbconnect'); // Ensure your database connection is set up correctly

// Route to handle Registration (POST)
router.post('/', async (req, res) => {
    const { studentid, eventid, paymentstatus,fee, paymentmode, paymentdate } = req.body;

    console.log("entered");
    
    // Validate input
    if (!studentid || !eventid || !paymentstatus) {
        return res.status(400).json({ message: "StudentID, EventID, and PaymentStatus are required." });
    }

    try {
        // Check if the event and student exist
        const eventCheck = `SELECT * FROM Event WHERE EventID = ?`;
        const studentCheck = `SELECT * FROM Student WHERE StudentID = ?`;
        const [event] = await pool.execute(eventCheck, [eventid]);
        const [student] = await pool.execute(studentCheck, [studentid]);

        if (event.length === 0) {
            return res.status(404).json({ message: "Event does not exist." });
        }
        if (student.length === 0) {
            return res.status(404).json({ message: "Student does not exist." });
        }

        // Check if the student is already registered for the event
        const checkSql = `SELECT * FROM Registration WHERE StudentID = ? AND EventID = ?`;
        const [existing] = await pool.execute(checkSql, [studentid, eventid]);

        // if (existing.length > 0) {
        //     return res.status(400).json({ message: "You are already registered for this event." });
        // }

        // Insert the registration into the database
        const sql = `
            INSERT INTO Registration 
            (RegistrationID, StudentID, EventID, RegistrationDate, PaymentStatus) 
            VALUES (SUBSTRING(UUID(), 1, 20), ?, ?, CURDATE(), ?)
        `;
        await pool.execute(sql, [studentid, eventid, paymentstatus]);

    
        //
        
    // Validate required fields
    if (!studentid || !eventid || !fee || !paymentmode || !paymentdate) {
        return res.status(400).json({ message: "All fields are required." });
    }

    
        // Insert payment into the Payment table
        const paymentSql = `
            INSERT INTO payment (PaymentID, RegistrationID, Amount, PaymentMode, PaymentDate, Status)
            VALUES (UUID(), ?, ?, ?, ?, 'Completed')
        `;

        const registrationSql = `SELECT RegistrationID FROM registration WHERE StudentID = ? AND EventID = ?`;
        const [registration] = await pool.execute(registrationSql, [studentid, eventid]);

        if (registration.length === 0) {
            return res.status(404).json({ message: "Registration not found." });
        }

        await pool.execute(paymentSql, [registration[0].RegistrationID, fee, paymentmode, paymentdate]);

         res.status(200).json({ message: "Payment successful!" });
        //alert("Payment successful!");
        //res.render('dashboard')
    } 
       // res.status(201).json({ message: "Registration successful!" });
    catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: "An error occurred during registration. Please try again." });
    }
});

// Route to fetch all registrations (GET)
router.get('/', async (req, res) => {
    try {
        const sql = `SELECT * FROM Registration`;
        const [registrations] = await pool.execute(sql);
        res.status(200).json(registrations);
    } catch (error) {
        console.error("Error fetching registrations:", error);
        res.status(500).json({ message: "An error occurred while fetching registrations." });
    }
});

// Route to fetch a specific registration by RegistrationID (GET)
// router.get('/:registrationid', async (req, res) => {
//     const { registrationid } = req.params;
//     try {
//         const sql = `SELECT * FROM Registration WHERE RegistrationID = ?`;
//         const [registration] = await pool.execute(sql, [registrationid]);

//         if (registration.length === 0) {
//             return res.status(404).json({ message: "Registration not found." });
//         }

//         res.status(200).json(registration[0]);
//     } catch (error) {
//         console.error("Error fetching registration by ID:", error);
//         res.status(500).json({ message: "An error occurred while fetching the registration." });
//     }
// });


router.get('/details', async (req, res) => {
    const { studentid, eventid, fee } = req.query;
console.log("inside details");

    if (!studentid || !eventid || !fee) {
        return res.status(400).send("Missing required query parameters.");
    }

    // Render the EJS page with prefilled registration details
    res.render('registration-details', { studentid, eventid, fee });
});

module.exports = router;
