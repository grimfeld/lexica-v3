# TTS cache: app-fixed voices, opt-in ownerless global cache

Voice and model are chosen by the app, one per Language, app-wide (for both BYOK
and cloud users). The user does not pick voices. This collapses the TTS cache
key to `hash(normalizedText + language)`.

TTS (ElevenLabs) is costly per generation, so audio is cached. Cache location is
a user choice, independent of card Storage Mode:

- **Local cache** — private, on device. Re-pays the provider per device because
  it cannot read the shared pool. The user is informed of this higher cost.
- **Global cache** — entries stored in PocketBase, shared across all users, free
  to opt into, lowers cost. Entries are **ownerless** (`keyhash -> audio`, no
  user attached), so the store never records who voiced which text — this is
  what makes the shared cache privacy-safe.

A privacy-maximizing user can stay fully local on both axes (cards and TTS
cache) and accept the higher provider cost. A cost-conscious local-card user can
opt into the global TTS cache alone. The two cloud-touch axes — card storage and
TTS cache — are deliberately independent.
