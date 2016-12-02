var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mongoose = require('mongoose');
var assert = require('assert');
var app = express();
var url = require('url');
var fileUpload = require('express-fileupload');



/*
var url = require('url');
var mongourl = 'mongodb://student:password@ds031873.mlab.com:31873/comps381f';
var MongoClient = require('mongodb').MongoClient;
*/

app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');

app.set('view engine', 'html');

app.use(bodyParser());

app.use(cookieParser());
app.use(fileUpload());
app.use('/',express.static('restaurants'));
app.use(session({
	secret : 'SECRET',
	cookie : {maxAge : 60*60*1000}
}));

app.use(bodyParser.urlencoded({
	extend : false
}));

app.use(bodyParser.json());
app.use(function (req, res, next) {
  console.log('Time:', Date.now(), req.method, req.path);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})
app.set('view engine', 'ejs');

//Index page 
app.get("/", function(req, res){
	res.redirect("/login");
});


//Sign up page for creating accounts
app.get("/signup", function(req, res){
	res.render("signup");

});

//Sign Up Controller
app.post("/signup", function(req, res){
	mongoose.connect('mongodb://admin:password@ds159737.mlab.com:59737/restaurants')
	var accountSchema = require('./models/account_model');
	var db = mongoose.connection;
	db.on('error', console.error.bind(console,'connection error'));
	db.once('open', function() {
		var Account = mongoose.model('Account');
		var user = new Account({userid : req.body.userid});
		user.set('password', req.body.password);
		user.save(function(err){
			if (err){
				db.close();
				res.send('<h2>Access denied!</h2><br>'+
				'<p>Please try again!</p><br>' +
				'<input type ="button" onclick="history.back()" value="Go back"></input>');
			} else{
				console.log("Account has been created sucessfully!");
				req.session.user = user;
				req.session.userid = user.userid;
				res.redirect('/list');
				db.close();
			}
		})
	})
});	

//Login pages for user to get into the restricted pages 
app.get("/login", function(req, res){
	res.render("login");
});

//Login Controller
app.post("/login", function(req, res){
	mongoose.connect('mongodb://admin:password@ds159737.mlab.com:59737/restaurants')
	var accountSchema = require('./models/account_model');
	var db = mongoose.connection;
	db.on('error', console.error.bind(console,'connection error'));
	db.once('open', function() {
		var User = mongoose.model('Account');
		var user = {userid : req.body.userid, password : req.body.password}
		var queryString = {userid : req.body.userid};
		User.findOne(queryString, function(err,result) {
			if (result != null){
				if(result.password == user.password || result.password ==""){
					req.session.user = user;
					req.session.userid = user.userid;
					res.redirect('/list');
				} else{
					db.close();
					res.send('<h2>Access denied!</h2><br>'+
					'<p>Incorrect userID or password!<br>Please Try Again!</p><br>' +
					'<input type ="button" onclick="history.back()" value="Go back"></input>');
				}
			}
		})
	})
});

//Logout Controller
app.get("/logout", function(req, res){
	req.session = null; 
	res.redirect('/login');
	res.end()
});

//Page for creating a restaurant
app.get("/api/create", function(req, res){
	res.render("create");
});


//Restaurant creation controller
app.post("/api/create", function(req, res){
	if (!req.session.user){
		res.send('<h2>Access denied!</h2><br>'+
					'<p>You have no rights to access this page!</p><br>' +
					'<a href="/login">Login</a>');
	} else{
	/*
		var r = {};  // new restaurant to be inserted
		r['address'] = {};
		r.address.street = (req.body.street != null) ? req.body.street : null;
		r.address.zipcode = (req.body.zipcode != null) ? req.body.zipcode : null;
		r.address.building = (req.body.building != null) ? req.body.building : null;
		r.address['coord'] = [];
		r.address.coord.push(req.body.lon);
		r.address.coord.push(req.body.lat);
		r['borough'] = (req.body.borough != null) ? req.body.borough : null;
		r['cuisine'] = (req.body.cuisine != null) ? req.body.cuisine : null;
		r['name'] = (req.body.name != null) ? req.body.name : null;
		r['restaurantid'] = (req.body.restaurantid != null) ? req.body.restaurantid : null;
*/
		mongoose.connect('mongodb://admin:password@ds159737.mlab.com:59737/restaurants')
		var  restaurantSchema = require('./models/restaurant_model');
		var db = mongoose.connection;
		db.on('error', console.error.bind(console,'connection error'));
		db.once('open', function() {
			var Restaurant = mongoose.model('Restaurant');
			//var newR = new restaurant(r);
			var newR = new Restaurant({name : req.body.name});
		
			newR.set('address.building', req.body.building);
			newR.set('address.street', req.body.street);
			newR.set('address.zipcode', req.body.zipcode);
			var coordArray = [];
			coordArray.push(req.body.lon);
			coordArray.push(req.body.lat);
			newR.set('address.coord', coordArray);
			newR.set('borough', req.body.borough);
			newR.set('cuisine', req.body.cuisine);
			newR.set('restaurantid', req.body.restaurantid);
			newR.set('photo.data', new Buffer((req.files.photo.data).toString('base64')));
			newR.set('photo.contentType', req.files.photo.mimetype);
			newR.set('owner', req.session.user.userid);

			newR.save(function(err){
				if (err){	
					db.close();				
					res.json({'status' : 'failed'});
				} else{
					console.log("Restaurant has been created sucessfully!");
					db.close();
					res.json({'status' : 'ok', '_id' : newR._id});
				}
			})
		})
	}
});

