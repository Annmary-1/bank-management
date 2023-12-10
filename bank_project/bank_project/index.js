

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const mysql = require('mysql2');
const ejs = require('ejs');



const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');


app.use(express.static('public'));


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'bank'
  });

connection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      return;
    }
    console.log('Connected to MySQL database');
  });
  


app.use(session({
    secret: 'qwerty',
    resave: false,
    saveUninitialized: true,
  }));



function basicauth(req, res, next) {
    if (req.session.loggedIn) {
        next();
    } else {
        res.redirect('/');
    }
}


app.get('/', (req, res) => {

  res.sendFile('index.html');
});

app.get('/adminlogin', (req, res) => {

    res.sendFile(path.join(__dirname, 'public', 'adminlogin.html'));
  });

app.get('/register', (req, res) => {

    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});


app.get('/feedback',basicauth, (req, res) => {

    res.sendFile(path.join(__dirname, 'public', 'feedback.html'));
});


app.get('/userdashboard',basicauth, (req, res) => {

    res.sendFile(path.join(__dirname, 'public', 'userdashboard.html'));
});

app.get('/admindashboard',basicauth, (req, res) => {

    res.sendFile(path.join(__dirname, 'public', 'admindashboard.html'));
});


app.get("/createaccount", basicauth, (req, res) => {
    var uid = req.session.userId;
    connection.query(
        "SELECT * FROM Accounts WHERE user_id = ?",
        [uid],
        function (error, results, fields) {
            if (error) {
                console.log(error);
                res.status(500).send("Internal Server Error");
            } else {
                if (results.length > 0) {
                    const errorMessage = 'An account with the same user ID already exists.';
                    const script = `<script>alert("${errorMessage}");window.location.href="/userdashboard";</script>`;
                    res.send(script);
                } else {
                    connection.query(
                        "INSERT INTO Accounts (user_id) VALUES (?)",
                        [uid],
                        function (error, results, fields) {
                            if (!error) {
                                console.log("Account created successfully...");
                                const successMessage = 'Account created successfully...';
                                const script = `<script>alert("${successMessage}");window.location.href="/userdashboard";</script>`;
                                res.send(script);
                            } else {
                                console.log(error);
                                res.status(500).send("Internal Server Error");
                            }
                        }
                    );
                }
            }
        }
    );
});



app.get("/deleteaccount",basicauth,(req, res) => {
    var uid = req.session.userId;

     connection.query(
                "delete from Accounts where user_id = (?)",
                [uid],
                function (error, results, fields) {
                    if(!error)
                    {
                     console.log("Account deleted ");
                     const Message = 'Account deleted successfully...';
                    const redirectUrl = '/userdashboard';
                    const script = `<script>alert("${Message}");window.location.href="${redirectUrl}";</script>`;
                    res.send(script);
                    }
                }
            );
        
});

app.get("/viewaccountdetails",basicauth, (req, res) => {
    var uid = req.session.userId;

    connection.query(
        "SELECT * FROM Accounts INNER JOIN Users ON Accounts.user_id = Users.user_id WHERE Accounts.user_id = ?",
        [uid],
        function (error, results, fields) {
            if (error) {
                console.error(error);
                return res.status(500).send('Internal Server Error');
            }

            if (results.length === 0) {
                const message = 'Account does not exist';
                const redirectUrl = '/userdashboard';
                const script = `<script>alert("${message}");window.location.href="${redirectUrl}";</script>`;
                return res.send(script);
            }

            res.render('accounts_details', { data: results });
        }
    );
});


app.get("/allaccountdetails",basicauth, (req, res) => {
    var uid = req.session.userId;

    connection.query(
        "SELECT * FROM Accounts INNER JOIN Users ON Accounts.user_id = Users.user_id",
        function (error, results, fields) {
            if (error) {
                console.error(error);
                return res.status(500).send('Internal Server Error');
            }

            if (results.length === 0) {
                const message = 'No Account ';
                const redirectUrl = '/admindashboard';
                const script = `<script>alert("${message}");window.location.href="${redirectUrl}";</script>`;
                return res.send(script);
            }

            res.render('all_accounts_details', { data: results });
        }
    );
});

app.get("/allTransactions",basicauth, (req, res) => {
    var uid = req.session.userId;

    connection.query(
        "SELECT * FROM Transactions",
        function (error, results, fields) {
            if (error) {
                console.error(error);
                return res.status(500).send('Internal Server Error');
            }

            if (results.length === 0) {
                const message = 'No Transactions ';
                const redirectUrl = '/admindashboard';
                const script = `<script>alert("${message}");window.location.href="${redirectUrl}";</script>`;
                return res.send(script);
            }

            res.render('all_Transactions', { data: results });
        }
    );
});


app.get("/allfeedback",basicauth, (req, res) => {
    var uid = req.session.userId;

    connection.query(
        "SELECT * FROM feedback",
        function (error, results, fields) {
            if (error) {
                console.error(error);
                return res.status(500).send('Internal Server Error');
            }

            if (results.length === 0) {
                const message = 'No Feedbacks ';
                const redirectUrl = '/admindashboard';
                const script = `<script>alert("${message}");window.location.href="${redirectUrl}";</script>`;
                return res.send(script);
            }

            res.render('all_feedbacks', { data: results });
        }
    );
});

