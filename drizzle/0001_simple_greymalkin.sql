CREATE TABLE `room_presence` (
	`room_code` text NOT NULL,
	`player_id` text NOT NULL,
	`last_seen` integer NOT NULL,
	PRIMARY KEY(`room_code`, `player_id`)
);