//List the restaurants which follow the criteria
app.get("/list", function(req, res){
	if (!req.session.user){
		res.send('<h2>Access denied!</h2><br>'+
					'<p>You have no rights to access this page!</p><br>' +
					'<a href="/login">Login</a>');
	} else{
		mongoose.connect('mongodb://admin:password@ds159737.mlab.com:59737/restaurants')
		var db = mongoose.connection;
		var  RestaurantSchema = require('./models/restaurant_model');
		var Restaurant = mongoose.model('Restaurant');
		var queryString = req.query;
	
		if (req.query.name ==''){
			queryString = {borough : req.query.borough, cuisine : req.query.cuisine};
		}
		if (req.query.borough == 'null'){
			queryString = {name : req.query.name, cuisine : req.query.cuisine};
		}
		if (req.query.cuisine == 'null'){
			queryString = {name : req.query.name, borough : req.query.borough};
		}
		if (req.query.name == '' && req.query.borough == 'null'){
			queryString = {cuisine : req.query.cuisine};
		}
		if (req.query.name == '' && req.query.cuisine == 'null'){
			queryString = {borough : req.query.borough};
		}
		if (req.query.cuisine == 'null' && req.query.borough == 'null'){
			queryString = {name :req.query.name};
		}
		Restaurant.find(queryString, function(err,restaurants) {
				var len = restaurants.length;
				/*
				var nameList = [];
				for (var i = 0; i < restaurants.length; i++){
					nameList.push(restaurants[i].name)
				}
				*/
				if (err) return console.error(err);
				db.close();
				res.render("list.ejs", {len : len, restaurants : restaurants})
		})
	}
});

//Search page for users to search by borough)
app.get("/search", function(req, res){
	if (!req.session.user){
		res.send('<h2>Access denied!</h2><br>'+
					'<p>You have no rights to access this page!</p><br>' +
					'<a href="/login">Login</a>');
	} else{
		mongoose.connect('mongodb://admin:password@ds159737.mlab.com:59737/restaurants')
		var  RestaurantSchema = require('./models/restaurant_model');
		var db = mongoose.connection;
		db.on('error', console.error.bind(console,'connection error'))
		db.once('open', function() {

			var Restaurant = mongoose.model('Restaurant');
			function listing(callback){
				Restaurant.distinct("borough", function(err, result) {	
					if (err) return console.error(err);
					callback(result)
				});
			}
			listing(function(result){
				Restaurant.distinct("cuisine", function(err,result1) {	
					if (err) return console.error(err);
					res.render("search.ejs", {boroughList : result, cuisineList : result1})
				})

			})
		})
	}
});



//Search and read by name)
app.get("/api/read/name/:name", function(req, res){
	if (!req.session.user){
		res.send('<h2>Access denied!</h2><br>'+
					'<p>You have no rights to access this page!</p><br>' +
					'<a href="/login">Login</a>');
	} else{
		mongoose.connect('mongodb://admin:password@ds159737.mlab.com:59737/restaurants')
		var  RestaurantSchema = require('./models/restaurant_model');
		var db = mongoose.connection;
		db.on('error', console.error.bind(console,'connection error'))
		db.once('open', function() {
			var Restaurant = mongoose.model('Restaurant');
			Restaurant.find({name : req.params.name}, function(err,restaurants) {
				var result = [];
				for(var i = 0; i < restaurants.length; i++){
					result.push(restaurants[i]);
				}
				if (err) {
					db.close();
					res.json({});
				} else {
					db.close();
					res.json(result);
				}
			});
		});
	}
});