app.get('/deposit_withdraw',basicauth, (req, res) => {

    res.sendFile(path.join(__dirname, 'public', 'deposit_withdraw.html'));
});


app.get('/logout',basicauth, function (req, res) {
    req.session.loggedIn = false;
    req.session.userId = null;
    console.log("logged out")
    res.redirect('/')
});

app.get('/adminlogout',basicauth, function (req, res) {
    req.session.loggedIn = false;
    req.session.userId = null;
    console.log("logged out")
    res.redirect('/adminlogin')
});

app.post('/login', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;

    connection.query("select * from Users where username = ?", [username], function (_error, results, _fields) {
        if (results.length > 0 && results[0].password == password) {
                    req.session.userId = results[0].user_id;
                    req.session.loggedIn = true;
                    res.redirect("/userdashboard");
                    console.log("login successfull")              
                }
        else {
            const errorMessage = 'Unregistered User Or Credentials Incorrect';
            const redirectUrl = '/';
            const script = `<script>alert("${errorMessage}");window.location.href="${redirectUrl}";</script>`;
            res.send(script);
        }
    });
});


app.post('/adminlogin', (req, res) => {
        var username = req.body.adminusername;
        var password = req.body.adminpassword;
    
        connection.query("select * from admin where admin_username = ?", [username], function (_error, results, _fields) {
            if (results.length > 0 && results[0].admin_password == password) {
                        req.session.userId = results[0].user_id;
                        req.session.loggedIn = true;
                        res.redirect("/admindashboard");
                        console.log("admin login successfull")              
                    }
            else {
                const errorMessage = 'Unauthorized Or Credentials Incorrect';
                const redirectUrl = '/adminlogin';
                const script = `<script>alert("${errorMessage}");window.location.href="${redirectUrl}";</script>`;
                res.send(script);
            }
        });
});


app.post("/register",(req, res) => {
    var fullname = req.body.fullName;
    var username = req.body.username;
    var password = req.body.password;
    var repassword = req.body.repassword;
    var email = req.body.email;
    var phone = req.body.phoneNumber;

    if (password != repassword) {
        const errorMessage = "Passwords do not match";
        const redirectUrl = "/register";
        const script = `<script>alert("${errorMessage}");window.location.href="${redirectUrl}";</script>`;
        return res.send(script);
    } 
    else
    {
            connection.query(
                "insert into Users (full_name, username, password,email,phone_number) values (?, ?, ?,?,?)",
                [fullname, username, password, email, phone],
                function (error, results, fields) {
                    if (error) {
                        if (error && error.errno === 1062) {
                            const errorMessage = "Username already exists";
                            const redirectUrl = "/register";
                            const script = `<script>alert("${errorMessage}");window.location.href="${redirectUrl}";</script>`;
                            return res.send(script);
                        } else {
                            console.log(error);
                            res.sendStatus(500);
                        }
                    } 
                    else 
                    {
                        console.log("user inserted successfully...");
                        res.redirect("/userdashboard");
                    }
                }
            );
        
    }
});

app.post("/deposit_withdraw", (req, res) => {
    const { userId, accountNumber, amount, transactionType } = req.body;

    connection.query(
        'INSERT INTO Transactions (user_id, account_number, transaction_type, amount) VALUES (?, ?, ?, ?)',
        [userId, accountNumber, transactionType, amount],
        (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).send('Internal Server Error');
            }

            if (transactionType === 'Deposit') {
                connection.query(
                    'UPDATE Accounts SET balance = balance + ? WHERE user_id = ?',
                    [amount, userId],
                    (error, results) => {
                        if (error) {
                            console.error(error);
                            return res.status(500).send('Internal Server Error');
                        }
                        console.log("Balance updated");
                        return res.redirect("/userdashboard");
                    }
                );
            } else if (transactionType === 'Withdrawal') {
                connection.query(
                    'UPDATE Accounts SET balance = balance - ? WHERE user_id = ?',
                    [amount, userId],
                    (error, results) => {
                        if (error) {
                            console.error(error);
                            return res.status(500).send('Internal Server Error');
                        }
                        console.log("Balance updated");
                        return res.redirect("/userdashboard");
                    }
                );
            }
        }
    );
});


app.post('/feedback', (req, res) => {
    const uid = req.session.userId;
    const {feedback_text, rating } = req.body;

    const sql = 'INSERT INTO feedback (user_id, feedback_text, rating) VALUES (?, ?, ?)';
    const values = [uid, feedback_text, rating];

    connection.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error executing MySQL query:', err);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('Feedback submitted successfully');
            const errorMessage = "Feedback submitted successfully";
        const redirectUrl = "/userdashboard";
        const script = `<script>alert("${errorMessage}");window.location.href="${redirectUrl}";</script>`;
        return res.send(script);
        }
    });
});



const port = 8000;

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
