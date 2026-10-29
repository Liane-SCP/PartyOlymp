CREATE TABLE `wiki_articles` (
	`title` text PRIMARY KEY NOT NULL,
	`article` text NOT NULL,
	`fetched_at` integer NOT NULL
);
