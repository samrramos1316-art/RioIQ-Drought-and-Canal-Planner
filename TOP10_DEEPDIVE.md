# Top-10 deep dive: what holds up, what doesn't

Veritas AI International High School Hackathon 2026. Team Credo (RioIQ) against the ten strongest entries.

## How I checked
- Full READMEs, results documents, notebooks (including saved outputs) and the code files each repo names, all via `raw.githubusercontent.com`.
- I tested whether README numbers appear in saved outputs, read how train/test sets and baselines are built, and compared each headline to the fairest baseline the repo itself reports.
- **Limits:** I did not run any rival's code or see their data, live demos, videos or write-ups. I could not open the judging page, so the rubric below is **as quoted by Roshni's README**; please check it against highschoolhackathon.org/judges.

## The rubric (as quoted by Roshni's README, unverified)
Technical execution 30 / Originality 20 / Impact and track fit 20 / Testing and honesty 15 / Communication 15.
This replaces the rubric I had been guessing. It weights execution heavily and communication lightly, which matches what you told me.

## Corrections to what I told you earlier
- **Saqshy:** I said it catches 69% of fire squares against 11% for classic indices. The 11% is a weak straw man (the README says why). Against the fairest simple rule in its own repo the lead is **+2.9 points (interval +2.3 to +3.4)**, and +7.0 against "where it burned last week". Its effect is not larger than ours.
- **Utter:** "84% vs 42%" compares a closed 8-word choice with open-vocabulary Whisper. The closed-set model using only other people's recordings already gets 79%, so the person's own recordings add about 5 points.
- **Roshni:** my first automated check found only 23% of its numbers. That was my error: its results notebook was not in the files I fetched. Checked properly, its headline numbers (AUC 0.978, 0.911 external, 56.1% sensitivity at the frozen cut-off, 94.9% for v2, threshold 0.614) all appear in its saved outputs.
- **Odds:** I said about 4% for 1st overall. With the real rubric and these corrections, I now put it nearer **15%** (see the end).

## Scores on the quoted rubric (my judgement; plus or minus 5 on each)
| Rank | Repo | Tech /30 | Orig /20 | Impact /20 | Testing /15 | Comm /15 | Total |
|---|---|---|---|---|---|---|---|
| 1 | Roshni | 27 | 15 | 18 | 14 | 14 | **88** |
| 2= | **RioIQ (us)** | 27 | 15 | 16 | 13 | 14 | **85** |
| 2= | The Day After | 24 | 17 | 18 | 12 | 14 | **85** |
| 4 | Utter | 25 | 16 | 18 | 11 | 14 | **84** |
| 5 | Saqshy | 23 | 14 | 15 | 14 | 13 | **79** |
| 6= | Platonic Earth | 22 | 17 | 12 | 13 | 14 | **78** |
| 6= | Lsir | 24 | 15 | 13 | 13 | 13 | **78** |
| 6= | Rosafe | 25 | 14 | 14 | 13 | 12 | **78** |
| 9 | Qalaisyn | 25 | 15 | 14 | 9 | 14 | **77** |
| 10 | Verbatim | 24 | 15 | 13 | 11 | 13 | **76** |
| 11 | Stability | 20 | 15 | 15 | 9 | 12 | **71** |

Our communication score assumes your video and write-up are strong. I have not seen them.

---

## 1. Roshni (diabetic eye screening, Pakistan): strongest and most honest
**What checks out:** the notebooks with outputs are in the repo; headline numbers reproduce from them. Near-duplicate-safe split (1,457 duplicate pairs kept on one side). Frozen threshold set on validation. External test on another country's photos. A pre-registered v2 that **failed 2 of 5 of its own tests** and is reported anyway. Post-hoc analyses are labelled post-hoc. It is also the only README that maps itself to the judging rubric.
**Soft spots:** APTOS is a heavily used dataset, so the 0.978 is not novel. At the frozen cut-off, sensitivity fell to **56.1%** on unseen hospitals, so as shipped it would miss nearly half of referable cases abroad; the fix (re-set per clinic) is a post-hoc workaround. No prospective study and no macular oedema.
**Verdict:** no bullshit found. This is the one to beat.

