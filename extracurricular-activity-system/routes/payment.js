const express = require('express');
const router = express.Router();
const pool = require('../dbconnect'); // Ensure this is the correct path to your database connection file

// Route to handle adding a payment (POST)
router.post('/', async (req, res) => {
    
    const { studentid, eventid, fee, paymentmode, paymentdate } = req.body;

    console.log(studentid, eventid, fee, paymentmode, paymentdate);
    
    // Validate required fields
    if (!studentid || !eventid || !fee || !paymentmode || !paymentdate) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
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
    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).json({ message: "An error occurred while processing the payment." });
    }});

// Route to fetch all payments (GET)
router.get('/', async (req, res) => {
    try {
        const sql = `SELECT * FROM payment`;
        const [payments] = await pool.execute(sql);
        res.status(200).json(payments);
    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ message: "An error occurred while fetching payments." });
    }
});

// Route to fetch a specific payment by PaymentID (GET)
router.get('/:paymentid', async (req, res) => {
    const { paymentid } = req.params;

    try {
        const sql = `SELECT * FROM payment WHERE PaymentID = ?`;
        const [payment] = await pool.execute(sql, [paymentid]);

        if (payment.length === 0) {
            return res.status(404).json({ message: "Payment not found." });
        }

        res.status(200).json(payment[0]);
    } catch (error) {
        console.error("Error fetching payment by ID:", error);
        res.status(500).json({ message: "An error occurred while fetching the payment." });
    }
});

module.exports = router;
