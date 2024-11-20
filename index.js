const express = require("express");
const { Pool } = require("pg");
const app = express();
const path = require("path");

require("dotenv").config();

app.set("view engine", "ejs");
app.use(express.static("public/css"));
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 2,
});

const sql_create = `CREATE TABLE IF NOT EXISTS BOOKS (
	book_id SERIAL PRIMARY KEY,
	title VARCHAR(100) NOT NULL,
	author VARCHAR(100) NOT NULL,
	comments TEXT
);`;

pool.query(sql_create, [], (err, result) => {
  if (err) {
    console.error("Error creating table", err);
  }
  console.log("Table created");
});

const sql_insert = `INSERT INTO BOOKS (book_id, title, author, comments) VALUES
    (1, 'Mrs. Bridge', 'Evan S. Connell', 'First in the serie'),
    (2, 'Mr. Bridge', 'Evan S. Connell', 'Second in the serie'),
    (3, 'L''ingénue libertine', 'Colette', 'Minne + Les égarements de Minne')
  	ON CONFLICT DO NOTHING;`;
pool.query(sql_insert, [], (err, result) => {
  if (err) {
    return console.error(err.message);
  }
  const sql_sequence =
    "SELECT SETVAL('Books_Book_ID_Seq', MAX(Book_ID)) FROM Books;";
  pool.query(sql_sequence, [], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Successful creation of 3 books");
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started (http://localhost:3000/) !");
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/data", (req, res) => {
  const test = {
    title: "Test",
    items: ["one", "two", "three"],
  };
  res.render("data", { model: test });
});

app.get("/books", (req, res) => {
  const sql = "SELECT * FROM BOOKS ORDER BY title";
  pool.query(sql, [], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("books", { model: result.rows });
  });
});

app.get("/edit/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM BOOKS WHERE book_id = $1";
  pool.query(sql, [id], (err, result) => {
    // if (err) ...
    res.render("edit", { model: result.rows[0] });
  });
});

app.post("/edit/:id", (req, res) => {
  const id = req.params.id;
  const book = [req.body.title, req.body.author, req.body.comments, id];
  const sql =
    "UPDATE BOOKS SET title = $1, author = $2, comments = $3 WHERE (book_id = $4)";
  pool.query(sql, book, (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    res.redirect("/books");
  });
});
