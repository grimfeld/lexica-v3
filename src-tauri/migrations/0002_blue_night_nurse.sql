CREATE TABLE `tts_cache` (
	`keyhash` text PRIMARY KEY NOT NULL,
	`audio_b64` text NOT NULL,
	`mime` text NOT NULL,
	`created_at` integer NOT NULL
);
