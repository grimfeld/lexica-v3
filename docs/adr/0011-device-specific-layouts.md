# Two device-specific layouts, one core

Rather than one responsive layout, the app ships two distinct layouts over a
shared data/logic core (shared hooks, stores, queries; divergent component
trees):

- **Desktop — authoring station.** Sidebar navigation. Optimized for bulk
  content entry, PDF extraction, and tailoring Notes, types, and Decks.
  Keyboard-heavy; room for wide structures like conjugation tables.
- **Mobile — review companion.** Bottom navigation, dashboard-first. Optimized
  for reviewing Cards on the go, thumb-driven.

Every feature is available on both; the layout only *favors* the device's
natural job. The mobile dashboard is a calm launchpad to review ("ready to
review / Start"), never a scoreboard — no streaks, counts-as-pressure, or
nudges, per ADR-0005.

The trade-off: more component code than a single responsive tree, bought for
ergonomics that match how each device is actually used.