## 2. RioIQ (us)
**What checks out:** 200 pipeline and 46 app tests pass; JS tests pass; CI matrix on three systems; hash-gated frozen results; losses reported.
**Bullshit-level problems a judge could find:**
- README says "Every forecast test is declared first, scored once". `reports/decision.md` says it was **not a blind pre-registration**: design came from exploratory runs on the same test years, and the record was committed minutes before the final run after a provisional run had shown results. The README overstates. Change the wording.
- The one clear win (5.5% on 693 unseen western counties) holds at your **3-to-1 cost** for a miss vs a false alarm, a ratio you chose. At 2-to-1 or equal costs it ties. The East test lost.
- The "13% on the Rio Grande" figure is not blind. Do not cite it as evidence.
- Canal ranking failed its own validation (rank agreement 0.25, interval -0.23 to 0.63). The 810M gallons a day in the opening is an upper estimate your own check puts at about double.
- Only one weekly forecast is logged in `reports/prospective/`.
- First commit is Nov 14 07:06 and already contains a lot; be ready to say when the work started.
**Verdict:** no fabrication, one overclaiming sentence, and a modest effect.

## 3. The Day After (Gaza farmland)
**What checks out:** 1 km spatial blocks, 100 m buffer, 14 automatic leakage tests, rules pushed before each test, a second governorate scored once, and a second AI recomputed the numbers.
**Bullshit found:**
- The UN "answer key" is **made from the same satellite's greenness** the model reads. The README admits "reference, not ground truth", but it means 0.86 largely measures how well the model reproduces the labelling method.
- **Forward in time, the model is 0.79 against 0.77 for a simple rule.** That is a near tie, and it is the test closest to real use.
- When it says "intact", the UN agrees only **71%** of the time, and "intact" is the call the decision depends on.
- The README says v2 was partly inspired by v1's mistakes on the same test land; only Deir al-Balah is fresh.
**Verdict:** very honest, strong story, weaker evidence than the headline suggests.

## 4. Utter (dysarthria voice control)
**What checks out:** code matches README; seeds; shuffled-label control; a no-leakage assertion; one copy per recording across two microphones; the WavLM layer is picked on speakers without dysarthria.
**Bullshit found:** unfair Whisper baseline (open vocabulary vs closed 8-word choice; Whisper only gets 73% on typical speakers, so the baseline is handicapped); personalisation adds about 5 points over the generic closed-set model; no session-level hold-out, so same-session recordings can sit in enrollment and test; only 7 speakers.
**Verdict:** real and useful for the severe speakers (Whisper 12-20% to Utter 68-87%), but the headline is flattering.

## 5. Saqshy (Kazakhstan fire risk)
**What checks out:** 3 unseen seasons (1.09M square-days), wins every season, bootstrap intervals, and an unusually candid README.
**Bullshit found:** the 11% baseline is a straw man; real lead over a fair 4-input rule is **+2.9 points**; on new fires 42.5% vs 36.4%. "Fires" are satellite detections that include **stubble burning**; it flags this and shows 70.0% vs 66.7% in June-September. The model needs fire history to do well (no-history version 53%, below the "usual for this month" map at 55%).
**Verdict:** honest, but the edge is small and similar in size to ours.

## 6. Platonic Earth
**What checks out:** a real novel idea (one Procrustes rotation joining two frozen models), honest takeaway line, live demo.
**Bullshit found:** the 96% retrieval is on **EuroSAT's labelled classes** (the rotation is fit on labelled EuroSAT photos), not arbitrary queries like "tall trees near a river". At the actual town it **ties** always answering "Residential" (64% vs 62%). The heat result (-1.69 C per +0.1 greenness) is a standard NDVI-temperature relationship, not something the AI discovered.
**Verdict:** honest and original, thin impact.

