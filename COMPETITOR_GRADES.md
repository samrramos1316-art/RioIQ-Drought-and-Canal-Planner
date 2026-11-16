# Final competitor grades and rankings: Veritas AI International High School Hackathon 2026

Team Credo (RioIQ). All 298 READMEs re-fetched three times; the third pass found only three changed. For the top 30 I also read results sections and fetched the code files each repo names.

> **Update:** see `TOP10_DEEPDIVE.md`. It checks the ten strongest entries against their own data and code, finds the official rubric as quoted by Roshni's README (Technical execution 30 / Originality 20 / Impact 20 / Testing and honesty 15 / Communication 15), and corrects several claims below (Saqshy's real lead is about 3 points, Utter's baseline is unfair, Verbatim and Stability headlines are not supported by their own results). Under that rubric we tie for 2nd behind Roshni.

## 1. What this is, and its limits
- **Basis:** public READMEs, results documents and code files reachable on `raw.githubusercontent.com`. I cannot clone, list folders, run rivals' code, see commit history or open live demos.
- **Code analysis limits:** "code reached" means files named in the README plus standard names. It is a lower bound. For BleedCheck, Handover and XRayNPC I reached almost no code, so those are unverified, not bad.
- **What the code scan did show:** for every rival where I could check, thresholds were set on validation or training data, not the test set, and the code is consistent with the README. I found no hard-coded metrics. Only our repo has a real automated suite plus CI; no rival I could reach showed more than one test file.
- **Rubric is my own inference**, from the shared write-up template and the "baseline, held-out, honest limits" language. Scores within about 5 points are noise.
- **Two rankings:** the rubric score (Section 3) and my **personal ranking** (Section 4), which also weighs effect size, human stakes and how memorable the story is. They differ, and the gap matters for us.

