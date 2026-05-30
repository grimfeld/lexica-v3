CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`slice_key` text NOT NULL,
	`fsrs` text NOT NULL,
	`updated_at` integer NOT NULL,
	`dirty` integer DEFAULT true NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `cards_note_idx` ON `cards` (`note_id`);--> statement-breakpoint
CREATE TABLE `deck_notes` (
	`deck_id` text NOT NULL,
	`note_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	`dirty` integer DEFAULT true NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `deck_notes_deck_idx` ON `deck_notes` (`deck_id`);--> statement-breakpoint
CREATE TABLE `decks` (
	`id` text PRIMARY KEY NOT NULL,
	`language_id` text NOT NULL,
	`name` text NOT NULL,
	`updated_at` integer NOT NULL,
	`dirty` integer DEFAULT true NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `languages` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`content_font` text,
	`updated_at` integer NOT NULL,
	`dirty` integer DEFAULT true NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`language_id` text NOT NULL,
	`type` text NOT NULL,
	`fields` text NOT NULL,
	`paused` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL,
	`dirty` integer DEFAULT true NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `notes_language_idx` ON `notes` (`language_id`);