//Search and read by Borough
app.get("/api/read/borough/:borough", function(req, res){
	if (!req.session.user){
		res.send('<h2>Access denied!</h2><br>'+
					'<p>You have no rights to access this page!</p><br>' +
					'<a href="/login">Login</a>');
	} else {
		mongoose.connect('mongodb://admin:password@ds159737.mlab.com:59737/restaurants')
		var  RestaurantSchema = require('./models/restaurant_model');
		var db = mongoose.connection;
		db.on('error', console.error.bind(console,'connection error'))
		db.once('open', function() {
			var Restaurant = mongoose.model('Restaurant');
			Restaurant.find({borough : req.params.borough}, function(err,restaurants) {
				var result = [];
				for(var i = 0; i < restaurants.length; i++){
					result.push(restaurants[i]);
				}
				if (err) {
					db.close();
					res.json({});
				} else {
					db.close();
					res.json({result});
				}
			});
		});
	}
});

//Search page for users to search by cuisine)
app.get("/api/read/cuisine/:cuisine", function(req, res){
	if (!req.session.user){
		res.send('<h2>Access denied!</h2><br>'+
					'<p>You have no rights to access this page!</p><br>' +
					'<a href="/login">Login</a>');
	}else{
		mongoose.connect('mongodb://admin:password@ds159737.mlab.com:59737/restaurants')
		var  RestaurantSchema = require('./models/restaurant_model');
		var db = mongoose.connection;
		db.on('error', console.error.bind(console,'connection error'));
		db.once('open', function() {
			var Restaurant = mongoose.model('Restaurant');
			Restaurant.find({cuisine : req.params.cuisine}, function(err,restaurants) {
				var result = [];
				for(var i = 0; i < restaurants.length; i++){
					result.push(restaurants[i]);
				}
				if (err) {
					db.close();
					res.json({});
				} else {
					db.close();
					res.json({result});
				}
			});
		})
	}
});



app.get("/display", function(req, res){
	if (!req.session.user){
		res.send('<h2>Access denied!</h2><br>'+
					'<p>You have no rights to access this page!</p><br>' +
					'<a href="/login">Login</a>');
	} else {
		mongoose.connect('mongodb://admin:password@ds159737.mlab.com:59737/restaurants')
		var db = mongoose.connection;
		var  RestaurantSchema = require('./models/restaurant_model');
		var Restaurant = mongoose.model('Restaurant');
		Restaurant.findOne(req.query, function(err,restaurants) {
				var name = restaurants.name;
				var borough = restaurants.borough;
				var cuisine = restaurants.cuisine;
				var owner = restaurants.owner;
				var grades = restaurants.grades;
				var building = restaurants.address.building;
				var street = restaurants.address.street;
				var zipcode = restaurants.address.zipcode;
				var coordList = [];
				coordList = restaurants.address.coord;
				var longitude = coordList[0];
				var latitude = coordList[1];
				var photo = new Buffer(restaurants.photo.data, 'base64');
				var contentType = restaurants.photo.contentType;
				var restaurantid = restaurants.restaurantid;
				var objectID = restaurants._id; 
				
				if (contentType = 'application/octet-stream'){
				console.log(photo, contentType);
				}
				
				
				if (err) return console.error(err);
				db.close();
				
				res.render("display.ejs", {name : name, borough : borough, 
				cuisine : cuisine, owner : owner, grades : grades, building : building, 
				street : street, zipcode : zipcode, longitude : longitude, latitude : latitude,
				photo : photo, contentType : contentType, objectID : objectID})
		})
	}
});

//Edit the information of the restaurant
app.get("/update", function(req, res){
	mongoose.connect('mongodb://admin:password@ds159737.mlab.com:59737/restaurants')
		var db = mongoose.connection;
		var  RestaurantSchema = require('./models/restaurant_model');
		var Restaurant = mongoose.model('Restaurant');
		Restaurant.findOne(req.query, function(err,restaurants) {
				var name = restaurants.name;
				var borough = restaurants.borough;
				var cuisine = restaurants.cuisine;
				var building = restaurants.address.building;
				var street = restaurants.address.street;
				var zipcode = restaurants.address.zipcode;
				var coordList = [];
				coordList = restaurants.address.coord;
				var longitude = coordList[0];
				var latitude = coordList[1];
				var photo = new Buffer(restaurants.photo.data, 'base64');
				var contentType = restaurants.photo.contentType;
				var restaurantid = restaurants.restaurantid;
				var owner = restaurants.owner;
				global.objectID = restaurants._id;
				
				if (req.session.userid != owner){
					req.session.authenticated = false;
				} else{
					req.session.authenticated = true;
				}
				
				if (req.session.authenticated){
				
					if (err) return console.error(err);
					db.close();
					res.render("update.ejs", {name : name, borough : borough, 
					cuisine : cuisine, building : building, street : street, 
					zipcode : zipcode, longitude : longitude, latitude : latitude,
					restaurantid : restaurantid, photo : photo, contentType : contentType, objectID : objectID})
				} else{
					db.close();
					res.send('<h2>Access denied!</h2><br>'+
					'<p>You have no rights to access this page!</p><br>' +
					'<input type ="button" onclick="history.back()" value="Go back"></input>');
				}
			})
})


