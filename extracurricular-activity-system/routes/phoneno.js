const express = require('express');
const router = express.Router();
const pool = require('../dbconnect'); // Ensure this points to your correct database connection

// Route to add a new phone number for a student
router.post('/', async (req, res) => {
    const { studentid, phonenumber } = req.body;

    // Validate input
    if (!studentid || !phonenumber) {
        return res.status(400).json({ message: "StudentID and PhoneNumber are required." });
    }

    try {
        // Check if the student exists
        const studentCheck = `SELECT * FROM Student WHERE StudentID = ?`;
        const [student] = await pool.execute(studentCheck, [studentid]);

        if (student.length === 0) {
            return res.status(404).json({ message: "Student does not exist." });
        }

        // Insert the phone number
        const sql = `INSERT INTO phoneno (StudentID, PhoneNumber) VALUES (?, ?)`;
        await pool.execute(sql, [studentid, phonenumber]);

        res.status(201).json({ message: "Phone number added successfully!" });
    } catch (error) {
        console.error("Error adding phone number:", error);
        res.status(500).json({ message: "An error occurred. Please try again." });
    }
});

// Route to get all phone numbers for a student
router.get('/:studentid', async (req, res) => {
    const { studentid } = req.params;

    try {
        // Fetch all phone numbers for the student
        const sql = `SELECT PhoneNumber FROM phoneno WHERE StudentID = ?`;
        const [phoneNumbers] = await pool.execute(sql, [studentid]);

        if (phoneNumbers.length === 0) {
            return res.status(404).json({ message: "No phone numbers found for this student." });
        }

        res.status(200).json(phoneNumbers);
    } catch (error) {
        console.error("Error fetching phone numbers:", error);
        res.status(500).json({ message: "An error occurred. Please try again." });
    }
});

// Route to delete a phone number for a student
router.delete('/', async (req, res) => {
    const { studentid, phonenumber } = req.body;

    // Validate input
    if (!studentid || !phonenumber) {
        return res.status(400).json({ message: "StudentID and PhoneNumber are required." });
    }

    try {
        // Delete the phone number
        const sql = `DELETE FROM phoneno WHERE StudentID = ? AND PhoneNumber = ?`;
        const [result] = await pool.execute(sql, [studentid, phonenumber]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Phone number not found." });
        }

        res.status(200).json({ message: "Phone number deleted successfully!" });
    } catch (error) {
        console.error("Error deleting phone number:", error);
        res.status(500).json({ message: "An error occurred. Please try again." });
    }
});

module.exports = router;
