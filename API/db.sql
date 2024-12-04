CREATE DATABASE IF NOT EXISTS ProjectN;
CREATE USER IF NOT EXISTS 'mkoval'@'localhost' IDENTIFIED BY '12345Cow';
GRANT ALL PRIVILEGES ON ProjectN.* TO 'mkoval'@'localhost';

USE ProjectN;

CREATE TABLE IF NOT EXISTS user(id INT PRIMARY KEY AUTO_INCREMENT,
login VARCHAR(32) NOT NULL UNIQUE,
password VARCHAR(255) NOT NULL,
full_name VARCHAR(128),
email VARCHAR(128) NOT NULL UNIQUE,
verification_email BOOLEAN DEFAULT false,
profile_picture VARCHAR(255),
rating INT DEFAULT 0,
role ENUM('user', 'admin') DEFAULT 'user');

CREATE TABLE IF NOT EXISTS category(id INT PRIMARY KEY AUTO_INCREMENT,
title VARCHAR(64) NOT NULL UNIQUE,
description TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS post(id INT PRIMARY KEY AUTO_INCREMENT,
author INT DEFAULT 0,
title VARCHAR(128) NOT NULL,
publish_date DATE NOT NULL,
status ENUM('active', 'inactive') DEFAULT 'active',
content TEXT NOT NULL,
FOREIGN KEY (author) REFERENCES user(id) ON DELETE SET DEFAULT);

CREATE TABLE IF NOT EXISTS postCategory(post_id INT NOT NULL,
category_id INT NOT NULL,
FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE,
PRIMARY KEY (post_id, category_id));

CREATE TABLE IF NOT EXISTS comment(id INT PRIMARY KEY AUTO_INCREMENT,
author INT DEFAULT 0,
publish_date DATE NOT NULL,
post_id INT NOT NULL,
status ENUM('active', 'inactive') DEFAULT 'active',
content TEXT NOT NULL,
FOREIGN KEY (author) REFERENCES user(id) ON DELETE SET DEFAULT,
FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS likes(id INT PRIMARY KEY AUTO_INCREMENT,
author INT DEFAULT 0,
publish_date DATE NOT NULL,
post_id INT,
comment_id INT,
type ENUM('like', 'dislike') NOT NULL,
FOREIGN KEY (author) REFERENCES user(id) ON DELETE SET DEFAULT,
FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
FOREIGN KEY (comment_id) REFERENCES comment(id) ON DELETE CASCADE,
CHECK ((post_id IS NULL AND comment_id IS NOT NULL) OR (post_id IS NOT NULL AND comment_id IS NULL)));

INSERT INTO user (login, password, full_name, email, verification_email, profile_picture, rating, role) VALUES
("user", "d74350fa2a55fb8aa0e3587220634375:14706fd3e177eb58251f14cbf0df836501792280801f9e57cfa9ee46c168797b8c9a27d651b18004bf18ae7738b84a7a2fe62d8c950a128b599a1cf2734aaea8", "User One", "user1@example.com", true, "1.png", -1, "user"),
("admin", "b259762602629b553f61cc5bc6a109d3:fbb2b95b98cc96a9ad3706330fc8a9c8891cc545e3badcac6e043ad47d188fe12bf070e427962cfd409695895e8d6df113486d45c1d70ccc155a5ee843a7ba1a", "Admin One", "admin1@example.com", true, "2.png", 2, "admin"),
("admin2", "c3941b1fcf274f0fdf162827eeb5083a:1f4b84f704bb0435a72c7fe56ca7097b0916fa2240406e6ad63756bdbb672fcaecb872a0655fcb938215003e426945db9a13c7887266ba21ac3ca6dd905213f9", "Admin Two", "admin2@example.com", false, "3.png", 0, "admin"),
("user2", "7a2e4605b34e23c8b61c2db9657a6b33:088a34c837df2bec6eaa58fc032392e104f0d5d5ee5c77e25251b8dd99d75e02665760f2c263c7031256697a3eb7661f53812b90bb1c2458e7769a5eb2a5ccdd", "User Two", "user2@example.com", false, "4.png", 3, "user"),
("user3", "7340d096cf291ce772d377d4599db8b0:3498bec19a66568ffcbbc7d042589d110f626d5817014d25dfc1c49994be60bd966899e329ed56d436fcb575f1862f71464a632f2737e599322fd095a1301ab5", "User Three", "user3@example.com", true, "5.png", 0, "user");

INSERT INTO category (title, description) VALUES
("Node.js", "Node.js is a free, open-source, cross-platform JavaScript runtime environment that lets developers create servers, web apps, command line tools and scripts."),
("CSS", "CSS is the language we use to style an HTML document. CSS describes how HTML elements should be displayed."),
("Java", "Java is a high-level, class-based, object-oriented programming language that is designed to have as few implementation dependencies as possible."),
("HTML", "HTML (HyperText Markup Language) is the most basic building block of the Web."),
("Python", "Python is a high-level, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation.");

INSERT INTO post (author, title, publish_date, status, content) VALUES
(1, "Making an image float to the left of an HTML list", '2021-05-10', "inactive", "Is it possible to float an image to the left of an HTML list. Well it seems possible, but can I make it look nice with the bullets not on top of the image? I need the bullets to line up with the text above and below the list."),
(4, "Java Hibernate. OneToMany collection problem", "2024-02-19", "active", "I have two entities. So, when I add the TaskEntity value into TicketEntity tasks Collection and merging to database, 
then all the values that were in the tasks are saved, but with a new ID enter image description here (11 - first saving, 12 - second). 
All that I need is saving the collection but without duplicates."),
(5, "Understanding SQL joins", "2024-01-12", "active", "Content about SQL joins"),
(4, "Use Python f-strings and Jinja at the same time", "2024-08-16", "active", "I am trying to write a concise SQL query string in Python, to make use of both f-strings and Jinja at the same time.
Background info: I am writing a query used in Airflow. So it did the f-string value replacement but not the Jinja. How can I make both f-strings and Jinja work at the same time?"),
(1, "How to convert a Map<String, String> to a POJO using Jackson?", '2024-04-15', 'active', "I need to write some Java code with these requirements:
Input is received as a Map<String, String>.
The code needs to use Jackson to convert the input into a POJO. Some of the POJO's fields contain strings and enums. For these fields, the map's values are simply the plain strings or the result of calling .toString() on an enum value. Other fields contain other POJOs, lists of POJOs, etc. These exist as JSON objects in the map.
Custom code needs to be kept to a minimum. Ideally, annotations in the POJO classes would contain all the information Jackson needs to do its job. (If a new field is added to a POJO class with the proper annotations, it should work without additional code changes.)
The code needs to use an ObjectMapper that's provided using dependency injection. This limits the places in the code that can use the ObjectMapper. (For example, it's not available in a @JsonSetter method in the POJO class.)");

INSERT INTO postCategory (post_id, category_id) VALUES
(1, 4),
(2, 3),
(3, 2),
(4, 5),
(5, 3),
(1, 2);

INSERT INTO comment (author, publish_date, post_id, status, content) VALUES
(1, "2021-06-12", 1, "active", "Another solution would be to add position relative to the list and then give a left: value(ie 20px). Just a minor addition to Mr Alien's great answer, adding a margin-right to the image will not only push the list but also text that might exist before or after it- the result might seem misaligned."),
(2, "2024-11-19", 2, "active", "As you can see, there is a linking table between the auditing tables, but no linking table between the entity tables. In the Hibernate-Envers Developerguide I found the following text:
When a collection is mapped using these two (@OneToMany+@JoinColumn) annotations, Hibernate doesn't generate a join table. Envers, however, has to do this, so that when you read the revisions in which the related entity has changed, you don't get false results."),
(5, "2024-11-18", 3, "inactive", "I think I need more information about SQL joins."),
(4, "2024-11-17", 4, "active", "I found that doubling the curly brackets {{ and }} works. The double curly bracket gets escaped to a single one, and since Jinja requires 2 of them, 4 brackets does the trick."),
(5, "2024-11-16", 5, "active", "In your code, you're using convertValue to create an instance of MyPojo. This method performs a two-step conversion, where the input map is first serialized into a Json and then deserialized into the target class (MyPojo).");

INSERT INTO likes (author, publish_date, post_id, comment_id, type) VALUES
(1, "2022-09-16", 1, NULL, "like"),
(4, "2024-06-05", 2, NULL, "like"),
(2, "2024-11-30", NULL, 1, "dislike"),
(5, "2024-07-18", 4, NULL, "like"),
(5, "2024-04-27", NULL, 2, "like"),
(3, "2024-04-16", 4, NULL, "like"),
(3, "2024-05-17", 4, NULL, "like"),
(5, "2024-07-18", NULL, 1, "dislike"),
(4, "2024-10-15", 5, NULL, "dislike"),
(1, "2024-03-04", NULL, 5, "like");