//Update Controller
app.post("/update", function(req, res){
	mongoose.connect('mongodb://admin:password@ds159737.mlab.com:59737/restaurants')
	var  restaurantSchema = require('./models/restaurant_model');
	var db = mongoose.connection;
	db.on('error', console.error.bind(console,'connection error'));
	db.once('open', function() {
		var Restaurant = mongoose.model('Restaurant');
		//var queryString = {_id : req.body._id};
		Restaurant.findOne(objectID, function(err, result){
			result.name = req.body.name;
			result.address.building = req.body.building;
			result.address.street = req.body.street;
			result.address.zipcode = req.body.zipcode;
			var coordArray = [];
			coordArray.push(req.body.lon);
			coordArray.push(req.body.lat);
			result.address.coord = coordArray;
			result.borough = req.body.borough;
			result.cuisine = req.body.cuisine;
			result.restaurantid = req.body.restaurantid;
			result.photo.data = new Buffer((req.files.photo.data).toString('base64'));
			result.photo.contentType = req.files.photo.mimetype;
			if (err) return console.error(err);


			result.save(function(err){
				if (err){
					db.close();
					res.send('<h2>Access denied!</h2><br>'+
					'<p>Please try again!</p><br>' +
					'<input type ="button" onclick="history.back()" value="Go back"></input>');
				} else{
					console.log("Restaurant has been updated sucessfully!");
					db.close();
					res.redirect('/list');
				}
			});
		});
	});
});

//Edit the information of the restaurant
app.get("/delete", function(req, res){
	mongoose.connect('mongodb://admin:password@ds159737.mlab.com:59737/restaurants')
		var db = mongoose.connection;
		var  RestaurantSchema = require('./models/restaurant_model');
		db.on('error', console.error.bind(console,'connection error'));
		db.once('open', function() {
			
			var Restaurant = mongoose.model('Restaurant');
			function deleteRes(callback){
				Restaurant.findOne(req.query, function(err, restaurant) {	
					if (err) return console.error(err);
					var owner = restaurant.owner;
					console.log(owner);
					callback(owner)
				});
			}
			deleteRes(function(owner){
				if (req.session.userid != owner){
					req.session.authenticated = false;
				} else{
					req.session.authenticated = true;
				}
				console.log(req.session.authenticated);
				if (req.session.authenticated){
					Restaurant.remove(req.query, function(err,restaurants) {			
						if (err){
							db.close();
							throw err;
							concole.log("error");
							res.redirect('/');
						} else{
							console.log("Restaurant has been deleted sucessfully!");
							db.close();
							res.redirect('/list');
						}
					});
				}else{
					db.close();
					res.send('<h2>Access denied!</h2><br>'+
					'<p>You have no rights to access this page!</p><br>' +
					'<input type ="button" onclick="history.back()" value="Go back"></input>');
				}

			});
		});
});

//Page for rating a restaurant
app.get("/rate", function(req, res){
	global.ratingID = req.query;
	res.render("rating");
});

app.post("/rate", function(req, res){
	mongoose.connect('mongodb://admin:password@ds159737.mlab.com:59737/restaurants')
	var  restaurantSchema = require('./models/restaurant_model');
	var db = mongoose.connection;
	db.on('error', console.error.bind(console,'connection error'));
	db.once('open', function() {
		var Restaurant = mongoose.model('Restaurant');
		Restaurant.findOne(ratingID, function(err, result){
			var rated = false;
			for (var i =0; i < result.grades.length; i++){
				if (result.grades[i].marker == req.session.user.userid){
					rated = true;
				} else{
					rated = false;
				}
			}
			
			if (rated){
				db.close();
				if (err) return console.error(err);
				res.send('<h2>Access denied!</h2><br>'+
				'<p>You have rated this restaurant already!</p><br>' +
				'<input type ="button" onclick="history.back()" value="Go back"></input>');
			}else{
				ratingList = {};
				ratingList['marker'] = req.session.user.userid;
				ratingList['score'] = req.body.score;
				result.grades.push(ratingList);
				result.save(function(err){
					if (err){
						db.close();
						res.send('<h2>Access denied!</h2><br>'+
						'<p>The rating range is 1 - 10!</p><br>' +
						'<input type ="button" onclick="history.back()" value="Go back"></input>');
					}else{
						console.log("Restaurant has been rated sucessfully!");
						db.close();
						res.redirect('/list');
					}
				});
			}
		});
	});
});
			
app.listen(process.env.PORT || 8099);
