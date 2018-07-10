const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const port = 8080;
var session = require('express-session');
var path = require('path');

app.use(session({
    secret: 'keyboardkitteh',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}))

const flash = require('express-flash');

app.use(flash());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, './static')));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
mongoose.connect('mongodb://localhost/login-registration');
const UserSchema = new mongoose.Schema({
    first_name: { type: String, required: [true, "A first name is required"], minlength:2 },
    last_name: { type: String, required: [true, "A last name is required"] },
    email: { type: String, required: [true, "A email is required"] },
    password: { type: String, required: [true, "A password is required"], minlength:7 },
    birthday: { type: String, required: [true, "A Date is required"] }
}, { timestamps: true })

mongoose.model('User', UserSchema);
var User = mongoose.model('User');
mongoose.Promise = global.Promise;

//========== Routes ===========
app.get('/', function (req, res) {
    console.log('-----loginandregistration page')
    res.render('index')
})

app.post('/login', function (req, res) {
    console.log("Now in login route")
    User.findOne({ email: req.body.email }, function (err, user) {
        console.log("Now finding the user")
        if (err) {
            console.log("Error: ", err)
            res.redirect('/')
        } else {
            console.log("Lets check if user exist")
            if (user) {
                console.log("Yes we found user")

                var password = req.body.password
                console.log("now compare the passwords")
                bcrypt.compare(password, user.password)
                .then(result => {
                    console.log("Check if result exist")
                    if(result){
                        console.log("Yes results does exits")
                        req.session.user_id = user._id
                        res.redirect('/dashboard')
                    }
                    console.log("Results does not exist")
                })
                .catch(error => {
                    console.log("**********")
                        if(error){
                            
                            console.log("Failed to login")
                            req.flash('login', "Failed to login");
                            res.redirect('/')
                        }
                    })
            } else{
                console.log("failed to login")
                    req.flash('login', "Failed to login");
                res.redirect('/')
            }
        }
    })
})

app.post('/registration', function (req, res) {
    console.log(req.body)
    console.log("Now find a the user email!!!!!!!!!!!")
    User.findOne({ email: req.body.email }, function (err, user) {
        console.log("Finding user email")
        if (err) {
            console.log("Error: ", err)
            res.redirect('/')
        } else {
            if (user) {
                console.log("Email already exist")
                req.flash('registration', "Email already exists")
                res.redirect('/')
            } else {
                bcrypt.hash(req.body.password, 10, function (err, hashedpassword) {
                    if (err) {
                        console.log("error: ", err)
                        redirect('/')
                    } else {
                        User.create({
                            first_name: req.body.fname,
                            last_name: req.body.lname,
                            email: req.body.email,
                            birthday: req.body.bday,
                            password: hashedpassword
                        }, function (err, newUser) {
                            if (err) {
                                console.log(err)
                                for(var key in err.errors){
                                    req.flash('registration', err.errors[key].message);
                                }
                                res.redirect('/')
                            } else {
                                console.log("Successfully registered a new user")
                                req.session.user_id = newUser._id
                                console.log(req.session.user_id)
                                console.log(newUser._id)
                                res.redirect('/dashboard')
                            }
                        })
                    }
                })
            }
        }
    })
})

app.get('/dashboard', function (req, res) {
    console.log("dashboard-----------")
    console.log("Check if session id exists")
    if(req.session.user_id){
        console.log("Now lets look for user")
        User.findOne({ _id: req.session.user_id }, function (err, user) {
            if (err) {
                console.log("Error", err)
            } else {
                // res.json(user)
                console.log(user)
                res.render('dashboard', { user: user })
            }
        })
    }else{
        console.log("You are not logged in")
        res.redirect('/')
    }
})

app.get('/logout', function (req, res) {
    req.session.destroy();
    console.log("you successfully logged out")
    res.redirect('/')
})

app.listen(port, function () {
    console.log('Listening on port: 8080')
});