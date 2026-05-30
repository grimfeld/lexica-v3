# FSRS scheduling with binary grading

Cards are scheduled with FSRS (via a maintained library, not hand-rolled),
chosen over SM-2 because better retention-per-review means fewer reviews for
the same retention — directly serving the "tool, not driver" north star. SR
state migration between algorithms is painful, so this is committed early.

The user grades each review with a binary pass/fail, mapped into FSRS as
Again (fail) / Good (pass). FSRS natively takes four grades; we collapse to two
because every extra button is review friction that makes the app heavier.
Hard/Easy can be exposed later as a purely additive change.

For a fresh MVP, FSRS runs on default parameters and personalizes as review
history accumulates.
