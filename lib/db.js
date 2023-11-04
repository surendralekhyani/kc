require('dotenv').config(); // This line should be at the top of your main file
const mysql = require('mysql2');
const connection = mysql.createConnection({
	host:process.env.DB_HOST,
	user:process.env.DB_USERNAME,
	password:process.env.DB_PASSWORD,
	database:process.env.DB_DBNAME,
	port: process.env.DB_PORT
});
connection.connect(function(error){
	if(!!error) {
		console.log(error);
	} else {
		console.log('Database Connected Successfully..!!');
	}
});

module.exports = connection;