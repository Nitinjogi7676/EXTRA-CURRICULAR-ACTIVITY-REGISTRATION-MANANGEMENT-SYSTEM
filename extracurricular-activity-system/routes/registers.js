const express = require('express');
const router = express.Router();
const pool = require('../dbconnect'); // Import your database connection

// POST Route: Register a student for an event
router.post('/', async (req, res) => {
    const { StudentID, EventID } = req.body;

    if (!StudentID || !EventID) {
        return res.status(400).json({ message: "Student ID and Event ID are required." });
    }

    try {
        // Check if the student is already registered for the event
        const checkSql = `SELECT * FROM registers WHERE StudentID = ? AND EventID = ?`;
        const [existing] = await pool.execute(checkSql, [StudentID, EventID]);

        if (existing.length > 0) {
            return res.status(400).json({ message: "You are already registered for this event." });
        }

        // Insert the registration into the database with the current timestamp (RegTime)
        const sql = `INSERT INTO registers (StudentID, EventID, RegTime) VALUES (?, ?, NOW())`;
        await pool.execute(sql, [StudentID, EventID]);

        res.status(201).json({ message: "Registration successful!" });
    } catch (error) {
        console.error("Error registering for event:", error);
        res.status(500).json({ message: "An error occurred during registration. Please try again." });
    }
});

// GET Route: Get all students registered for an event
router.get('/event/:eventid', async (req, res) => {
    const { eventid } = req.params;

    try {
        const sql = `SELECT * FROM registers WHERE EventID = ?`;
        const [rows] = await pool.execute(sql, [eventid]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "No students found for this event." });
        }

        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching registrations:", error);
        res.status(500).json({ message: "An error occurred while fetching registrations." });
    }
});




module.exports = router;
