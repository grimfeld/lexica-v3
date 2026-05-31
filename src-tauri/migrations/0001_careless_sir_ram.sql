CREATE TABLE `pronunciations` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`field_key` text NOT NULL,
	`source_text` text NOT NULL,
	`ipa` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`updated_at` integer NOT NULL,
	`dirty` integer DEFAULT true NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `pronunciations_note_idx` ON `pronunciations` (`note_id`);