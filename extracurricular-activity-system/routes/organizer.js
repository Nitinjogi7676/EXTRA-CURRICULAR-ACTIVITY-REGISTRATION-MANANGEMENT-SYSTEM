const express = require("express");
const router = express.Router();
const pool = require("../dbconnect"); // Adjust the path if needed
const bcrypt = require('bcrypt');




// Route to fetch all organizers
router.get("/", async (req, res) => {
    try {
        const sql = `SELECT * FROM organizer`;
        const [organizers] = await pool.execute(sql);

        if (organizers.length === 0) {
            return res.status(404).json({ message: "No organizers found" });
        }

        res.json(organizers);
    } catch (error) {
        console.error("Error fetching organizers:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Route to fetch a specific organizer by OrganizerID
// router.get("/:id", async (req, res) => {
//     const organizerid = req.params.id;

//     try {
//         const sql = `SELECT * FROM organizer WHERE OrganizerID = ?`;
//         const [organizer] = await pool.execute(sql, [organizerid]);

//         if (organizer.length === 0) {
//             return res.status(404).json({ message: "Organizer not found" });
//         }

//         res.json(organizer[0]); // Return the first matching organizer
//     } catch (error) {
//         console.error("Error fetching organizer:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });




// Route to add a new organizer
router.post("/", async (req, res) => {
    const { organizerid, organizername, dept, contactno } = req.body;

    if (!organizerid || !organizername || !dept || !contactno) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const sql = `INSERT INTO organizer (OrganizerID, OrganizerName, Dept, ContactNo) VALUES (?, ?, ?, ?)`;
        const [result] = await pool.execute(sql, [organizerid, organizername, dept, contactno]);
        res.status(201).json({ message: "Organizer added successfully", organizerId: organizerid });
    } catch (error) {
        console.error("Error adding organizer:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Route to modify an organizer's details
router.put("/modify/:id", async (req, res) => {
    const organizerid = req.params.id;
    const { organizername, dept, contactno } = req.body;

    try {
        const sql = `UPDATE organizer SET OrganizerName = ?, Dept = ?, ContactNo = ? WHERE OrganizerID = ?`;
        const [result] = await pool.execute(sql, [organizername, dept, contactno, organizerid]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Organizer not found" });
        }

        res.json({ message: "Organizer updated successfully" });
    } catch (error) {
        console.error("Error modifying organizer:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Route to delete an organizer
router.delete("/delete/:id", async (req, res) => {
    const organizerid = req.params.id;

    try {
        const sql = `DELETE FROM organizer WHERE OrganizerID = ?`;
        const [result] = await pool.execute(sql, [organizerid]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Organizer not found" });
        }

        res.json({ message: "Organizer deleted successfully" });
    } catch (error) {
        console.error("Error deleting organizer:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


router.get('/register',(req,res) => {
    res.render("orgReg",{message:""})
})

// Organizer Registration Route
router.post('/register', async (req, res) => {
    const { organizerid, organizername, dept, contactno, password } = req.body;

    // Input validation
    if (!organizerid || !organizername || !dept || !contactno || !password) {
        return res.render('organizer_registration', { message: "All fields are required." });
    }

    try {
        // Check if Organizer ID already exists
        const checkSql = 'SELECT * FROM Organizer WHERE OrganizerID = ?';
        const [rows] = await pool.execute(checkSql, [organizerid]);

        if (rows.length > 0) {
            return res.render('orgReg', { message: "Organizer ID already exists." });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert Organizer into the database
        const sql = `
            INSERT INTO Organizer (OrganizerID, OrganizerName, Dept, ContactNo, Password) 
            VALUES (?, ?, ?, ?, ?)
        `;
        await pool.execute(sql, [organizerid, organizername, dept, contactno, hashedPassword]);

        res.redirect('/organizer/login')
    } catch (error) {
        console.error("Error during registration:", error);
        res.render('orgReg', { message: "An error occurred during registration. Please try again." });
    }
});

router.get('/login',(r,s) => {
    s.render('orgLog',{message:""})
})

// Organizer Login Route
router.post('/login', async (req, res) => {
    const { organizerid, password } = req.body;

    // Input validation
    if (!organizerid || !password) {
        return res.render('orgLog', { message: "All fields are required." });
    }

    try {
        // Check if Organizer ID exists
        const sql = 'SELECT * FROM Organizer WHERE OrganizerID = ?';
        const [rows] = await pool.execute(sql, [organizerid]);

        if (rows.length === 0) {
            return res.render('orgLog', { message: "Invalid Organizer ID or Password." });
        }

        const organizer = rows[0];

        // Validate password
        const passwordMatch = await bcrypt.compare(password, organizer.password);
        if (!passwordMatch) {
            return res.render('orgLog', { message: "Invalid Organizer ID or Password." });
        }

        // Save organizer details in session
        req.session.user = {
            id: organizer.OrganizerID,
            name: organizer.OrganizerName,
            role: "organizer"
        };

        // Redirect to organizer dashboard
        res.redirect('/organizer/dashboard');
    } catch (error) {
        console.error("Error during login:", error);
        res.render('orgLog', { message: "An error occurred. Please try again." });
    }
});





// Organizer Dashboard Route
router.get('/dashboard', async (req, res) => {
    try {
        // Replace with session-based OrganizerID
        const organizerID = req.session.user.id;

        // Fetch events created by the organizer
        const sql = 'SELECT * FROM EVENT WHERE OrganizerID = ?';
        const [events] = await pool.execute(sql, [organizerID]);

    
        
        res.render('orgDash', { events });
    } catch (error) {
        console.error("Error fetching organizer dashboard:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Route to Create Event Page
router.get('/create-event', (req, res) => {
    res.render('create_event'); // Ensure a create_event.ejs file exists
});

// Route to Handle Event Creation
router.post('/create-event', async (req, res) => {
    const { eventname, eventdate, location } = req.body;
    const organizerID = req.session.user.id; // Replace with session-based OrganizerID

    if (!eventname || !eventdate || !location) {
        return res.render('create_event', { message: "All fields are required." });
    }

    try {
        const sql = `
            INSERT INTO EVENT (EventID, EventName, EventDate, Location, OrganizerID) 
            VALUES (UUID(), ?, ?, ?, ?)
        `;
        await pool.execute(sql, [eventname, eventdate, location, organizerID]);

        res.redirect('/organizer/dashboard');
    } catch (error) {
        console.error("Error creating event:", error);
        res.render('create_event', { message: "An error occurred. Please try again." });
    }
});

// Route to View Students Registered for an Event
router.get('/view-registrations/:eventID', async (req, res) => {
    const { eventID } = req.params;

    try {
        const sql = `
            SELECT Student.StudentID, Student.Fname, Student.Lname, Student.Email 
            FROM Registration
            JOIN Student ON Registration.StudentID = Student.StudentID
            WHERE Registration.EventID = ?
        `;
        const [students] = await pool.execute(sql, [eventID]);

        res.render('view_students', { students, eventID });
    } catch (error) {
        console.error("Error fetching registered students:", error);
        res.status(500).send("Internal Server Error");
    }
});



module.exports = router;






