const express = require("express");
const router = express.Router();
const pool = require("../dbconnect"); // Adjust the path to your dbconnect.js

// Create a new Event
router.post("/", async (req, res) => {
    try {
        const { eventid, eventname, eventdate, eventtime, location,organizerid, fee } = req.body;
        console.log(eventid, eventname, eventdate, eventtime, location,organizerid, fee);
        

        if (!eventid || !eventname || !eventdate || !eventtime || !location || !organizerid || !fee) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const [result] = await pool.query(
            `INSERT INTO EVENT (eventid, eventname, eventdate, eventtime, location, organizerid,fee) 
             VALUES (?, ?, ?, ?, ?, ?,?)`,
            [eventid, eventname, eventdate, eventtime, location, organizerid,fee]
        );

        res.redirect('/organizer/dashboard');
        //res.status(201).json({ message: "Event created successfully", eventId: result.insertId });
    } catch (err) {
        console.error("Error creating event:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get all Events
router.get("/", async (req, res) => {
   res.render('createEvent',{message:""});
});

// Get a single Event by ID
router.get("/:eventid", async (req, res) => {
    try {
        const { eventid } = req.params;
        const [rows] = await pool.query("SELECT * FROM EVENT WHERE eventid = ?", [eventid]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.status(200).json(rows[0]);
    } catch (err) {
        console.error("Error fetching event:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Update an Event
router.put("/:eventid", async (req, res) => {
    try {
        const { eventid } = req.params;
        const { eventname, eventdate, eventtime, location, organizerid } = req.body;

        const [result] = await pool.query(
            `UPDATE EVENT 
             SET eventname = ?, eventdate = ?, eventtime = ?, location = ?, organizerid = ? 
             WHERE eventid = ?`,
            [eventname, eventdate, eventtime, location, organizerid, eventid]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.status(200).json({ message: "Event updated successfully" });
    } catch (err) {
        console.error("Error updating event:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// // Delete an Event
// router.post("/delete/:eventid", async (req, res) => {
//     try {
//         const { eventid } = req.params;

//         const [result] = await pool.query("DELETE FROM EVENT WHERE eventid = ?", [eventid]);

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ error: "Event not found" });
//         }

//         res.status(200).json({ message: "Event deleted successfully" });
//     } catch (err) {
//         console.error("Error deleting event:", err.message);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

// Delete an Event
router.post("/delete/:eventid", async (req, res) => {
    const connection = await pool.getConnection(); // Use connection for transaction
    try {
        const { eventid } = req.params;

        // Ensure eventid is provided
        if (!eventid) {
            return res.status(400).json({ error: "Event ID is required." });
        }

        // Start a transaction
        await connection.beginTransaction();

        // Retrieve the event details
        const [eventDetails] = await connection.query(
            "SELECT * FROM EVENT WHERE EventID = ?",
            [eventid]
        );

        if (eventDetails.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Event not found." });
        }

        const event = eventDetails[0];

        // Log the retrieved event for debugging
        console.log("Event to delete:", event);

        // Insert the event details into the DELETED_EVENT table
        await connection.query(
            "INSERT INTO DELETED_EVENT (EventID, EventName, EventDate, EventTime, Location, OrganizerID, Fee, DeletedAt,DeletedBy) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(),?)",
            [
                event.EventID, // Use the correct column names from your database
                event.EventName,
                event.EventDate,
                event.EventTime,
                event.Location,
                event.OrganizerID,
                event.fee,
                event.OrganizerID
            ]
        );

        // Delete the event from the EVENT table
        const [deleteResult] = await connection.query(
            "DELETE FROM EVENT WHERE EventID = ?",
            [eventid]
        );

        if (deleteResult.affectedRows === 0) {
            throw new Error("Failed to delete the event.");
        }

        // Commit the transaction
        await connection.commit();

        res.status(200).json({ message: "Event deleted successfully and archived." });
    } catch (err) {
        await connection.rollback(); // Rollback the transaction on error
        console.error("Error deleting event:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        connection.release(); // Release the connection back to the pool
    }
});


router.get('/registeredstudents/:eventid', async (req, res) => {
    const { eventid } = req.params;

    try {
        const sql = `
            SELECT Student.StudentID, Student.Fname, Student.Lname, Student.Email, Registration.RegistrationDate
            FROM Registration
            JOIN Student ON Registration.StudentID = Student.StudentID
            WHERE Registration.EventID = ?
        `;
        const [students] = await pool.execute(sql, [eventid]);

        res.render('registeredstudents', { students, eventid });
    } catch (error) {
        console.error("Error fetching registered students:", error);
        res.status(500).send("Internal Server Error");
    }
});


module.exports = router;
