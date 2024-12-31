const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../dbconnect'); // Import the database connection


router.get('/register',(req,res) => {
    res.render('register',{message:""});
})



/router.post("/register", async (req, res) => {
    const { 
        studentid, fname, lname, minit, email, password, 
        dept, yearOfStudy, phoneno, address 
    } = req.body;

    // Check for missing fields
    if (!studentid || !fname || !lname || !email || !password || !dept || !yearOfStudy || !phoneno || !address) {
        return res.render("register", { message: "All fields are required" });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // SQL query for inserting a new student
        const sql = `
            INSERT INTO student 
            (StudentID, Fname, Lname, Minit, Email, Password, Dept, YearOfStudy, PhoneNo, Address) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Execute the query
        await pool.execute(sql, [
            studentid, fname, lname, minit, email, hashedPassword, 
            dept, yearOfStudy, phoneno, address
        ]);

        // Render login page with success message
        res.render("login", { message: "Registration successful! Please login." });
    } catch (error) {
        console.error("Error registering student:", error);

        // Render registration page with error message
        res.render("register", { message: "Error during registration. Try again." });
    }
});

router.get('/login',(req,res) => {
    res.render("login",{message:""})
});



router.post("/login", async (req, res) => {
    const { userid, password, role } = req.body;

   
    
    if (!userid || !password || !role) {
        return res.render("login", { message: "All fields are required" });
    }

    try {
        const table = role === "student" ? "Student" : "organizer";
        const idField = role === "student" ? "StudentID" : "OrganizerID";

        const sql = `SELECT * FROM ${table} WHERE ${idField} = ?`;
        const [rows] = await pool.execute(sql, [userid]);
        
        if (rows.length === 0) {
            return res.render("login", { message: "User not found" });
        }
        
        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            return res.render("login", { message: "Invalid credentials" });
        }
        console.log("INSIDE");

        req.session.user = {
            userid:user.StudentID,
            role:"Student"
        }
       

        res.redirect('/students/dashboard');
    } catch (error) {
        console.error("Error during login:", error);
        res.render("login", { message: "Error during login. Try again." });
    }
});


// router.get('/dashboard',async(req,res) => {
//     var user = req.session.user;
//     console.log(user);
    
//     var [r] = await pool.query('select * from event');
//     console.log(r);
    
//     res.render('dashboard',{user,r})
// })

router.get('/dashboard', async (req, res) => {
    const { userid } = req.session.user;

    try {
        const sql = `
            SELECT Registration.EventID, Event.EventName
            FROM Registration
            LEFT JOIN Event ON Registration.EventID = Event.EventID
            WHERE Registration.StudentID = ? AND Event.EventID IS NULL
        `;
             var [r] = await pool.query('select * from event');
        const [deletedEvents] = await pool.execute(sql, [userid]);

        res.render('dashboard', { user: req.session.user, r, deletedEvent: deletedEvents[0] });
    } catch (error) {
        console.error("Error fetching dashboard:", error);
        res.status(500).send("Internal Server Error");
    }
});



// READ: Get all students
router.get('/', async (req, res) => {
    try {
        const [students] = await pool.query('SELECT * FROM STUDENT');
        res.json(students);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// READ: Get a specific student by ID
// router.get('/:studentid', async (req, res) => {
//     const { studentid } = req.param  
    

//     try {
//         const [students] = await pool.query('SELECT * FROM STUDENT WHERE STUDENTID = ?', [studentid]);
//         if (students.length === 0) {
//             return res.status(404).json({ error: 'Student not found' });
//         }
//         res.json(students[0]);
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).json({ error: 'Failed to fetch student' });
//     }
// });

// // UPDATE: Update a student's details
// router.put('/:studentid', async (req, res) => {
//     const { studentid } = req.params;
//     const { fname, lname, minit, email, dept, yearOfStudy, phoneno, address } = req.body;

//     try {
//         const query = `UPDATE STUDENT SET FNAME = ?, LNAME = ?, MINIT = ?, EMAIL = ?, DEPT = ?, YEAR_OF_STUDY = ?, PHONENO = ?, ADDRESS = ?
//                        WHERE STUDENTID = ?`;
//         const [result] = await pool.query(query, [fname, lname, minit, email, dept, yearOfStudy, phoneno, address, studentid]);

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ error: 'Student not found' }); 
//         }

//         res.json({ message: 'Student updated successfully' });
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).json({ error: 'Failed to update student' });
//     }
// });

// DELETE: Remove a student
router.delete('/:studentid', async (req, res) => {
    const { studentid } = req.params;

    try {
        const [result] = await pool.query('DELETE FROM STUDENT WHERE STUDENTID = ?', [studentid]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Failed to delete student' });
    }
});

router.get('/registered-events', async (req, res) => {
    const { studentid } = req.query;

    try {
        const sql = `
            SELECT Event.EventID, Event.EventName, Event.EventDate, Event.EventTime, Event.Location 
            FROM Registration
            JOIN Event ON Registration.EventID = Event.EventID
            WHERE Registration.StudentID = ?
        `;
        const [events] = await pool.execute(sql, [studentid]);

        res.render('registered_events', { events });
    } catch (error) {
        console.error("Error fetching registered events:", error);
        res.status(500).send("Internal Server Error");
    }
});


module.exports = router;