## 2. What changed in the last pass
- Re-fetch 3 changed only: **Stability** (#108, rewritten with a named story, 404k-example tests and AUC 0.90 on 113 unseen teens, raised to 90), **LanguageLink** (#255, template filled in, 93% vs 20% baseline, scored 55) and our own README. **swingcheck/Veritas-Challenge** (#210) now has no README.
- Deeper reading of the top rivals' results lowered my earlier view of our relative standing. My first-pass numbers came from README openings, which understate rivals. Their results sections show frozen tests, scored-once protocols, bootstrap intervals and larger effect sizes than I had credited.

## 3. Rubric scorecard: the top 25 (deep-read)
Components: problem and user /15 (P), technical substance /25 (T), evaluation honesty /25 (E), demo and deliverability /15 (D), write-up /10 (W), originality /10 (O).

| Rank | Repo | Track | P | T | E | D | W | O | Total | Code reached | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | TomasZitko/utter (#54) | Languages | 15 | 24 | 24 | 15 | 10 | 9 | 97 (A) | 4 files, ~690 lines, notebook saved outputs (11/25 cells), torch/transformers/Gradio. No tests or CI seen. | 84% vs 42% for Whisper on 7 real dysarthric speakers; threshold set on other people. Installable app and launch video. Only 7 speakers, and the code evidence is a single app plus one notebook. |
| 2 | brandonlign/verbatim (#51) | Languages | 13 | 24 | 25 | 15 | 9 | 9 | 95 (A) | ~350 lines reached (inference script, labeling server); scoring scripts not reached. Pinned requirements. | Mixed error rate 23.3% to 12.3% on 369 clips from speakers never seen; everything frozen and scored once, with blind-labelled flags. Discloses a pilot on 80 test clips. Repo shows the inference script but I could not reach the scoring code. |
| 3= | MACVXACE/roshni (#77) | Health | 14 | 24 | 25 | 14 | 9 | 8 | 94 (A) | ~515 lines (Gradio app, torch); the code applies the frozen cut-off. No tests seen. | AUC 0.978 on APTOS and 0.911 on an external hospital set, with a frozen cut-off and a pre-registered v2. Candidly reports sensitivity falling to 56.1% at the frozen cut-off abroad. Uses a standard public dataset and a pretrained backbone. |
| 3= | **samrramos1316-art/RioIQ-Drought-and-Canal-Planner** (#10) | Climate | 14 | 23 | 24 | 15 | 10 | 8 | 94 (A) | ~7,700 pipeline lines, 246 automated tests (200 pipeline + 46 app) plus JS and browser tests; CI on three operating systems; hash-gated frozen results. I ran the Python and JS tests and they passed. | Frozen, hash-checked tests with year-block bootstrap intervals, 246 automated tests and CI on three systems. The one clear win is 5.5% lower cost in 693 unseen western counties; most other tests tie and the East loses. The canal ranking failed its own validation. |
| 5= | Mr-CEO-cloud/the-day-after (#119) | Climate | 15 | 23 | 24 | 13 | 9 | 9 | 93 (A) | ~190 lines plus a notebook with saved outputs; 1 test file. | Macro F1 0.86 against 0.78 for the best rule and 0.42 for "always damaged", with a second governorate scored once. Sensitive, high-stakes topic validated against UN damage maps. Limited to one place and period. |
| 5= | JohnPoole3rd/veritas (#34) | Climate | 12 | 22 | 24 | 15 | 10 | 10 | 93 (A) | ~690 lines, 4 classes, 1 test file; baselines present in code. | 96% right-first on 4,050 unseen photos and a measured heat effect of -1.69 C per +0.1 greenness. Live demo, video and write-up; admits a tie with "always Residential" (64% vs 62%). Land-use classification trails a trained ResNet (81% vs 98%). |
| 7= | dede-bebe-lele/saqshy (#170) | Climate | 13 | 23 | 24 | 15 | 9 | 8 | 92 (A) | ~150-line notebook; bootstrap code present. Small code base. | Catches 69% of next-day fire squares inside the riskiest 10%, against 62% for last-week fires and 11% for classic indices, across three unseen seasons (1.09M square-days). Wins every test season. Narrow, but the effect is large and easy to explain. |
| 7= | davie2009kh/lsir (#159) | Languages | 13 | 23 | 24 | 15 | 9 | 8 | 92 (A) | ~2,545 lines across 8 numbered experiment scripts plus app: best experiment trail among rivals. | Armenian phone-line ASR at 15.2% word error against whisper-small above 100%. Reports a failed replication and a CI-checked gain over its base model (-0.6 to -1.3 points). About 2.5k lines of experiment scripts; the gain over the strong baseline is small. |
| 9 | jacob-gorny/rosafe (#29) | Climate | 12 | 22 | 25 | 15 | 9 | 8 | 91 (A) | ~2,240 lines, 128 functions, notebook with saved outputs; freeze logic and 1,000-redraw test in code. | Danger score for 855 DFW roads, frozen and run once on 2024; the weather model beats "every day is normal" by 4.3%, judged real by a 1,000-redraw test. The gain is modest, like ours, but the one-sentence story and iPhone app are cleaner. 2.2k lines of analysis code. |
| 10= | AmeyaChoudhary/VeritasAIHackathon (#108) | Health | 14 | 23 | 23 | 13 | 8 | 9 | 90 (A) | ~1,190 lines: 3 experiment scripts plus a TypeScript test for the ask model; generated result files. | Teen mental-health app with a named story; ask model finds a hard week 44% of the time vs 13% for a fixed schedule and AUC 0.90 on 113 unseen teens. Large experiment set with generated result files. Heavy privacy surface (17 data sources) and small final test group. |
| 10= | ZemBono/qalaisyn (#110) | Languages | 12 | 22 | 23 | 15 | 9 | 9 | 90 (A) | ~4,630 lines, 173 functions, 14 classes, 1 test file, bootstrap code. Largest rival code base reached. | Misspelled words fall from 47% to 3.5% on held-out text and 61% to 12% on 70 native-written messages, matching free ChatGPT at 12.9%. Browser extension, demo, video. Biggest code base I could reach (about 4.6k lines). |
| 12= | kabirshah4/race-blind-isnt-fair (#56) | Finance | 13 | 21 | 23 | 15 | 9 | 8 | 89 (A) | ~2,400 lines, 70 functions; bootstrap, seeds and pinned requirements. | On 264,340 real Georgia loan applications a race-blind model flags approved Black applicants 2.85-2.95x more often, stable over 5 retrains. About 2.4k lines with bootstrap and CI code. Strong story; the finding is an audit, not a new model. |
| 12= | aarishasifkhan/veritas-hackathon-2026 (#60) | Health | 14 | 22 | 23 | 15 | 9 | 6 | 89 (A) | No code files reachable; docs and experiment log only. Unverified. | Catches 90.9% of bleeds, 91.5% on a new source with 15.5% false alarms, and lists where it fails. Slices were split without patient IDs, so same-source scores are an upper bound, as it says. I could not reach the code. |
| 14= | Mika1904/sentinel (#13) | Health | 13 | 22 | 23 | 15 | 8 | 7 | 88 (A) | ~2,190-line notebook (43/121 cells with outputs), LightGBM, bootstrap code. | Within-drug R2 of 0.284 against 0.177 for the best simple baseline on 192 held-out cell lines. Live app, 2-minute video, 2.2k-line notebook with CI code. The effect is modest and lab-cell-line only. |
| 14= | julianjms-beep/aire-manana (#207) | Climate | 12 | 21 | 23 | 15 | 9 | 8 | 88 (A) | ~330-line notebook; thresholds chosen on validation (checked). | Beats "tomorrow = like today" at all 24 Madrid stations and removes its own 30-day drift (bias +8.2 to -0.2). Live bilingual site updated nightly, fairness check. Basic features. |
| 16 | curry06240624-dev/power-weather-taiwan (#227) | Climate | 11 | 22 | 23 | 15 | 9 | 7 | 87 (A) | ~475 lines, notebook with saved outputs. | Average miss 1.75% against 5.0% for "tomorrow = today", a two-thirds cut on 317 test days. Honest that a tree model did worse. Clear and strong result, but the user (grid planner) is generic and the model is plain ridge regression. |
| 17= | yoan-hristov/veritas-26-yh-submission (#137) | Health | 13 | 19 | 21 | 15 | 9 | 8 | 85 (A) | Only a 17-line package.json reachable; app code not found. Unverified. | Five chest-X-ray models where four are shown failing, plus a check that the model looks at the lungs. Live site, video, Colab. Memorable lessons, but I found no code or headline metrics from the repo itself. |
| 17= | fruutium/smokecheck (#188) | Climate | 11 | 20 | 23 | 15 | 9 | 7 | 85 (A) | ~920 lines, FastAPI, SHAP; thresholds set on training years (checked). | Average error 2.36 against 3.20 for NOAA's official forecast and 3.40 for persistence. Live page and 1:54 video. Cost advantage over NOAA at a plain cutoff is small (127 vs 123). |
| 19 | blueslick/Veritas-AI-Hackathon- (#30) | Health | 14 | 19 | 19 | 15 | 9 | 8 | 84 (B+) | No code files reachable. Unverified. | Merges three hospitals' records with a quote behind every fact and shows disagreements side by side. Live app and video, synthetic patients. Little quantified evaluation and I could not reach the code. |
| 20= | arturbaimuratov1-sys/senim (#109) | Languages | 12 | 20 | 21 | 14 | 8 | 8 | 83 (B+) | ~470 lines, torch; thresholds chosen on a calibration split (checked). | Kazakh translator that warns on serious errors (6 of 8 caught, baseline 0) with +2.6 chrF from best-of-8. Trust check rests on 45 sentences, all rated by the author. Demo video. |
| 20= | u7po00/bishkek-smog-alert (#100) | Climate | 11 | 20 | 22 | 13 | 9 | 8 | 83 (B+) | ~690 lines, 45 functions, season-by-season splits. | Forecast MAE 10.3 vs 12.9 for naive on 1,306 days across 4 seasons, using measured data. Tests an inversion hypothesis and gives trilingual alerts. Modest gain; demo is a Colab plus page. |
| 23= | BHSVeritasHackathon26/VeritasHackathon26 (#42) | Languages | 14 | 21 | 21 | 12 | 8 | 6 | 82 (B+) | ~880 lines (server and model adapter); training code not reached. | 13.7% phoneme error decoding attempted speech from neural data, with a demo server (about 880 lines). High-stakes ALS story. Standard challenge-style setup and no live demo link. |
| 42= | arshkudariya/Glacial-Lake-Watch-Veritas-Hackaton-Project---2026 (#45) | Climate | 11 | 21 | 22 | 8 | 9 | 7 | 78 (B+) | ~640 lines, 19 functions. | Honest negative result: its pixel model (F1 0.77-0.81) loses to the classic NDWI rule (0.855) on unseen lakes. About 640 lines of code. No demo. |
| 59= | nashwu0117/SolarCast-Lite (#70) | Climate | 11 | 19 | 18 | 13 | 7 | 6 | 74 (B) | ~1,220 lines across 8 notebooks, only 18/180 cells with saved outputs. | Map-based hourly solar forecast with an AI chat. Heavy 80+ baseline mentions and 8 notebooks, but running it needs Kaggle or Colab GPU steps and I found little evidence. |
| 67= | seanpategan/VeritasHackathon (#32) | Climate | 11 | 17 | 17 | 11 | 8 | 8 | 72 (B) | ~555 lines including a 94-line test file. | Satellite crop map with evidence-linked practices and an optional LLM audit; video and 555 lines found, including a tests file. Light measured evaluation and the live-demo link still reads "add Render URL". |

## 4. My personal final ranking (judgement, not arithmetic)
The rubric rewards rigor and completeness, where we are near the top. A judge also reacts to effect size, human stakes and a story that sticks, where we are weaker. Both views are shown.

| Mine | Repo | Rubric rank | Why it sits here |
|---|---|---|---|
| 1 | TomasZitko/utter (#54) | 1 | Large, tested effect (84% vs 42%) for people who cannot use their hands, with an app and video. Best mix of stakes, result and polish in the field. |
| 2 | MACVXACE/roshni (#77) | 3= | Strongest medical result (AUC 0.978; 0.911 on an external hospital set), pre-registered extension, and an honest account of where the cut-off failed abroad. |
| 3 | brandonlign/verbatim (#51) | 2 | A 47% cut in word errors on never-seen speakers, scored once, with blind labels and a disclosed pilot. Slightly lower stakes than the medical entries. |
| 4 | Mr-CEO-cloud/the-day-after (#119) | 5= | The most powerful story in Climate, validated against UN damage maps with a second governorate scored once. Clear baseline gaps (0.86 vs 0.78 vs 0.42). |
| 5 | dede-bebe-lele/saqshy (#170) | 7= | The cleanest Climate result: 69% of next-day fire squares inside the riskiest 10% against 11% for classic indices, winning every season. Narrower scope than ours but a far bigger effect. |
| 6 | davie2009kh/lsir (#159) | 7= | Very large gain over the common baseline and a deep experiment trail (about 2.5k lines of numbered scripts), with a failed replication reported. Gain over its own base model is small. |
| 7 | samrramos1316-art/RioIQ-Drought-and-Canal-Planner (#10) | 3= | Our rigor and engineering are top tier: frozen hash-checked results, 246 tests, CI on three systems, losses reported. The effect is the smallest among the top group (5.5% in the West, ties elsewhere), and the canal ranking is unvalidated. |
| 8 | AmeyaChoudhary/VeritasAIHackathon (#108) | 10= | A named teen story, big experiment set and a small unseen-teen test (113). Privacy risk from reading 17 data sources keeps it just under the top group. |
| 9 | JohnPoole3rd/veritas (#34) | 5= | The clearest user and the best-packaged Climate entry, with an honest tie reported. The effect and rigor are more modest than ours; its story is cleaner. |
| 10 | jacob-gorny/rosafe (#29) | 9 | A tight one-sentence story and an iPhone app with a frozen run-once test. The gain (+4.3%) is similar to ours but easier to grasp. |
| 11 | kabirshah4/race-blind-isnt-fair (#56) | 12= | A striking audit (2.9x) on 264k real applications with clear social stakes. An audit more than a new model. |
| 12 | ZemBono/qalaisyn (#110) | 10= | The largest code base I could reach and a result that matches free ChatGPT. Extension and demo are strong; novelty is moderate. |
| 13 | aarishasifkhan/veritas-hackathon-2026 (#60) | 12= | Strong medical-imaging result with clear failure analysis. Standard dataset and I could not verify code. |
| 14 | Mika1904/sentinel (#13) | 14= | Solid, honest drug-response ranking with app and video; modest effect. |
| 15 | curry06240624-dev/power-weather-taiwan (#227) | 16 | Excellent clear result (1.75% vs 5.0%) but a generic user and a plain model. |
| 16 | julianjms-beep/aire-manana (#207) | 14= | Live, nightly-updating, fairness-checked school tool; basic model. |
| 17 | yoan-hristov/veritas-26-yh-submission (#137) | 17= | Memorable 'four failed models' lesson with a live site, but few visible numbers or code. |
| 18 | fruutium/smokecheck (#188) | 17= | Beats NOAA's official forecast with a video, but the cost gain is small. |
| 19 | blueslick/Veritas-AI-Hackathon- (#30) | 19 | Strong medical-records idea, live app and video; little evaluation and no visible code. |
| 20 | arturbaimuratov1-sys/senim (#109) | 20= | Good idea and honesty, but the trust check rests on 45 sentences. |
| 21 | u7po00/bishkek-smog-alert (#100) | 20= | Solid local forecast; modest gain, Colab-style delivery. |
| 22 | BHSVeritasHackathon26/VeritasHackathon26 (#42) | 23= | Impressive neural-decoding number with a demo server; training code not reached. |
| 23 | arshkudariya/Glacial-Lake-Watch-Veritas-Hackaton-Project---2026 (#45) | 42= | Honest negative result (its model loses to the classic rule); no demo. |
| 24 | nashwu0117/SolarCast-Lite (#70) | 59= | Map and chat dashboard; hard to run and thin evidence. |
| 25 | seanpategan/VeritasHackathon (#32) | 67= | A broad idea with a video; light evaluation and a demo link that is still a placeholder. |

### Climate only
| Mine | Repo | Rubric score | Why |
|---|---|---|---|
| 1 | Mr-CEO-cloud/the-day-after (#119) | 93 | Most memorable Climate story with strong baselines and a second area scored once. |
| 2 | dede-bebe-lele/saqshy (#170) | 92 | Largest, cleanest effect: 69% of fire squares inside 10% of the map. |
| 3 | samrramos1316-art/RioIQ-Drought-and-Canal-Planner (#10) | 94 | Best rigor and engineering in Climate; effect is modest and the story is system-scale. |
| 4 | JohnPoole3rd/veritas (#34) | 93 | Clearest user and package; honest tie, but results are more modest. |
| 5 | jacob-gorny/rosafe (#29) | 91 | Simple story and app; gain similar to ours. |
| 6 | curry06240624-dev/power-weather-taiwan (#227) | 87 | Strong 1.75% vs 5.0% result, generic user. |
| 7 | julianjms-beep/aire-manana (#207) | 88 | Live and nightly, fairness-checked. |
| 8 | fruutium/smokecheck (#188) | 85 | Beats NOAA on error; small cost gain. |
| 9 | u7po00/bishkek-smog-alert (#100) | 83 | Solid but modest. |
| 10 | arshkudariya/Glacial-Lake-Watch-Veritas-Hackaton-Project---2026 (#45) | 78 | Honest loss to NDWI, no demo. |
| 11 | nashwu0117/SolarCast-Lite (#70) | 74 | Hard to run. |
| 12 | seanpategan/VeritasHackathon (#32) | 72 | Light evaluation. |

## 5. Where RioIQ really stands (final repo, code included)
**Strengths I verified**
- 200 pipeline tests and 46 app tests passed when I ran them, and the JS tests had 0 failures. Results are frozen and hash-gated, with year-block bootstrap intervals and pre-declared experiments.
- It is the largest and most engineered code base in the top 30: about 7,700 pipeline lines against 150 to 4,600 reachable lines for rivals, and the only one with CI that I could see.
- It is the only drought and canal entry, and it reports its own losses (East test, leak validation).

**Weaknesses that decide the ranking**
- **Effect size.** The one clear win is 5.5% lower cost in 693 unseen western counties (-1,372, interval -2,386 to -420). Most other rows tie, and the East loses by 8.6%. Compare Saqshy (69% vs 11% for classic indices), Utter (84% vs 42%), Verbatim (47% fewer errors) and Power Weather (1.75% vs 5.0%).
- **Canal ranking.** Rank agreement with measured canals is 0.25 with an interval from -0.23 to 0.63, so half the product is an illustration. The 810M gallons a day in the opening is an upper estimate that your own tests put at about double.
- **Equal rigor is not unique.** Rosafe, Verbatim, Roshni, Lsir and The Day After also freeze, score once and report intervals. Our honesty is top tier, not alone.
- **Stakes.** Farmers and water are real, but a patient or a war zone moves a judge more.

**Realistic odds (my judgement, wide error bars)**
- 1st in Climate: about 15 to 20%. The group ahead of us is The Day After and Saqshy, with Platonic Earth close.
- Top 3 in Climate: about 55%.
- 1st overall: about 4%. Top 5 overall: about 25%. Top 10 overall: about 65%.
- These are lower than my earlier numbers, and they should be. My earlier estimates leaned on rivals' README openings; their results sections and code show they are better than I had credited.

**What can still move us**
1. Make the 5.5% win the first line and show it as a picture beside "wait for severe drought" and "moderate drought now".
2. Say the ties and the East loss yourselves as part of the pitch, so they read as discipline.
3. Soften the 810M figure to "up to", with the "about half in our 16-canal check" next to it.
4. Lead with one district manager and one decision.

## 6. All scored entries (rubric score)
Ties share a rank (`=`). Deep-read entries are in Section 3; the rest are README-level. Reasons are at most three sentences.

| Rank | Score | Grade | Track | Repo | Why it ranks here |
|---|---|---|---|---|---|
| 1 | 97 | A | Languages | [TomasZitko/utter](https://github.com/TomasZitko/utter) (#54) | 84% vs 42% for Whisper on 7 real dysarthric speakers; threshold set on other people. Installable app and launch video. Only 7 speakers, and the code evidence is a single app plus one notebook. |
| 2 | 95 | A | Languages | [brandonlign/verbatim](https://github.com/brandonlign/verbatim) (#51) | Mixed error rate 23.3% to 12.3% on 369 clips from speakers never seen; everything frozen and scored once, with blind-labelled flags. Discloses a pilot on 80 test clips. Repo shows the inference script but I could not reach the scoring code. |
| 3= | 94 | A | Health | [MACVXACE/roshni](https://github.com/MACVXACE/roshni) (#77) | AUC 0.978 on APTOS and 0.911 on an external hospital set, with a frozen cut-off and a pre-registered v2. Candidly reports sensitivity falling to 56.1% at the frozen cut-off abroad. Uses a standard public dataset and a pretrained backbone. |
| **3=** | 94 | A | Climate | **[samrramos1316-art/RioIQ-Drought-and-Canal-Planner](https://github.com/samrramos1316-art/RioIQ-Drought-and-Canal-Planner) (#10)** | Frozen, hash-checked tests with year-block bootstrap intervals, 246 automated tests and CI on three systems. The one clear win is 5.5% lower cost in 693 unseen western counties; most other tests tie and the East loses. The canal ranking failed its own validation. |
| 5= | 93 | A | Climate | [Mr-CEO-cloud/the-day-after](https://github.com/Mr-CEO-cloud/the-day-after) (#119) | Macro F1 0.86 against 0.78 for the best rule and 0.42 for "always damaged", with a second governorate scored once. Sensitive, high-stakes topic validated against UN damage maps. Limited to one place and period. |
| 5= | 93 | A | Climate | [JohnPoole3rd/veritas](https://github.com/JohnPoole3rd/veritas) (#34) | 96% right-first on 4,050 unseen photos and a measured heat effect of -1.69 C per +0.1 greenness. Live demo, video and write-up; admits a tie with "always Residential" (64% vs 62%). Land-use classification trails a trained ResNet (81% vs 98%). |
| 7= | 92 | A | Climate | [dede-bebe-lele/saqshy](https://github.com/dede-bebe-lele/saqshy) (#170) | Catches 69% of next-day fire squares inside the riskiest 10%, against 62% for last-week fires and 11% for classic indices, across three unseen seasons (1.09M square-days). Wins every test season. Narrow, but the effect is large and easy to explain. |
| 7= | 92 | A | Languages | [davie2009kh/lsir](https://github.com/davie2009kh/lsir) (#159) | Armenian phone-line ASR at 15.2% word error against whisper-small above 100%. Reports a failed replication and a CI-checked gain over its base model (-0.6 to -1.3 points). About 2.5k lines of experiment scripts; the gain over the strong baseline is small. |
| 9 | 91 | A | Climate | [jacob-gorny/rosafe](https://github.com/jacob-gorny/rosafe) (#29) | Danger score for 855 DFW roads, frozen and run once on 2024; the weather model beats "every day is normal" by 4.3%, judged real by a 1,000-redraw test. The gain is modest, like ours, but the one-sentence story and iPhone app are cleaner. 2.2k lines of analysis code. |
| 10= | 90 | A | Health | [AmeyaChoudhary/VeritasAIHackathon](https://github.com/AmeyaChoudhary/VeritasAIHackathon) (#108) | Teen mental-health app with a named story; ask model finds a hard week 44% of the time vs 13% for a fixed schedule and AUC 0.90 on 113 unseen teens. Large experiment set with generated result files. Heavy privacy surface (17 data sources) and small final test group. |
| 10= | 90 | A | Languages | [ZemBono/qalaisyn](https://github.com/ZemBono/qalaisyn) (#110) | Misspelled words fall from 47% to 3.5% on held-out text and 61% to 12% on 70 native-written messages, matching free ChatGPT at 12.9%. Browser extension, demo, video. Biggest code base I could reach (about 4.6k lines). |
| 12= | 89 | A | Finance | [kabirshah4/race-blind-isnt-fair](https://github.com/kabirshah4/race-blind-isnt-fair) (#56) | On 264,340 real Georgia loan applications a race-blind model flags approved Black applicants 2.85-2.95x more often, stable over 5 retrains. About 2.4k lines with bootstrap and CI code. Strong story; the finding is an audit, not a new model. |
| 12= | 89 | A | Health | [aarishasifkhan/veritas-hackathon-2026](https://github.com/aarishasifkhan/veritas-hackathon-2026) (#60) | Catches 90.9% of bleeds, 91.5% on a new source with 15.5% false alarms, and lists where it fails. Slices were split without patient IDs, so same-source scores are an upper bound, as it says. I could not reach the code. |
| 14= | 88 | A | Health | [Mika1904/sentinel](https://github.com/Mika1904/sentinel) (#13) | Within-drug R2 of 0.284 against 0.177 for the best simple baseline on 192 held-out cell lines. Live app, 2-minute video, 2.2k-line notebook with CI code. The effect is modest and lab-cell-line only. |
| 14= | 88 | A | Climate | [julianjms-beep/aire-manana](https://github.com/julianjms-beep/aire-manana) (#207) | Beats "tomorrow = like today" at all 24 Madrid stations and removes its own 30-day drift (bias +8.2 to -0.2). Live bilingual site updated nightly, fairness check. Basic features. |
| 16 | 87 | A | Climate | [curry06240624-dev/power-weather-taiwan](https://github.com/curry06240624-dev/power-weather-taiwan) (#227) | Average miss 1.75% against 5.0% for "tomorrow = today", a two-thirds cut on 317 test days. Honest that a tree model did worse. Clear and strong result, but the user (grid planner) is generic and the model is plain ridge regression. |
| 17= | 85 | A | Health | [yoan-hristov/veritas-26-yh-submission](https://github.com/yoan-hristov/veritas-26-yh-submission) (#137) | Five chest-X-ray models where four are shown failing, plus a check that the model looks at the lungs. Live site, video, Colab. Memorable lessons, but I found no code or headline metrics from the repo itself. |
| 17= | 85 | A | Climate | [fruutium/smokecheck](https://github.com/fruutium/smokecheck) (#188) | Average error 2.36 against 3.20 for NOAA's official forecast and 3.40 for persistence. Live page and 1:54 video. Cost advantage over NOAA at a plain cutoff is small (127 vs 123). |
| 19 | 84 | B+ | Health | [blueslick/Veritas-AI-Hackathon-](https://github.com/blueslick/Veritas-AI-Hackathon-) (#30) | Merges three hospitals' records with a quote behind every fact and shows disagreements side by side. Live app and video, synthetic patients. Little quantified evaluation and I could not reach the code. |
| 20= | 83 | B+ | Languages | [arturbaimuratov1-sys/senim](https://github.com/arturbaimuratov1-sys/senim) (#109) | Kazakh translator that warns on serious errors (6 of 8 caught, baseline 0) with +2.6 chrF from best-of-8. Trust check rests on 45 sentences, all rated by the author. Demo video. |
| 20= | 83 | B+ | Climate | [u7po00/bishkek-smog-alert](https://github.com/u7po00/bishkek-smog-alert) (#100) | Forecast MAE 10.3 vs 12.9 for naive on 1,306 days across 4 seasons, using measured data. Tests an inversion hypothesis and gives trilingual alerts. Modest gain; demo is a Colab plus page. |
| 20= | 83 | B+ | Languages | [proelium27/veritas-ai-hackathon](https://github.com/proelium27/veritas-ai-hackathon) (#20) | Now titled Blok 70 (Mandarin to Serbian with the speaker's gender and politeness) with a 2-minute video added. Colab runs in 1.5 minutes. Good originality; limited to one language pair. |
| 23= | 82 | B+ | Languages | [BHSVeritasHackathon26/VeritasHackathon26](https://github.com/BHSVeritasHackathon26/VeritasHackathon26) (#42) | 13.7% phoneme error decoding attempted speech from neural data, with a demo server (about 880 lines). High-stakes ALS story. Standard challenge-style setup and no live demo link. |
| 23= | 82 | B+ | Health | [mofe-stack/say-so](https://github.com/mofe-stack/say-so) (#14) | Confidence-gated dysarthric word recognition; demo site + notebook. Held back by: no demo video link seen. |
| 23= | 82 | B+ | Languages | [armaan-khoja/clear-voice](https://github.com/armaan-khoja/clear-voice) (#17) | Dysarthria recognition on TORGO with heavy metrics and now a demo video and paper. Data is licensed for non-commercial use. Strong evidence; no live app beyond the demo page. |
| 23= | 82 | B+ | Languages | [dicsio100-dev/who-pays-for-the-correction](https://github.com/dicsio100-dev/who-pays-for-the-correction) (#135) | ASR fairness audit; African-accented callers asked to repeat more; interactive page. Held back by: no demo video link seen. |
| 23= | 82 | B+ | Languages | [curry06240624-dev/mother-tongue-detector](https://github.com/curry06240624-dev/mother-tongue-detector) (#244) | Hakka/Hokkien/Mandarin detector; beats langdetect; demo. Held back by: no demo video link seen. |
| 28 | 81 | B+ | Health | [godtier812/veritashackathon](https://github.com/godtier812/veritashackathon) (#9) | BRCA1 variant model with an honest 94.4% catch rate and the 437 of 899 harmless variants flagged. The README no longer has a 'what we'd do next' section. Team name left blank. |
| 29= | 80 | B+ | Health | [Riyadua777/pneumotype](https://github.com/Riyadua777/pneumotype) (#2) | Pneumonia CNN trained from scratch, with a refer option and federated learning. Now credited to one named student. The headline 97% is a recall-style number and there is no live demo. |
| 29= | 80 | B+ | Finance | [adeviwon/hypecheck](https://github.com/adeviwon/hypecheck) (#6) | Memecoin sentiment, in-browser model, honest held-out scores. Held back by: no demo video link seen. |
| 29= | 80 | B+ | Health | [Jarvis21stCentury/DiabetesCheck](https://github.com/Jarvis21stCentury/DiabetesCheck) (#15) | 8-question diabetes screen; 50,736-adult test set; live site; limitations. Held back by: no demo video link seen. |
| 29= | 80 | B+ | Health | [mirmoosa1014-rgb/VitalSign](https://github.com/mirmoosa1014-rgb/VitalSign) (#28) | ER sign-to-speech intake; signer cross-validation; no live demo. Held back by: no demo video link seen. |
| 29= | 80 | B+ | Health | [rohanhariharan/dose](https://github.com/rohanhariharan/dose) (#35) | Medication label reader, local-first, demo video, tests; light on ML eval. Held back by: few measured results shown. |
| 29= | 80 | B+ | Health | [CartHadash/Veritas-AI-mouse-tracker](https://github.com/CartHadash/Veritas-AI-mouse-tracker) (#44) | Parkinson tremor detect+correct models; many metrics; no demo. Held back by: no demo video link seen. |
| 29= | 80 | B+ | Health | [ahblxz/NEXTQUESTION-Veritas-2026](https://github.com/ahblxz/NEXTQUESTION-Veritas-2026) (#73) | Adaptive diagnostic questioning; synthetic and real pilots kept separate. Held back by: no live demo link in the README; no demo video link seen. |
| 29= | 80 | B+ | Finance | [sushixodev/following-dirty-money](https://github.com/sushixodev/following-dirty-money) (#111) | Bitcoin AML GNN + drift detection; notebook + app. Held back by: no demo video link seen. |
| 29= | 80 | B+ | Finance | [rehim2009book-ui/fairloan](https://github.com/rehim2009book-ui/fairloan) (#117) | Hidden age-bias in loans; video, notebook; fairness angle. Held back by: no live demo link in the README. |
| 29= | 80 | B+ | Health | [Ruby570bocadito/Tinta-Veritas-AI-Hackaton](https://github.com/Ruby570bocadito/Tinta-Veritas-AI-Hackaton) (#148) | Alzheimer early-signal phone tool, offline, EN/ES; demo. Held back by: no demo video link seen. |
| 29= | 80 | B+ | Finance | [seeuny2022-commits/finflag](https://github.com/seeuny2022-commits/finflag) (#152) | Finance-video red flags; 50 held-out videos, baselines, admits keyword rule won. Held back by: no live demo link in the README. |
| 29= | 80 | B+ | Finance | [aserhamadaweb-cpu/Khalli-Balak](https://github.com/aserhamadaweb-cpu/Khalli-Balak) (#176) | Egyptian Arabic scam text detector, now reframed as 'what it asks you to do' with a live website. Real transfer test from English data. Reframing mid-event shows iteration; the claims need rechecking. |
| 41 | 79 | B+ | Health | [SycthePlays/SigapBumil](https://github.com/SycthePlays/SigapBumil) (#134) | Maternal risk triage in Indonesia with live demo and now a video link. Admits labels are risk levels, not outcomes, and the data is from Bangladesh. Honest, with a real data-transfer limit. |
| 42= | 78 | B+ | Climate | [arshkudariya/Glacial-Lake-Watch-Veritas-Hackaton-Project---2026](https://github.com/arshkudariya/Glacial-Lake-Watch-Veritas-Hackaton-Project---2026) (#45) | Honest negative result: its pixel model (F1 0.77-0.81) loses to the classic NDWI rule (0.855) on unseen lakes. About 640 lines of code. No demo. |
| 42= | 78 | B+ | Languages | [bejenaru1/zbor-lav](https://github.com/bejenaru1/zbor-lav) (#16) | Aromanian/Romani helpers for Romanian readers; live site; low-resource. Held back by: no demo video link seen; few measured results shown. |
| 42= | 78 | B+ | Health | [Mebay821/health-hackathon-project](https://github.com/Mebay821/health-hackathon-project) (#65) | Ethiopia HEW glucose-test triage; 4 routine inputs; metrics. Held back by: no live demo link in the README; no demo video link seen. |
| 42= | 78 | B+ | Languages | [resurgances/accent-gap](https://github.com/resurgances/accent-gap) (#78) | Sindhi-accented ASR gap; video; every number traced to a file. Held back by: no live demo link in the README. |
| 42= | 78 | B+ | Finance | [mavrinlabs-prog/MarkupCheck](https://github.com/mavrinlabs-prog/MarkupCheck) (#79) | Auto-loan markup check; stress-tested verdict; no demo. Held back by: no demo video link seen. |
| 42= | 78 | B+ | Finance | [C-Nietzschmann/veritas-hackathon](https://github.com/C-Nietzschmann/veritas-hackathon) (#86) | Insolvent-director matcher on Companies House; scored matches. Held back by: placeholder text is still in the write-up; no live demo link in the README. |
| 48= | 76 | B | Climate | [TaranAzrot-13/air-quality-forecast-milan](https://github.com/TaranAzrot-13/air-quality-forecast-milan) (#39) | Milan next-day PM2.5; video; baseline results; modest depth. Held back by: no live demo link in the README. |
| 48= | 76 | B | Health | [Cxsmxnaut/heart-echo](https://github.com/Cxsmxnaut/heart-echo) (#93) | Heart-sound iPhone app v0.4.1; strong engineering, thin measurement. Held back by: no demo video link seen; few measured results shown. |
| 48= | 76 | B | Languages | [idotpixel/Whisperwatch](https://github.com/idotpixel/Whisperwatch) (#105) | Which captions to review first; trained error estimator; interface. Held back by: no demo video link seen; few measured results shown. |
| 48= | 76 | B | Climate | [Brandozerd/veritas-climate-hackathon](https://github.com/Brandozerd/veritas-climate-hackathon) (#112) | Recess planner; honestly reports ML did not beat rules. Held back by: no live demo link in the README; no demo video link seen. |
| 48= | 76 | B | Finance | [SabaSad/veritas-ai-hackathon](https://github.com/SabaSad/veritas-ai-hackathon) (#122) | Is a strategy luck? Sim-trained model; video; Gradio demo lives only while notebook runs. Nothing is missing from the README, so it ranks on strength of evidence. |
| 48= | 76 | B | Finance | [srixtan95/veritas-ai-hackathon](https://github.com/srixtan95/veritas-ai-hackathon) (#141) | Fairness-aware credit; Streamlit app. Held back by: no demo video link seen. |
| 48= | 76 | B | Climate | [BMWareSPEEDY/UrbanFlow](https://github.com/BMWareSPEEDY/UrbanFlow) (#161) | Bengaluru flood dispatch vs EPA SWMM; personal email in README. Held back by: no live demo link in the README; no demo video link seen. |
| 48= | 76 | B | Climate | [wpersonxdd/havocast](https://github.com/wpersonxdd/havocast) (#219) | Tashkent PM2.5 for PE classes; honest CAMS caveat. Held back by: no live demo link in the README; no demo video link seen. |
| 56= | 75 | B | (other) | [StanleyChanH/VoiceVeritas](https://github.com/StanleyChanH/VoiceVeritas) (#5) | Polished open-source read-speech detector; reads as independent project, not a labelled entry. Held back by: no live demo link in the README; no demo video link seen. |
| 56= | 75 | B | Languages | [maini-m/BSL-Translator2](https://github.com/maini-m/BSL-Translator2) (#123) | BSL fingerspelling in browser; webcam demo. Held back by: placeholder text is still in the write-up; no demo video link seen. |
| 56= | 75 | B | Languages | [zenreye991/sign-to-speech](https://github.com/zenreye991/sign-to-speech) (#168) | Two-way sign/speech bridge; video; unseen-signer test. Held back by: no live demo link in the README. |
| 59= | 74 | B | Climate | [nashwu0117/SolarCast-Lite](https://github.com/nashwu0117/SolarCast-Lite) (#70) | Map-based hourly solar forecast with an AI chat. Heavy 80+ baseline mentions and 8 notebooks, but running it needs Kaggle or Colab GPU steps and I found little evidence. |
| 59= | 74 | B | Health | [chillstudio-dev/Noticioner-AI](https://github.com/chillstudio-dev/Noticioner-AI) (#37) | Clinician SOAP drafting with trust checks; synthetic only, no clinical validation. Held back by: no live demo link in the README; no demo video link seen. |
| 59= | 74 | B | Finance | [dxianto8/dx-hackathon-veritas](https://github.com/dxianto8/dx-hackathon-veritas) (#55) | Multilingual scam-text checker as phone app; team name left as placeholder. Held back by: placeholder text is still in the write-up; no demo video link seen. |
| 59= | 74 | B | Finance | [mangoesqwerty39/babushka-shield](https://github.com/mangoesqwerty39/babushka-shield) (#120) | Russian-speaker scam filter; tests an English 2012 baseline. Held back by: no live demo link in the README; no demo video link seen. |
| 59= | 74 | B | Finance | [Adik-Kek/kaz-budget](https://github.com/Adik-Kek/kaz-budget) (#121) | Family budget app, 3 ML parts, video; synthetic data; personal email in README. Nothing is missing from the README, so it ranks on strength of evidence. |
| 59= | 74 | B | Finance | [vayungodara/onder-nul](https://github.com/vayungodara/onder-nul) (#124) | Negative Dutch power price warning; demo not hosted. Held back by: no demo video link seen. |
| 59= | 74 | B | Finance | [Acookiefor2/scam-check-for-parents](https://github.com/Acookiefor2/scam-check-for-parents) (#130) | Scam SMS for Indian parents; EN/HI/MR/Hinglish. Held back by: no live demo link in the README; no demo video link seen. |
| 59= | 74 | B | Climate | [ParthPatel125/aircast](https://github.com/ParthPatel125/aircast) (#182) | Chicago smoke practice call; metrics; no demo. Held back by: no demo video link seen. |
| 67= | 72 | B | Climate | [seanpategan/VeritasHackathon](https://github.com/seanpategan/VeritasHackathon) (#32) | Satellite crop map with evidence-linked practices and an optional LLM audit; video and 555 lines found, including a tests file. Light measured evaluation and the live-demo link still reads "add Render URL". |
| 67= | 72 | B | Climate | [Santosh-Krishna-Reddy/Veritas-AI-Project](https://github.com/Santosh-Krishna-Reddy/Veritas-AI-Project) (#18) | PJM carbon-intensity forecast + Next.js dashboard; no demo link. Held back by: no demo video link seen. |
| 67= | 72 | B | Finance | [jagejagejage/veritas-ai-hackathon](https://github.com/jagejagejage/veritas-ai-hackathon) (#19) | CashSense live demo; judges must use a non-default branch; little eval. Held back by: no demo video link seen; few measured results shown. |
| 67= | 72 | B | Health | [ethanplayer1211-spec/Handsay](https://github.com/ethanplayer1211-spec/Handsay) (#23) | Webcam ASL caption tool on an existing credited model. Held back by: no live demo link in the README; no demo video link seen. |
| 67= | 72 | B | Finance | [scuzziexz/send-home-safely](https://github.com/scuzziexz/send-home-safely) (#43) | Remittance true-cost tool; results present; no demo. Held back by: no demo video link seen. |
| 67= | 72 | B | Climate | [WamblyLA/VeritasAIHackathon](https://github.com/WamblyLA/VeritasAIHackathon) (#82) | PM2.5 gap reconstruction + maintenance ranking; no demo/video seen. Nothing is missing from the README, so it ranks on strength of evidence. |
| 67= | 72 | B | Climate | [fr3ddykru3g3r/aircast-jaipur](https://github.com/fr3ddykru3g3r/aircast-jaipur) (#113) | Jaipur next-day air; live prototype; frozen models. Held back by: no demo video link seen. |
| 67= | 72 | B | Languages | [SZH2008/METranslate](https://github.com/SZH2008/METranslate) (#116) | Translator trust test AR/UR; video; modest depth. Held back by: no live demo link in the README. |
| 67= | 72 | B | Climate | [hansonliu20110617-lang/solarplan-hackathon](https://github.com/hansonliu20110617-lang/solarplan-hackathon) (#187) | Solar forecast + $ impact; 3 cities core, split study. Held back by: no live demo link in the README; no demo video link seen. |
| 67= | 72 | B | Languages | [Harshal623/doseguard](https://github.com/Harshal623/doseguard) (#201) | Dosage translator self-check; names still placeholder. Held back by: placeholder text is still in the write-up; no live demo link in the README. |
| 67= | 72 | B | Finance | [ionnixf/Veritas](https://github.com/ionnixf/Veritas) (#218) | AuditLens AI ranks merchant transactions with a frozen XGBoost model; Docker, write-up and verification record. Offline demo; the README changed from the earlier ReserveWeek idea. Solid engineering, modest evidence of impact. |
| 78= | 70 | B | Finance | [Hm2shifty/VeritasAIstockpredictor](https://github.com/Hm2shifty/VeritasAIstockpredictor) (#26) | Live demo, named team, baselines (52%, 54%) and about 65% accuracy on 50 NVIDIA predictions, which it admits is small. Four LLM analysts debate each stock, which is flashy but unverified. The sample is too small to support the headline. |
| 78= | 70 | B | Climate | [DenisLazerko/vibesgpt](https://github.com/DenisLazerko/vibesgpt) (#71) | PNW smoke forecast; notebook only. Held back by: no live demo link in the README; no demo video link seen. |
| 78= | 70 | B | Climate | [emircolponbekov-create/Veritas-AI-Hack](https://github.com/emircolponbekov-create/Veritas-AI-Hack) (#92) | Nuclear cooling-water explorer; broad, light eval. Held back by: no live demo link in the README; no demo video link seen. |
| 78= | 70 | B | Finance | [t2101722-maker/markettwin-ai](https://github.com/t2101722-maker/markettwin-ai) (#133) | Portfolio co-movement for beginners; live demo. Held back by: no demo video link seen. |
| 78= | 70 | B | Languages | [TomasZitko/slysim-te](https://github.com/TomasZitko/slysim-te) (#175) | Same project as #54 (Utter) - duplicate repo of same team. Held back by: no live demo link in the README; no demo video link seen. |
| 83= | 68 | C | Health | [shyaam-perumal/PneumoAI](https://github.com/shyaam-perumal/PneumoAI) (#76) | Chest X-ray classifier with login; educational. Held back by: no live demo link in the README; no demo video link seen. |
| 83= | 68 | C | Languages | [tentaciaa/veritas-language-identification](https://github.com/tentaciaa/veritas-language-identification) (#103) | 5-language ID for short messages; CLI. Held back by: no live demo link in the README; no demo video link seen. |
| 83= | 68 | C | Health | [agzama-sketch/cardio-lens](https://github.com/agzama-sketch/cardio-lens) (#142) | Heart-disease explainable demo; classic dataset. Held back by: no demo video link seen. |
| 86= | 66 | C | Health | [kalpesh99/veritas-ai-hackathon-2026](https://github.com/kalpesh99/veritas-ai-hackathon-2026) (#21) | 24-topic search tool; navigation more than ML; catalog sprawl. Held back by: no demo video link seen. |
| 86= | 66 | C | Finance | [juancruz85/48-to-none-backend](https://github.com/juancruz85/48-to-none-backend) (#25) | Finance fraud tool with AWS login, backend and frontend repos, and a write-up. Evaluated on only 31 held-out accounts, 30 of them fraud. Setup is heavy and the test is too small to trust. |
| 86= | 66 | C | Climate | [umerasif67/AirWave_Islamabad](https://github.com/umerasif67/AirWave_Islamabad) (#132) | Islamabad PM2.5 viewer; admits seasonal-feature limit. Held back by: no demo video link seen. |
| 86= | 66 | C | Finance | [extraolive7737/VTAI-Hackathon.team.Extraolive](https://github.com/extraolive7737/VTAI-Hackathon.team.Extraolive) (#164) | Headline sentiment vs market; notebook. Held back by: no live demo link in the README; no demo video link seen. |
| 86= | 66 | C | Languages | [juniorvuong8/Veritas-AI-Hackathon](https://github.com/juniorvuong8/Veritas-AI-Hackathon) (#203) | Vocabulary city game, Lovable; light eval. Held back by: no demo video link seen. |
| 86= | 66 | C | Climate | [ImamaAhmad/HeatSafe-Lahore](https://github.com/ImamaAhmad/HeatSafe-Lahore) (#237) | Lahore heat-risk; metrics, no demo. Held back by: no demo video link seen. |
| 92 | 65 | C | Health | [tpspingol-lab/IGNITE](https://github.com/tpspingol-lab/IGNITE) (#149) | IGNITE habit/nutrition app; benchmark text; unclear track. Held back by: no demo video link seen; few measured results shown. |
| 93= | 64 | C | Languages | [thorfinn071/TilSwitch-AI-Veritas](https://github.com/thorfinn071/TilSwitch-AI-Veritas) (#115) | Kazakh-Russian-English span marker; short. Held back by: no live demo link in the README; no demo video link seen. |
| 93= | 64 | C | Climate | [yars0634-arc/windward](https://github.com/yars0634-arc/windward) (#178) | Wind forecast turned into game; creative, thin eval. Held back by: no demo video link seen; few measured results shown. |
| 95= | 62 | C | Climate | [k-e-v-i-n-t-a-o/Veritas_AI_Hackathon_2026](https://github.com/k-e-v-i-n-t-a-o/Veritas_AI_Hackathon_2026) (#41) | Air Ahead; informal, light. Held back by: no live demo link in the README; no demo video link seen. |
| 95= | 62 | C | Health | [bhargavkulkarni01/Veritas_AI_Dyslexia_App](https://github.com/bhargavkulkarni01/Veritas_AI_Dyslexia_App) (#72) | Dyslexia reading game; no eval. Held back by: no demo video link seen; few measured results shown. |
| 95= | 62 | C | Finance | [sidsriv09/Sentrimix](https://github.com/sidsriv09/Sentrimix) (#80) | FinBERT headlines vs stocks; basic. Held back by: no live demo link in the README; no demo video link seen. |
| 95= | 62 | C | Health | [shiva-dev-229/Veritas-Hackathon](https://github.com/shiva-dev-229/Veritas-Hackathon) (#136) | Parkinson's typing screen with video and an honest results table. AUC is 0.571 and 85% of healthy people are flagged, so the model barely works. Honesty is good, but the product is not usable. |
| 95= | 62 | C | Finance | [ThomasTheGodSmith/veritas-council](https://github.com/ThomasTheGodSmith/veritas-council) (#165) | Council of from-scratch models; Claude writes report. Held back by: no live demo link in the README; no demo video link seen. |
| 95= | 62 | C | Finance | [bobo322322/veritas-antifraud-hackathon](https://github.com/bobo322322/veritas-antifraud-hackathon) (#171) | Cost-sensitive fraud threshold; standard approach. Held back by: no demo video link seen. |
| 95= | 62 | C | Health | [namitbattancoc-design/veritas-AI-hackathon-project](https://github.com/namitbattancoc-design/veritas-AI-hackathon-project) (#220) | Lab-report explainer; mostly concept. Held back by: no live demo link in the README; no demo video link seen. |
| 95= | 62 | C | Health | [erjanowitz-code/veritas-heart-risk-mvp](https://github.com/erjanowitz-code/veritas-heart-risk-mvp) (#242) | Heart-risk on 303 patients from 1988; team name placeholder. Held back by: placeholder text is still in the write-up; no live demo link in the README. |
| 103 | 60 | C | Finance | [juancruz85/48-to-none-frontend](https://github.com/juancruz85/48-to-none-frontend) (#31) | Frontend repo for the 48toNone fraud entry (see #25). Sign-in, uploads and a report. Scored with its backend; no evaluation of its own. |
| 104= | 58 | D | Health | [rong-jason-0908/jasonrong_veritas_ai_hackathon](https://github.com/rong-jason-0908/jasonrong_veritas_ai_hackathon) (#63) | Proofpoint checks health claims against PubMed with an evaluator. Needs a 1.7 GB model download and the README itself says the video link is wonky. Idea is good but hard to try. |
| 104= | 58 | D | Health | [not-nag/veritas-data-engg](https://github.com/not-nag/veritas-data-engg) (#98) | Medical-report standardiser pipeline; solid engineering; unclear fit. Held back by: no live demo link in the README; no demo video link seen. |
| 104= | 58 | D | Finance | [matheason/news-vs-dow](https://github.com/matheason/news-vs-dow) (#200) | News vs Dow; data not in repo. Held back by: no live demo link in the README; no demo video link seen. |
| 104= | 58 | D | Climate | [WardenOfTheCove/VanSolar](https://github.com/WardenOfTheCove/VanSolar) (#204) | Vancouver solar forecast with a simple linear regression trained on 1990-2010 and tested 2010-2026. Clean split, but the model is basic and results are not shown. Thin for a competition. |
| 108= | 55 | D | Health | [AmenShirega/Onedoor--Veritas-AI-hackathon](https://github.com/AmenShirega/Onedoor--Veritas-AI-hackathon) (#94) | OneDoor survivor support web platform; no ML evidence; duplicate of 102. Held back by: no live demo link in the README; no demo video link seen. |
| 108= | 55 | D | Languages | [Syed487/Veritas-AI-Hackathon](https://github.com/Syed487/Veritas-AI-Hackathon) (#255) | LanguageLink: 5-language ID on Tatoeba with TF-IDF + logistic regression, 93.13% vs 20% majority baseline. Simple and honest about Malay/Indonesian confusion. No demo or video seen. |
| 110= | 50 | D | Health | [ElijahBurkeDev/Oasis](https://github.com/ElijahBurkeDev/Oasis) (#61) | LLM mood harness; light results. Held back by: no live demo link in the README; no demo video link seen. |
| 110= | 50 | D | Health | [erjanowitz-code/veritas-health-hackathon](https://github.com/erjanowitz-code/veritas-health-hackathon) (#258) | Short README, heart/health; little visible. Held back by: no live demo link in the README; no demo video link seen. |
| 112= | 45 | D | Climate | [wavedance1969-arch/VeritasAtmo](https://github.com/wavedance1969-arch/VeritasAtmo) (#66) | Provisional, no README: German weather and biometeorology dashboard with a CLI and HTML page. No evidence of ML evaluation. Scored from file contents only. |
| 112= | 45 | D | Finance | [nnautomator-debug/Veritas-AI-Hackathon-Project-Backend](https://github.com/nnautomator-debug/Veritas-AI-Hackathon-Project-Backend) (#193) | Provisional, no README: Primetime price-comparison app across Indian shops with Gemini. Fit with the hackathon and any evaluation are unknown. Scored from file contents only. |
| 112= | 45 | D | ? | [amrutasahu2006/VeritasAI-GenAI](https://github.com/amrutasahu2006/VeritasAI-GenAI) (#214) | Provisional, no README: Streamlit hallucination detector with NLI and RAG. Unclear which hackathon. Scored from file contents only. |
| 115 | 42 | D | Finance | [annatalia-w/ThamaniKE](https://github.com/annatalia-w/ThamaniKE) (#107) | Provisional, no README: Kenyan salary and purchasing-power tracker website. No evidence of ML evaluation. Scored from file contents only. |
| 116= | 40 | D | Languages | [KnXper7/veritas-ai-hackathon](https://github.com/KnXper7/veritas-ai-hackathon) (#7) | Mixed Signals: draft, every TODO still open. Held back by: placeholder text is still in the write-up; no live demo link in the README. |
| 116= | 40 | D | Health | [nebyoujantirar-glitch/Onedoor--Veritas-AI-hackathon-main](https://github.com/nebyoujantirar-glitch/Onedoor--Veritas-AI-hackathon-main) (#102) | Copy of #94. Held back by: no live demo link in the README; no demo video link seen. |
| 116= | 40 | D | Finance | [umar20-web/scamshield-ai-hackathon](https://github.com/umar20-web/scamshield-ai-hackathon) (#183) | Short README (ScamShield). Held back by: no live demo link in the README; no demo video link seen. |
| 119= | 35 | F | Health | [Kmjndv/Respira-Veritas-AI-Hackathon-](https://github.com/Kmjndv/Respira-Veritas-AI-Hackathon-) (#1) | Concept README for a respiratory-prediction app. No data, results or demo shown. |
| 119= | 35 | F | ? | [uchijimatheloml-dev/VERITAS](https://github.com/uchijimatheloml-dev/VERITAS) (#8) | Provisional, no README: a browser game titled Core Keepers. Fit and evaluation unknown. Scored from file contents only. |
| 119= | 35 | F | ? | [mahashri142010/MeaningGuard-VeritasAI-2026](https://github.com/mahashri142010/MeaningGuard-VeritasAI-2026) (#129) | Stub README. Held back by: no live demo link in the README; no demo video link seen. |
| 122= | 30 | F | ? | [andy101bk/Veritas-AI-Hackathon](https://github.com/andy101bk/Veritas-AI-Hackathon) (#118) | Stub README. Held back by: no live demo link in the README; no demo video link seen. |
| 122= | 30 | F | ? | [ArNam8/NoShow](https://github.com/ArNam8/NoShow) (#138) | Stub README (NoShow). Held back by: no live demo link in the README; no demo video link seen. |
| 122= | 30 | F | Health | [anBardo/Veritas-Hackathon-afm-outbreak-risk-model](https://github.com/anBardo/Veritas-Hackathon-afm-outbreak-risk-model) (#139) | Stub README (AFM outbreak model). Held back by: no live demo link in the README; no demo video link seen. |

## Not scored
Not hackathon entries, duplicates, empty, or too little to grade.

| # | Repo | Reason |
|---|---|---|
| 3 | [godfathershit018326/veritas](https://github.com/godfathershit018326/veritas) | Other project |
| 4 | [oleglegkunets/Veritas-AI-Competition-2026](https://github.com/oleglegkunets/Veritas-AI-Competition-2026) | No README retrievable (private, empty, or no readme) |
| 11 | [ferreirajacicley7-cpu/tartarium-ai-core](https://github.com/ferreirajacicley7-cpu/tartarium-ai-core) | Other project: Portuguese textual AI box |
| 12 | [nagarjunak-pixel/veritas-rl](https://github.com/nagarjunak-pixel/veritas-rl) | Other: RL post-training reference impl (strong engineering, not an entry) |
| 22 | [garciaraymond689-boop/DeepBet](https://github.com/garciaraymond689-boop/DeepBet) | Other event: Hawaii Innovation Challenge |
| 24 | [NQV4X0QN/VeritasUI](https://github.com/NQV4X0QN/VeritasUI) | Other: WoW addon |
| 27 | [ChipmunkRPA/veritas](https://github.com/ChipmunkRPA/veritas) | Other: commercial image-forensics product |
| 33 | [mav40121/veritas-lab-services](https://github.com/mav40121/veritas-lab-services) | No README retrievable (private, empty, or no readme) |
| 36 | [depr3y/veritasbaseballindex](https://github.com/depr3y/veritasbaseballindex) | No README retrievable (private, empty, or no readme) |
| 38 | [NOCTE-oss/veritas-biblioteca](https://github.com/NOCTE-oss/veritas-biblioteca) | Course project: Vue bookstore |
| 40 | [auctacius/utkarshpearl](https://github.com/auctacius/utkarshpearl) | No README retrievable (private, empty, or no readme) |
| 46 | [IceVeritas/GigaVeritas-Digital-Evidence-Framework](https://github.com/IceVeritas/GigaVeritas-Digital-Evidence-Framework) | Not an entry: evidence toolkit |
| 47 | [IceVeritas/IceVeritas-Data-TIR-FR](https://github.com/IceVeritas/IceVeritas-Data-TIR-FR) | Not an entry: OSINT HGV research |
| 48 | [seanieM3132/veritas-status](https://github.com/seanieM3132/veritas-status) | No README retrievable (private, empty, or no readme) |
| 49 | [nicolehysi8/Veritas](https://github.com/nicolehysi8/Veritas) | No README retrievable (private, empty, or no readme) |
| 50 | [Anish-Dharurkar/Veritas-AI---Portfolio-Management](https://github.com/Anish-Dharurkar/Veritas-AI---Portfolio-Management) | No README retrievable (private, empty, or no readme) |
| 52 | [adriaansaeez/veritas-live](https://github.com/adriaansaeez/veritas-live) | Other: debate fact-checker, no hackathon label |
| 53 | [paladin120702/desafio-fullstack-veritas](https://github.com/paladin120702/desafio-fullstack-veritas) | Course challenge: Go kanban |
| 57 | [veritasquaesitorcai/veritas-quaesitor](https://github.com/veritasquaesitorcai/veritas-quaesitor) | Stub README (22 chars), nothing to grade |
| 58 | [TASRUNNER2010/Hackathon](https://github.com/TASRUNNER2010/Hackathon) | No README retrievable (private, empty, or no readme) |
| 59 | [AIGsniperYt/veritas_ai_hackathon](https://github.com/AIGsniperYt/veritas_ai_hackathon) | No README retrievable (private, empty, or no readme) |
| 62 | [hzeng101118/veritasai](https://github.com/hzeng101118/veritasai) | Stub README (11 chars), nothing to grade |
| 64 | [smoeberg/EiraOS](https://github.com/smoeberg/EiraOS) | Other: EiraOS Danish OS design |
| 67 | [HarlequinCS/Veritas_Payloads](https://github.com/HarlequinCS/Veritas_Payloads) | Other: OWASP payload dataset |
| 68 | [RBKunnela/veritas-framework](https://github.com/RBKunnela/veritas-framework) | Other: agent-trust framework |
| 69 | [Newsrize/veritass](https://github.com/Newsrize/veritass) | Stub README (10 chars), nothing to grade |
| 74 | [j4ck4L0up3/veritas](https://github.com/j4ck4L0up3/veritas) | Stub README (10 chars), nothing to grade |
| 75 | [magal-dev/veritas-ai](https://github.com/magal-dev/veritas-ai) | Other: Brazilian TCC |
| 81 | [ConnorWolff0/veritas-cloud-monitor](https://github.com/ConnorWolff0/veritas-cloud-monitor) | Other: site monitor |
| 83 | [agastyamittal/VeritasAIHackathon](https://github.com/agastyamittal/VeritasAIHackathon) | Unlabelled: AEROFORM 3D viewer (inventive, off-track) |
| 84 | [Mahyarrk/project-veritas](https://github.com/Mahyarrk/project-veritas) | Unlabelled: stats auditor for papers (smart, validated on own thesis) |
| 85 | [jmunies30/Veritas-AI-Hackathon](https://github.com/jmunies30/Veritas-AI-Hackathon) | No README retrievable (private, empty, or no readme) |
| 87 | [josejorge/josejorge](https://github.com/josejorge/josejorge) | Not a project: profile README |
| 88 | [hiteacheryouare/veritas](https://github.com/hiteacheryouare/veritas) | No README retrievable (private, empty, or no readme) |
| 89 | [kevinbato767-sudo/Veritas-Backup-Exec-Guide](https://github.com/kevinbato767-sudo/Veritas-Backup-Exec-Guide) | NOT a hackathon entry: Veritas Backup Exec guide |
| 90 | [ChristianMangwanda/veritas-research-radar](https://github.com/ChristianMangwanda/veritas-research-radar) | Other: visa-eligibility extension |
| 91 | [NTinkicht/veritas-atlas](https://github.com/NTinkicht/veritas-atlas) | Other: .NET platform |
| 95 | [ChaiTravelTeam/airline-directory](https://github.com/ChaiTravelTeam/airline-directory) | Empty |
| 96 | [mehmetcankatar/NeuroScope_VeritasAI](https://github.com/mehmetcankatar/NeuroScope_VeritasAI) | Stub README (22 chars), nothing to grade |
| 97 | [vikram-saraswatula/veritasEEpipeline](https://github.com/vikram-saraswatula/veritasEEpipeline) | No README retrievable (private, empty, or no readme) |
| 99 | [Saikrishna0817/Veritas](https://github.com/Saikrishna0817/Veritas) | Other event: SDG hackathon |
| 101 | [Hibakupoxzz/VERITAS](https://github.com/Hibakupoxzz/VERITAS) | Not an entry: stock Laravel |
| 104 | [mo74x/veritas-bridge](https://github.com/mo74x/veritas-bridge) | No README retrievable (private, empty, or no readme) |
| 106 | [Veritas-AI-International-Hackathon/Veritas-AI-International-Highschool-Hackathon-2026](https://github.com/Veritas-AI-International-Hackathon/Veritas-AI-International-Highschool-Hackathon-2026) | Stub README (84 chars), nothing to grade |
| 114 | [actions-marketplace-validations/jayvion-Strata_veritas-article14-scanner](https://github.com/actions-marketplace-validations/jayvion-Strata_veritas-article14-scanner) | Not an entry: EU AI Act scanner |
| 125 | [mytherrant/VERITAS-Academy](https://github.com/mytherrant/VERITAS-Academy) | No README retrievable (private, empty, or no readme) |
| 126 | [qwertybob1978/Veritas](https://github.com/qwertybob1978/Veritas) | No README retrievable (private, empty, or no readme) |
| 127 | [ProfessionalYapper0311/Veritas---RAG-v2.0](https://github.com/ProfessionalYapper0311/Veritas---RAG-v2.0) | Stub README (130 chars), nothing to grade |
| 128 | [felixbellafkih/veritas-analyst-front](https://github.com/felixbellafkih/veritas-analyst-front) | Other: Quranic NLP kernel |
| 131 | [VERITAS-Observatory/Eventdisplay_AnalysisScripts_VTS](https://github.com/VERITAS-Observatory/Eventdisplay_AnalysisScripts_VTS) | NOT an entry: VERITAS gamma-ray observatory |
| 140 | [lordjunnior/lord-veritas](https://github.com/lordjunnior/lord-veritas) | Other: OpenTimestamps tool |
| 143 | [veritasfuji-japan/veritas_os](https://github.com/veritasfuji-japan/veritas_os) | Not an entry: veritas_os governance product |
| 144 | [samairaisabella-stack/Veritas-AI-Hackathon-2026](https://github.com/samairaisabella-stack/Veritas-AI-Hackathon-2026) | Stub README (27 chars), nothing to grade |
| 145 | [jayden-ferianto/Ecce-Veritas](https://github.com/jayden-ferianto/Ecce-Veritas) | Other: habit tracker |
| 146 | [PanshulVempalli/Veritas-AI-Hackathon](https://github.com/PanshulVempalli/Veritas-AI-Hackathon) | Stub README (22 chars), nothing to grade |
| 147 | [burgerrrman21/Veritas-ai-hackahon-project](https://github.com/burgerrrman21/Veritas-ai-hackahon-project) | Stub README (46 chars), nothing to grade |
| 150 | [nehanshkesharwani/writing-portfolio](https://github.com/nehanshkesharwani/writing-portfolio) | Not an entry: portfolio |
| 151 | [abusanaevdias/carbon-copilot](https://github.com/abusanaevdias/carbon-copilot) | Other event: CATALYST 2026 (Bureau Veritas case) |
| 153 | [OscarBuzz2006/Project-Veritas](https://github.com/OscarBuzz2006/Project-Veritas) | Other: epistemics simulation (Apart) |
| 154 | [Catherine61005/VERITAS-Echo](https://github.com/Catherine61005/VERITAS-Echo) | Other: echocardiography research |
| 155 | [adamcodetime/veritas_html](https://github.com/adamcodetime/veritas_html) | Unlabelled: EquinoxAI market ONNX demo |
| 156 | [sandyowens206-netizen/veritas](https://github.com/sandyowens206-netizen/veritas) | No README retrievable (private, empty, or no readme) |
| 157 | [VrtxOmega/VrtxOmega](https://github.com/VrtxOmega/VrtxOmega) | Not a project: profile |
| 158 | [samirusham-dotcom/veritas](https://github.com/samirusham-dotcom/veritas) | Unverifiable |
| 160 | [jayvion-Strata/veritas-article14-scanner](https://github.com/jayvion-Strata/veritas-article14-scanner) | Not an entry: same scanner as #114 |
| 162 | [Varad9800x3d/Veritas-AI-Project](https://github.com/Varad9800x3d/Veritas-AI-Project) | Stub README (20 chars), nothing to grade |
| 163 | [AabidAlias/veritas1.0](https://github.com/AabidAlias/veritas1.0) | No README retrievable (private, empty, or no readme) |
| 166 | [Fable98/Veritas](https://github.com/Fable98/Veritas) | Stub README (101 chars), nothing to grade |
| 167 | [odh50fire-sys/veritasenglish](https://github.com/odh50fire-sys/veritasenglish) | Other: Korean English-learning app |
| 169 | [KVERITAS-SCIENCE/ledger](https://github.com/KVERITAS-SCIENCE/ledger) | Unverifiable |
| 172 | [gauravmes9a11-alt/VERITAS](https://github.com/gauravmes9a11-alt/VERITAS) | Other: labour-law multi-agent system |
| 173 | [FPC-effortless/veritas](https://github.com/FPC-effortless/veritas) | Other: agent training foundry product |
| 174 | [AIGCNWPU/aigcdetect](https://github.com/AIGCNWPU/aigcdetect) | Other: Chinese AIGC detector |
| 177 | [elon00/veritas-venus-mapper](https://github.com/elon00/veritas-venus-mapper) | Not an entry: blockchain boilerplate |
| 179 | [FrudenFireKing/VeritasHack](https://github.com/FrudenFireKing/VeritasHack) | Other event: Geek Room hackathon (stale-answer detector) |
| 180 | [Thilak-raj-08/veritas-student-erp](https://github.com/Thilak-raj-08/veritas-student-erp) | Other: student ERP |
| 181 | [samir701/Veritas---Ai-powered-Exam-portal](https://github.com/samir701/Veritas---Ai-powered-Exam-portal) | Other: exam portal |
| 184 | [accountscivitas/ifv-league](https://github.com/accountscivitas/ifv-league) | No README retrievable (private, empty, or no readme) |
| 185 | [agolaurluik/Veritas](https://github.com/agolaurluik/Veritas) | Other: manipulation analyser + extension (Estonia) |
| 186 | [addyy-lee/veritas-ai-project-2026](https://github.com/addyy-lee/veritas-ai-project-2026) | No README retrievable (private, empty, or no readme) |
| 189 | [GD-root/Veritas-in-Caritate](https://github.com/GD-root/Veritas-in-Caritate) | Other: Catholic apologetics app |
| 190 | [27-GROUP/kveritas-releases](https://github.com/27-GROUP/kveritas-releases) | Not an entry: K-Veritas binaries |
| 191 | [27-GROUP/kveritas-go](https://github.com/27-GROUP/kveritas-go) | Not an entry: K-Veritas crypto CLI |
| 192 | [Kiasha9229/veritas_ai_finance](https://github.com/Kiasha9229/veritas_ai_finance) | Stub README (20 chars), nothing to grade |
| 194 | [ArqishZaria/veritas](https://github.com/ArqishZaria/veritas) | No README retrievable (private, empty, or no readme) |
| 195 | [unb-mds/2026-2-VeritasIA](https://github.com/unb-mds/2026-2-VeritasIA) | Course project (UnB) |
| 196 | [adamgalon/veritass](https://github.com/adamgalon/veritass) | Stub README (375 chars), nothing to grade |
| 197 | [VeritasRiskEngine/VeritasRiskEngine](https://github.com/VeritasRiskEngine/VeritasRiskEngine) | Not an entry: GRC marketing |
| 198 | [FuzzDOT/VERITAS](https://github.com/FuzzDOT/VERITAS) | Other: solvency engine |
| 199 | [Mthwane/Veritas](https://github.com/Mthwane/Veritas) | Other: .NET data platform |
| 202 | [harvard-huit/hapi-veritas-cli](https://github.com/harvard-huit/hapi-veritas-cli) | Not an entry: Harvard HUIT CLI |
| 205 | [veritaslock/veritaslock-cli](https://github.com/veritaslock/veritaslock-cli) | Not an entry: VeritasLock CLI |
| 206 | [gunturborneo31/veritas](https://github.com/gunturborneo31/veritas) | Not an entry: stock Laravel |
| 208 | [gpereiradeveloper-rgb/Harvard-Project-site-with-3d-Animation](https://github.com/gpereiradeveloper-rgb/Harvard-Project-site-with-3d-Animation) | Other: 3D site |
| 209 | [dylp1ckle11/veritas](https://github.com/dylp1ckle11/veritas) | No README retrievable (private, empty, or no readme) |
| 211 | [Emediong-Etuk/veritasclaim](https://github.com/Emediong-Etuk/veritasclaim) | Stub README (148 chars), nothing to grade |
| 212 | [ElKruegger/VeritasBackEnd](https://github.com/ElKruegger/VeritasBackEnd) | Other: e-commerce backend |
| 213 | [suares13/veritas-gem](https://github.com/suares13/veritas-gem) | Other: Gemini security tool |
| 215 | [brtucker42/FTCRoboticsWithPedroPathing2026-27](https://github.com/brtucker42/FTCRoboticsWithPedroPathing2026-27) | NOT an entry: FTC robotics SDK |
| 216 | [holland202/sovereign-veritas](https://github.com/holland202/sovereign-veritas) | Other: governance prototype |
| 217 | [M-697735/VERITAS-Triforge](https://github.com/M-697735/VERITAS-Triforge) | Other event?: email forensics |
| 221 | [DoodleDivine/Veritas-ai-climate-project](https://github.com/DoodleDivine/Veritas-ai-climate-project) | Stub README (42 chars), nothing to grade |
| 222 | [m-hesam-moradian/veritasnet](https://github.com/m-hesam-moradian/veritasnet) | Other: decentralised ML infra |
| 223 | [jjba23/veritas.el](https://github.com/jjba23/veritas.el) | Not an entry: Emacs |
| 224 | [yuvraj9990-en/MEDPULSE-AI](https://github.com/yuvraj9990-en/MEDPULSE-AI) | No README retrievable (private, empty, or no readme) |
| 225 | [ofuree2la/rider](https://github.com/ofuree2la/rider) | Other: campus ride app |
| 226 | [richeroveis/arena-veritas](https://github.com/richeroveis/arena-veritas) | Other: GenLayer dApp |
| 228 | [joaomarcoss1/VERITASUNICLASS](https://github.com/joaomarcoss1/VERITASUNICLASS) | Other: course platform |
| 229 | [navyarangwani/veritas](https://github.com/navyarangwani/veritas) | Other: ESG audit product |
| 230 | [adamcodetime/VERITAS_HACKATHON](https://github.com/adamcodetime/VERITAS_HACKATHON) | No README retrievable (private, empty, or no readme) |
| 231 | [Architekt-future/veritas-protocol](https://github.com/Architekt-future/veritas-protocol) | Other: Ukrainian truth-protocol |
| 232 | [Umar-coder1/Vision-Ai-Climate](https://github.com/Umar-coder1/Vision-Ai-Climate) | Stub README (84 chars), nothing to grade |
| 233 | [arphesegreteria-arch/arphe-graphic-kit](https://github.com/arphesegreteria-arch/arphe-graphic-kit) | Not an entry: graphic kit |
| 234 | [annatalia-w/Veritas-AI-Hackathon](https://github.com/annatalia-w/Veritas-AI-Hackathon) | Stub README (22 chars), nothing to grade |
| 235 | [Codeman-lex/engineering-portfolio](https://github.com/Codeman-lex/engineering-portfolio) | Not an entry: portfolio |
| 236 | [TEAMNAJAA/veritas](https://github.com/TEAMNAJAA/veritas) | No README retrievable (private, empty, or no readme) |
| 238 | [16oweno-art/veritas-ai](https://github.com/16oweno-art/veritas-ai) | No README retrievable (private, empty, or no readme) |
| 239 | [sabari-k07/Veritas_CMS](https://github.com/sabari-k07/Veritas_CMS) | Other: college portal |
| 240 | [f8fixlu/veritas](https://github.com/f8fixlu/veritas) | Other: exam system |
| 241 | [Aragoorn/VeritasCourt](https://github.com/Aragoorn/VeritasCourt) | Other: GenLayer court |
| 243 | [a30399983-art/veritas03](https://github.com/a30399983-art/veritas03) | Other: Render test |
| 245 | [api-evangelist/cohesity](https://github.com/api-evangelist/cohesity) | NOT an entry: API profile of Cohesity |
| 246 | [AION-Analytics-India/aion-veritas](https://github.com/AION-Analytics-India/aion-veritas) | Other: Indian index forecasts product |
| 247 | [MogSquad-FinalYear/Veritas-Frontend](https://github.com/MogSquad-FinalYear/Veritas-Frontend) | Other: frontend for 3 backends |
| 248 | [jasna18/veritas-clinic](https://github.com/jasna18/veritas-clinic) | No README retrievable (private, empty, or no readme) |
| 249 | [AtharvaJaysingpure25/Veritas-AI](https://github.com/AtharvaJaysingpure25/Veritas-AI) | Stub README (12 chars), nothing to grade |
| 250 | [niyatiswaroop/VERITAS](https://github.com/niyatiswaroop/VERITAS) | Other: B.Tech project |
| 251 | [Gauravvj/VERITAS-AI](https://github.com/Gauravvj/VERITAS-AI) | Stub README (12 chars), nothing to grade |
| 252 | [Giddy-chordz/VERITAS-AI](https://github.com/Giddy-chordz/VERITAS-AI) | No README retrievable (private, empty, or no readme) |
| 253 | [Sishan24/veritas-enhanced](https://github.com/Sishan24/veritas-enhanced) | Other: claim verification |
| 254 | [coha45/veritas-cv](https://github.com/coha45/veritas-cv) | No README retrievable (private, empty, or no readme) |
| 256 | [Vinay4556/Veritas-AI](https://github.com/Vinay4556/Veritas-AI) | Other: procurement compliance |
| 257 | [gigabyte-artur/Veritas](https://github.com/gigabyte-artur/Veritas) | Stub README |
| 259 | [shreyanshsharma-1210/veritas-ai](https://github.com/shreyanshsharma-1210/veritas-ai) | Short README: unverifiable |
| 260 | [jjba23/veritas](https://github.com/jjba23/veritas) | No README retrievable (private, empty, or no readme) |
| 261 | [Sanchay0123/Veritas-Stream](https://github.com/Sanchay0123/Veritas-Stream) | Other: deepfake forensics |
| 262 | [gmackie/t3code-veritas-plugin](https://github.com/gmackie/t3code-veritas-plugin) | Not an entry: plugin |
| 263 | [hessiser/veritas](https://github.com/hessiser/veritas) | NOT an entry: Honkai Star Rail overlay |
| 264 | [yuvraj8eee25-rgb/Veritas](https://github.com/yuvraj8eee25-rgb/Veritas) | Stub README |
| 265 | [msdyatt/vvcoop-familyportal](https://github.com/msdyatt/vvcoop-familyportal) | Not an entry: starter template |
| 266 | [LuizHenriqueNogueira/Veritas](https://github.com/LuizHenriqueNogueira/Veritas) | Other: Brazilian disinfo app |
| 267 | [trunks2kg/veritas-motor-group](https://github.com/trunks2kg/veritas-motor-group) | No README retrievable (private, empty, or no readme) |
| 268 | [yanicpeterson-prog/veritas](https://github.com/yanicpeterson-prog/veritas) | No README retrievable (private, empty, or no readme) |
| 269 | [yanicpeterson-prog/veritas-1](https://github.com/yanicpeterson-prog/veritas-1) | No README retrievable (private, empty, or no readme) |
| 270 | [HIMANSHU-heist/VERITAS](https://github.com/HIMANSHU-heist/VERITAS) | Other: paper-trading system |
| 271 | [Milan-6/VERITAS](https://github.com/Milan-6/VERITAS) | Other: research platform |
| 272 | [shiroonigami23-ui/veritas-protocol-ai-agents](https://github.com/shiroonigami23-ui/veritas-protocol-ai-agents) | Not an entry: agent audit chain |
| 273 | [gabrielhca/Micelio-Veritas](https://github.com/gabrielhca/Micelio-Veritas) | Other: Micelio |
| 274 | [Bhoomified/VeritasAI](https://github.com/Bhoomified/VeritasAI) | Other: deepfake Django |
| 275 | [veritasneko/veritasneko.github.io](https://github.com/veritasneko/veritasneko.github.io) | Stub README (23 chars), nothing to grade |
| 276 | [Zephyr-110/Veritas](https://github.com/Zephyr-110/Veritas) | Other: Solana prediction market |
| 277 | [veritashong-adimn/veritas-platform](https://github.com/veritashong-adimn/veritas-platform) | No README retrievable (private, empty, or no readme) |
| 278 | [JorVe299/Veritas](https://github.com/JorVe299/Veritas) | Not an entry: FiveM admin panel |
| 279 | [picklunchforme/veritasundmedizin](https://github.com/picklunchforme/veritasundmedizin) | Unverifiable (page markup, not README) |
| 280 | [saaniiyaa/veritas-sharda](https://github.com/saaniiyaa/veritas-sharda) | No README retrievable (private, empty, or no readme) |
| 281 | [studioveritas/studio-veritas](https://github.com/studioveritas/studio-veritas) | Not an entry: studio site |
| 282 | [faust-dark/veritas](https://github.com/faust-dark/veritas) | Other event: Cortensor hackathon |
| 283 | [Patrick190508/whaleshark-mafia-island](https://github.com/Patrick190508/whaleshark-mafia-island) | No README retrievable (private, empty, or no readme) |
| 284 | [nurulirfan1828-boop/readability-scorer18](https://github.com/nurulirfan1828-boop/readability-scorer18) | Unlabelled: readability scorer, 1 KB README, unverifiable |
| 285 | [samskruthiReddy/VERITAS-AI](https://github.com/samskruthiReddy/VERITAS-AI) | Other event: YUKTIK-2026 |
| 286 | [ShreyaP168/Bureau_veritas](https://github.com/ShreyaP168/Bureau_veritas) | Other: Bureau Veritas invoicing |
| 287 | [JCMtz55/arcanum-veritas](https://github.com/JCMtz55/arcanum-veritas) | Not an entry: TTRPG tool |
| 288 | [AtharvS7/VeritasAI-v2](https://github.com/AtharvS7/VeritasAI-v2) | Other: misinformation checker (live) |
| 289 | [kwesi-mb/veritasrag](https://github.com/kwesi-mb/veritasrag) | No README retrievable (private, empty, or no readme) |
| 290 | [cedriccollins2010/Veritas-platform](https://github.com/cedriccollins2010/Veritas-platform) | Other: evidence platform |
| 291 | [hamzatahir06/Veritas-Ai](https://github.com/hamzatahir06/Veritas-Ai) | Other: research agent |
| 292 | [Logankenney/MentasVeritas](https://github.com/Logankenney/MentasVeritas) | Stub README (234 chars), nothing to grade |
| 293 | [Lucas-Maransaldi/veritas-core-sheet](https://github.com/Lucas-Maransaldi/veritas-core-sheet) | Not an entry: Foundry module |
| 294 | [Lucas-Maransaldi/veritas-features](https://github.com/Lucas-Maransaldi/veritas-features) | Not an entry: Foundry module |
| 295 | [sriharish99/VeritasRAG](https://github.com/sriharish99/VeritasRAG) | Other: HR policy RAG |
| 296 | [lixinveritas/veritas-link-releases](https://github.com/lixinveritas/veritas-link-releases) | Stub README (86 chars), nothing to grade |
| 297 | [JoeyGirdhar/Veritas](https://github.com/JoeyGirdhar/Veritas) | Other: agentic analyst |
| 298 | [Caiorhcp/veritas](https://github.com/Caiorhcp/veritas) | Not an entry: Claude plugin |
| 210 | [swingcheck/Veritas-Challenge](https://github.com/swingcheck/Veritas-Challenge) | README no longer retrievable (was an unfilled template) |
