# Chat view — agent sizes

Kept by the main session from the agents' transcripts (the last usage record), not from what agents say about
themselves. Cap 500 thousand; workers are warned at 400, leads hand over at about 380.

| Agent | Role | Started | Size after reading in | Final size | Tool calls | Minutes | Warned at |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A lead 1 | lead, task A (toolbar) | 2026-10-23 15:34 | 197k (first turn: read in, plan, A1 task; 20 tool calls, 17.5 min) | | | | |
| A1 worker | worker, run A1 (button model, manifest) | 2026-10-23 15:53 | | 324k | 91 | 36 | not warned |
| A lead 1 | after checking A1 and writing A2 | | | 277k (35 tool calls, 15 min that turn) | | | |
| A2 worker | worker, run A2 (host, registration, bridge writer) | 2026-10-23 16:45 | | 416k | 104 | 52 | 401k at 17:36 (was already closing) |
| A lead 1 | after passing on the main session's answers | | | 308k | | | |
| B lead 1 | lead, task B (mod) | 2026-10-23 17:26 | 257k (first turn: read in, plan, B1 task; 70 tool calls, 16 min) | | | | |
| B1 worker | worker, run B1 (build the mod) | 2026-10-23 17:43 | | 362k | 174 | 31 | not warned |
| A lead 1 | after checking A2, writing A3, handing over | | | 359k (handed over through its lead file) | | | |
| C lead 1 | after two short answers (OK) | | | 196k | | | |
| A lead 2 | successor lead, task A (reads in, then READY) | 2026-10-23 17:44 | 105k (READY; 10 tool calls, 1.3 min) | | | | |
| A3 worker | worker, run A3 (package, README) | 2026-10-23 18:14 | | 361k | 74 | 34 | not warned |
| B lead 1 | after checking nothing yet (answered B1's question, then waited) | | | 321k | | | |
| A lead 2 | after checking A3 and writing A4 | | | 205k | | | |
| C1 worker | worker, run C1 (capture thinking, launch contract) | 2026-10-23 19:02 | | 390k | 128 | 36 | not warned (finished just under 400k) |
| A4 worker | worker, run A4 (VS Code's when-clause parser) | 2026-10-23 19:02 | | 311k | 95 | 26 | not warned |
| B2 worker | worker, run B2 (harden the mod) | 2026-10-23 19:05 | | 323k | 133 | 31 | not warned |
| A lead 2 | after checking A4 and writing A5 | | | 266k | | | |
| A5 worker | worker, run A5 (VS Code CLI install check) | 2026-10-23 19:37 | | | | | |
| B lead 1 | after checking B2; task B done | | | 379k | | | |
| C lead 1 | after checking C1 and writing C2 | | | 301k | | | |
| C2 worker | worker, run C2 (line filter, level-1 tests) | 2026-10-23 19:50 | | stopped at once (direction changed) | | | |
| A5 worker | run A5 | | | stopped at about 19:53 (direction changed) | | | |
| T1 worker | worker, run T1 (two-way button, palette panel); lead: main | 2026-10-24 00:21 | | | | | |
| M1 worker | worker, run M1 (chat-colors mod); lead: main | 2026-10-24 00:21 | | | | | |

From 19:02 the user asked for the tasks to run in parallel: several workers at once, each checking free memory
(at least 1.0 GB) before every heavy command.
| C lead 1 | lead, task C (filter) | 2026-10-23 17:26 | 184k (first turn: read in, plan, C1 task; 18 tool calls, 13 min) | | | | |
