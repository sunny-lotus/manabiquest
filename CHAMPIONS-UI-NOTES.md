> This describes the earlier UI-only migration. The current 3-character CPU battle supersedes the one-companion battle below; see [THREE-PARTY-NOTES.md](THREE-PARTY-NOTES.md).

# Champions UI adaptation

Appended to the existing encrypted interface update, preserving current music, question layout and base game. Source: src/champions-ui.js / src/champions-ui.css.

Character-triggered commands, name-triggered details, compact battle toolbar, HP/MP dock and subject XP progress. Quest keeps hero + one companion and its original weakness/XP formulas. Battle and QR data are unchanged.

Validated at 1366x768 and 375px: actual attack/support matches ManabiSkills.step; skill reservation, hero reselect, solo guard, all 19 companions, XP/equipment/follower QR preservation, no JS errors or horizontal overflow.