## 7. Lsir (Armenian phone ASR)
**What checks out:** 8 numbered experiment scripts, CIs, a replication that failed and was reported.
**Bullshit found:** whisper-small is above 100% word error, a useless baseline. Against the real base model (BuzzASR) the gains are **0.2 to 1.3 points** and one is not significant (phone: -0.2, interval -0.6 to +0.1). The "phone line" is a **simulation**, and the clinic test is 40 author-written sentences with synthetic voices.
**Verdict:** a small LoRA tweak on someone else's model; its value is the benchmark and simulator.

## 8. Rosafe (DFW road danger)
**What checks out:** frozen, run once on 2024, 1,000-redraw test, TxDOT's 679,621 crashes, a SwiftUI app.
**Bullshit found:** the gain over "every day is normal" is **+4.3%**, modest, and a rain-only rule was nearly as good in one year. Judges cannot install the iPhone app (README says so). Weather is known to affect crashes.
**Verdict:** honest and tidy, with an effect about the same size as ours.

## 9. Qalaisyn (Kazakh text on Russian keyboards)
**Bullshit found:** the 47% to 3.5% result is on **simulated noise** (`chatify.py` generates the typing styles), the same family of mapping the model inverts. On the 70 real messages, "two rules were added after reading these errors; before them 16.1%", so 11.9% was tuned on the test set. Beating free ChatGPT (12.9%) on 70 messages after tuning is within noise.
**Verdict:** big engineering (4.6k lines, extension), weak real-world evidence.

## 10. Verbatim (code-switched ASR)
**What checks out:** thresholds frozen with timestamps, a stated pilot disclosure, v4 rejected by a pre-written rule, blind human labels.
**Bullshit found:**
- The 47% MER cut mostly reflects a decoder fine-tuned **on the same corpus**; it learned ASCEND's writing style.
- On the 70 human-labelled random lines, "fully correct" is **37% vs 40%** (intervals overlap) and silent translations are **8 vs 7**. The "stops translating" claim holds for 13 of 21 only.
- On out-of-domain synthetic speech it is **worse** than plain Whisper (7.7% vs 6.6% MER; English recall 0.62 vs 0.72).
- The flag has 100% precision but catches 26% of errors.
- Only two test speakers.
**Verdict:** very well documented, but the headline is not supported by its own human labels.

## 11. Stability (teen mental-health app)
**Bullshit found:** README says "3.4 times better timing"; the experiment file says **"it finds who to ask more often, not which week; random weeks for the same students did as well (45%)."** Earlier PHQ-2 answers alone give AUC 0.89, so the model is mostly persistence. Phone signals were near chance (their own "first idea failed"), yet the app reads 17 data sources. Trained on 213 college students; teen test is a separate 113-teen set. A heavy privacy surface with little evidence of benefit.
**Verdict:** the best story in Health and a big experiment set, undermined by its own results.

---

## Where this leaves us
- **Rubric as quoted:** we tie for 2nd, behind Roshni. Rivals' headline effects shrink when checked against fair baselines, while our biggest problems (not blind, canal model) are already written in our own docs.
- **Odds (my judgement, wide error bars):** finalist about 80%; 1st in Climate about 35% (Day After is the main rival); 1st overall about 15% (Roshni is the main rival); top 5 overall about 55%.
- **Why higher than before:** the real rubric weights execution (30) and honesty (15) more, and the deep dive cut the rivals' headline effects. It is not that anything about our repo improved.

## What to do before submission
1. Fix the "declared first" line to match `decision.md`.
2. Add a short table mapping your README to the five rubric criteria, the way Roshni does.
3. Lead with the 5.5% result, say the 3-to-1 condition and the East loss next to it.
4. Soften the 810M figure to "up to", with the "about half in our 16-canal check".
5. Confirm the rubric on the judging page and tell me if the weights differ.
