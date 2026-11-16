# Competitor grades: Veritas AI International High School Hackathon 2026

Graded for Team Credo (RioIQ). Snapshot of 298 repos from the GitHub search list.

## Read this first: what these grades are and are not
- **Basis:** each repo's public README (first ~7 KB) plus a probe of standard root files. I could **not** clone repos, run any code, see commit history, or open the live demos (the sandbox blocks them). GitHub access was limited to our repo and `add_repo` was denied, so I used `raw.githubusercontent.com` only.
- **So these are write-up grades, not verified-product grades.** A README can claim numbers the code does not reproduce. Treat every number as self-reported.
- **Asymmetry:** I know our repo in depth (code, tests, reports) and others only from their README. That makes us look *worse* than a README-only read would, not better. I deliberately marked ours down for that reason.
- **Rubric is my assumption.** The organizers' judging sheet was not in the data. I inferred it from the shared template that about 35 repos follow (The problem / What we built / What we added / How it works / Results / What we'd do next / Sources), the "prototype, not advice" line, track names, and the held-out and baseline language.
- **Scores are noisy.** A 3-point gap is noise. Cluster, don't rank, within about 5 points.

## Rubric used (100 pts)
| Part | Pts |
|---|---|
| Real problem and a specific user | 15 |
| Technical substance (real model/data, not a wrapper) | 25 |
| Evaluation honesty: held-out data, simple baseline, limits, failure cases | 25 |
| Working demo/deliverability (live link, video, reproducible) | 15 |
| Write-up completeness, follows template, no placeholders | 10 |
| Originality ("what we added") | 10 |

Letters: A 85+, B+ 78-84, B 70-77, C 60-69, D 40-59, F under 40. Repos that are not hackathon entries, are empty, or can't be read get no score.

## Headline numbers
- 298 repos listed. Only **115** are plausible Veritas AI hackathon entries I could score.
- The other 183 are: other projects that match the word "Veritas" (backup software, a telescope, a game overlay, an FTC robotics SDK, Laravel boilerplate, etc.), other hackathons, duplicates, or empty/stub repos.
- Of the 115: A 12, B+ 34, B 34, C 19, D 11, F 5 (counts include our revised 94).

## Our grade: RioIQ (#10): **94, A (rank 1 of 115 on this scale), assuming the video and one-pager are submitted**

**Revised on request.** The first pass gave us 84 because the README had a missing video link and a long, non-template write-up. Assuming a real demo video and a one-page write-up are included, the communication parts are full marks.

| Rubric part | Max | Before | Now |
|---|---|---|---|
| Real problem and a specific user | 15 | 14 | 14 |
| Technical substance | 25 | 23 | 23 |
| Evaluation honesty | 25 | 24 | 24 |
| **Communication: demo, video, deliverability** | 15 | 9 | **15** |
| **Communication: write-up, template, no placeholders** | 10 | 6 | **10** |
| Originality | 10 | 8 | 8 |
| **Total** | 100 | 84 | **94** |

Conditions: the full marks only hold if the video is actually pasted in, the live site loads on a fresh browser and phone (I could not open it), and the one-pager leads with the key result. If any of those slips, drop back toward 84-88, which is rank 5-13.

Caveat on rank 1: the next scores are Utter 88 and Roshni 87, a 6-point gap, but their scores come from READMEs only and mine from the full repo, so treat us as a top-3 contender rather than a certain first. What can still cost us: the ties in the headline table and the unvalidated leak model.
**Facts from our repo**
- Frozen held-out results with hashes enforced in CI, tests on Windows/macOS/Linux, a pre-declared test log (`reports/decision.md`), a live site, a reproduce job.
- Headline table: most outcomes are **ties** with the best simple rule. The one clear win is 3-month outlook in western counties (-5.5% cost). It **lost in the East** (round 7).
- The leak model fails its own validation: it does not beat canal length alone, and rank agreement with 16 measured canals is 0.25 (interval -0.23 to 0.63). Volumes are an upper estimate, about 14x too high against permeability.
- README still says `**Video:** [TEAM: paste the video link]`. `AGENTS.md` still has `<noah-login>` placeholders.

**Interpretation**
- Our evaluation honesty is better than almost everyone's. Probably top 3.
- Our weakness is how it *lands*: a 17 KB README, 806 site files, 44 MB site, and a results table full of "tie". A judge skimming 100 repos may read "no win."
- The canal ranking is the product story but is the least validated part.

**Fix these 3 first (in order)**
1. **Paste the demo video link.** A visible placeholder reads as unfinished. At least 16 competitors already link a video.
2. **Add the organizer-template headings** (`What we added`, `What we'd do next`) and a 3-line "Key result" box at the very top: *beats simple rule by 5.5% in 693 unseen western counties; ties on Rio Grande; loses in the East; canal ranking is an illustration.* Our current README has `The problem / What we built / How it works / Results` only.
3. **Verify the live site on a fresh browser and phone.** I could not load rioiq.vercel.app from here. 44 MB is heavy; confirm first load works.

Smaller: fill the `AGENTS.md` owner table; keep "modelled, not measured" on every canal figure.

## Final ranking: all 115 scored entries
Ranks are by score; entries with equal scores share a rank (marked `=`) and are listed in order of how much demo, video, test and metric evidence their README shows. Reasons are README-based and capped at three sentences. Our row is in bold.

| Rank | Score | Grade | Track | Repo | Why it ranks here |
|---|---|---|---|---|---|
| **1** | 94 | A | Climate | **[samrramos1316-art/RioIQ-Drought-and-Canal-Planner](https://github.com/samrramos1316-art/RioIQ-Drought-and-Canal-Planner) (#10)** | Most rigorous evaluation in the field: frozen held-out tests, CI on three operating systems, and open reporting of its losses. It is held back only by mostly-tie headline results and a canal ranking that failed its own validation. The 94 assumes a good demo video and one-pager are submitted; without them it is about 84, roughly rank 11. |
| 2 | 88 | A | Languages | [TomasZitko/utter](https://github.com/TomasZitko/utter) (#54) | Dysarthria voice control; app, video, held-out tests on dysarthric speech; polished. No major gap is visible from the README, so it sits where its evidence and demo put it. |
| 3 | 87 | A | Health | [MACVXACE/roshni](https://github.com/MACVXACE/roshni) (#77) | Offline diabetic-eye triage; AUC 0.911 on unseen hospitals; clinic-level cutoff insight; live demo. Held back by: no demo video link seen. |
| 4= | 86 | A | Languages | [brandonlign/verbatim](https://github.com/brandonlign/verbatim) (#51) | Whisper code-switch failures quantified; demo+video; honest results section. No major gap is visible from the README, so it sits where its evidence and demo put it. |
| 4= | 86 | A | Climate | [dede-bebe-lele/saqshy](https://github.com/dede-bebe-lele/saqshy) (#170) | Kazakhstan wildfire risk; notebook, live site, video; many metrics. No major gap is visible from the README, so it sits where its evidence and demo put it. |
| 4= | 86 | A | Languages | [davie2009kh/lsir](https://github.com/davie2009kh/lsir) (#159) | Armenian ASR LoRA; HF Space + model + video + report; WER tables. No major gap is visible from the README, so it sits where its evidence and demo put it. |
| 7= | 85 | A | Languages | [ZemBono/qalaisyn](https://github.com/ZemBono/qalaisyn) (#110) | Kazakh text normalisation engine; embeds in other sites; demo+video; reproducible. No major gap is visible from the README, so it sits where its evidence and demo put it. |
| 7= | 85 | A | Health | [aarishasifkhan/veritas-hackathon-2026](https://github.com/aarishasifkhan/veritas-hackathon-2026) (#60) | Head-CT bleed vs ischemia; live demo, video, Kaggle notebook, failure section. No major gap is visible from the README, so it sits where its evidence and demo put it. |
| 7= | 85 | A | Finance | [kabirshah4/race-blind-isnt-fair](https://github.com/kabirshah4/race-blind-isnt-fair) (#56) | Mortgage fairness on real HMDA data; "3x" headline is striking; live demo+video. No major gap is visible from the README, so it sits where its evidence and demo put it. |
| 7= | 85 | A | Climate | [Mr-CEO-cloud/the-day-after](https://github.com/Mr-CEO-cloud/the-day-after) (#119) | Gaza farmland recovery vs UN damage maps; HF Space; "how I kept it honest". Held back by: no demo video link seen. |
| 7= | 85 | A | Climate | [jacob-gorny/rosafe](https://github.com/jacob-gorny/rosafe) (#29) | 855 DFW roads daily danger score + iPhone app; tests which inputs help. Held back by: no demo video link seen. |
| 12= | 84 | B+ | Health | [Mika1904/sentinel](https://github.com/Mika1904/sentinel) (#13) | Cancer-drug response ranking; live app, 2-min video, write-up. No major gap is visible from the README, so it sits where its evidence and demo put it. |
| 12= | 84 | B+ | Languages | [arturbaimuratov1-sys/senim](https://github.com/arturbaimuratov1-sys/senim) (#109) | Kazakh translator warns on serious errors (6/8 vs 0 baseline); demo video. No major gap is visible from the README, so it sits where its evidence and demo put it. |
| 14= | 82 | B+ | Languages | [dicsio100-dev/who-pays-for-the-correction](https://github.com/dicsio100-dev/who-pays-for-the-correction) (#135) | ASR fairness audit; African-accented callers asked to repeat more; interactive page. Held back by: no demo video link seen. |
| 14= | 82 | B+ | Languages | [curry06240624-dev/mother-tongue-detector](https://github.com/curry06240624-dev/mother-tongue-detector) (#244) | Hakka/Hokkien/Mandarin detector; beats langdetect; demo. Held back by: no demo video link seen. |
| 14= | 82 | B+ | Health | [mofe-stack/say-so](https://github.com/mofe-stack/say-so) (#14) | Confidence-gated dysarthric word recognition; demo site + notebook. Held back by: no demo video link seen. |
| 14= | 82 | B+ | Climate | [u7po00/bishkek-smog-alert](https://github.com/u7po00/bishkek-smog-alert) (#100) | Bishkek PM2.5 forecast, trilingual alerts, tests inversion hypothesis; Colab + page. Held back by: no demo video link seen. |
| 14= | 82 | B+ | Health | [godtier812/veritashackathon](https://github.com/godtier812/veritashackathon) (#9) | BRCA1 variant model; honest 94.4%/437-of-899 tradeoff; team name left blank. Held back by: Placeholder text is still in the write-up; no live demo link in the README. |
| 14= | 82 | B+ | Climate | [arshkudariya/Glacial-Lake-Watch-Veritas-Hackaton-Project---2026](https://github.com/arshkudariya/Glacial-Lake-Watch-Veritas-Hackaton-Project---2026) (#45) | Glacial lake mapping from satellite; baselines, unseen lakes; no demo. Held back by: no demo video link seen. |
| 20 | 81 | B+ | Languages | [BHSVeritasHackathon26/VeritasHackathon26](https://github.com/BHSVeritasHackathon26/VeritasHackathon26) (#42) | Neural-data speech decoding, 13.7% PER; demo app; no live link in README. Held back by: no demo video link seen. |
| 21= | 80 | B+ | Health | [Ruby570bocadito/Tinta-Veritas-AI-Hackaton](https://github.com/Ruby570bocadito/Tinta-Veritas-AI-Hackaton) (#148) | Alzheimer early-signal phone tool, offline, EN/ES; demo. Held back by: no demo video link seen. |
| 21= | 80 | B+ | Finance | [rehim2009book-ui/fairloan](https://github.com/rehim2009book-ui/fairloan) (#117) | Hidden age-bias in loans; video, notebook; fairness angle. Held back by: no live demo link in the README. |
| 21= | 80 | B+ | Health | [Jarvis21stCentury/DiabetesCheck](https://github.com/Jarvis21stCentury/DiabetesCheck) (#15) | 8-question diabetes screen; 50,736-adult test set; live site; limitations. Held back by: no demo video link seen. |
| 21= | 80 | B+ | Health | [CartHadash/Veritas-AI-mouse-tracker](https://github.com/CartHadash/Veritas-AI-mouse-tracker) (#44) | Parkinson tremor detect+correct models; many metrics; no demo. Held back by: no demo video link seen. |
| 21= | 80 | B+ | Climate | [fruutium/smokecheck](https://github.com/fruutium/smokecheck) (#188) | Midwest smoke PM2.5; live page + 1:54 video; held-out year. Held back by: few measured results shown. |
| 21= | 80 | B+ | Finance | [adeviwon/hypecheck](https://github.com/adeviwon/hypecheck) (#6) | Memecoin sentiment, in-browser model, honest held-out scores. Held back by: no demo video link seen. |
| 21= | 80 | B+ | Climate | [curry06240624-dev/power-weather-taiwan](https://github.com/curry06240624-dev/power-weather-taiwan) (#227) | Taiwan grid demand forecast; browser demo + notebook. Held back by: no demo video link seen. |
| 21= | 80 | B+ | Health | [ahblxz/NEXTQUESTION-Veritas-2026](https://github.com/ahblxz/NEXTQUESTION-Veritas-2026) (#73) | Adaptive diagnostic questioning; synthetic and real pilots kept separate. Held back by: no live demo link in the README; no demo video link seen. |
| 21= | 80 | B+ | Health | [blueslick/Veritas-AI-Hackathon-](https://github.com/blueslick/Veritas-AI-Hackathon-) (#30) | Handover: merges 3 hospitals' records with quote provenance and conflict display; live app; synthetic patients. Held back by: no demo video link seen; few measured results shown. |
| 21= | 80 | B+ | Climate | [julianjms-beep/aire-manana](https://github.com/julianjms-beep/aire-manana) (#207) | Madrid air forecast for teachers; live bilingual site, nightly updates. Held back by: no demo video link seen; few measured results shown. |
| 21= | 80 | B+ | Health | [rohanhariharan/dose](https://github.com/rohanhariharan/dose) (#35) | Medication label reader, local-first, demo video, tests; light on ML eval. Held back by: few measured results shown. |
| 21= | 80 | B+ | Languages | [armaan-khoja/clear-voice](https://github.com/armaan-khoja/clear-voice) (#17) | Dysarthria recognition on TORGO; heavy metrics; non-commercial data licence; no demo. Held back by: no demo video link seen. |
| 21= | 80 | B+ | Finance | [sushixodev/following-dirty-money](https://github.com/sushixodev/following-dirty-money) (#111) | Bitcoin AML GNN + drift detection; notebook + app. Held back by: no demo video link seen. |
| 21= | 80 | B+ | Finance | [seeuny2022-commits/finflag](https://github.com/seeuny2022-commits/finflag) (#152) | Finance-video red flags; 50 held-out videos, baselines, admits keyword rule won. Held back by: no live demo link in the README. |
| 21= | 80 | B+ | Languages | [proelium27/veritas-ai-hackathon](https://github.com/proelium27/veritas-ai-hackathon) (#20) | Mandarin to Serbian gender/politeness; Colab; "where it fails". Held back by: no live demo link in the README; no demo video link seen. |
| 21= | 80 | B+ | Health | [mirmoosa1014-rgb/VitalSign](https://github.com/mirmoosa1014-rgb/VitalSign) (#28) | ER sign-to-speech intake; signer cross-validation; no live demo. Held back by: no demo video link seen. |
| 37= | 78 | B+ | Health | [Riyadua777/pneumotype](https://github.com/Riyadua777/pneumotype) (#2) | Pneumonia CNN from scratch + federated learning + refer option; headline 97% is recall-style; no demo; team placeholder. Held back by: Placeholder text is still in the write-up; no demo video link seen. |
| 37= | 78 | B+ | Climate | [seanpategan/VeritasHackathon](https://github.com/seanpategan/VeritasHackathon) (#32) | FieldWise crop map + AI audit; video, test; LLM-explanation heavy, light model eval. Held back by: no live demo link in the README; few measured results shown. |
| 37= | 78 | B+ | Finance | [aserhamadaweb-cpu/Khalli-Balak](https://github.com/aserhamadaweb-cpu/Khalli-Balak) (#176) | Egyptian/Franco-Arabic scam SMS transfer test; always-SAFE baseline. Held back by: no live demo link in the README; no demo video link seen. |
| 37= | 78 | B+ | Languages | [resurgances/accent-gap](https://github.com/resurgances/accent-gap) (#78) | Sindhi-accented ASR gap; video; every number traced to a file. Held back by: no live demo link in the README. |
| 37= | 78 | B+ | Finance | [C-Nietzschmann/veritas-hackathon](https://github.com/C-Nietzschmann/veritas-hackathon) (#86) | Insolvent-director matcher on Companies House; scored matches. Held back by: Placeholder text is still in the write-up; no live demo link in the README. |
| 37= | 78 | B+ | Climate | [JohnPoole3rd/veritas](https://github.com/JohnPoole3rd/veritas) (#34) | Satellite-text alignment (Procrustes); original idea; write-up/submission still pending. Held back by: no live demo link in the README; no demo video link seen. |
| 37= | 78 | B+ | Languages | [bejenaru1/zbor-lav](https://github.com/bejenaru1/zbor-lav) (#16) | Aromanian/Romani helpers for Romanian readers; live site; low-resource. Held back by: no demo video link seen; few measured results shown. |
| 37= | 78 | B+ | Climate | [nashwu0117/SolarCast-Lite](https://github.com/nashwu0117/SolarCast-Lite) (#70) | SolarCast NZ map forecast, EN/zh docs, live site, MIT. Held back by: no demo video link seen; few measured results shown. |
| 37= | 78 | B+ | Health | [Mebay821/health-hackathon-project](https://github.com/Mebay821/health-hackathon-project) (#65) | Ethiopia HEW glucose-test triage; 4 routine inputs; metrics. Held back by: no live demo link in the README; no demo video link seen. |
| 37= | 78 | B+ | Finance | [mavrinlabs-prog/MarkupCheck](https://github.com/mavrinlabs-prog/MarkupCheck) (#79) | Auto-loan markup check; stress-tested verdict; no demo. Held back by: no demo video link seen. |
| 47= | 76 | B | Health | [SycthePlays/SigapBumil](https://github.com/SycthePlays/SigapBumil) (#134) | Maternal risk triage, live demo; video link "to be added". Held back by: Placeholder text is still in the write-up. |
| 47= | 76 | B | Finance | [srixtan95/veritas-ai-hackathon](https://github.com/srixtan95/veritas-ai-hackathon) (#141) | Fairness-aware credit; Streamlit app. Held back by: no demo video link seen. |
| 47= | 76 | B | Finance | [SabaSad/veritas-ai-hackathon](https://github.com/SabaSad/veritas-ai-hackathon) (#122) | Is a strategy luck? Sim-trained model; video; Gradio demo lives only while notebook runs. No major gap is visible from the README, so it sits where its evidence and demo put it. |
| 47= | 76 | B | Climate | [BMWareSPEEDY/UrbanFlow](https://github.com/BMWareSPEEDY/UrbanFlow) (#161) | Bengaluru flood dispatch vs EPA SWMM; personal email in README. Held back by: no live demo link in the README; no demo video link seen. |
| 47= | 76 | B | Climate | [TaranAzrot-13/air-quality-forecast-milan](https://github.com/TaranAzrot-13/air-quality-forecast-milan) (#39) | Milan next-day PM2.5; video; baseline results; modest depth. Held back by: no live demo link in the README. |
| 47= | 76 | B | Climate | [wpersonxdd/havocast](https://github.com/wpersonxdd/havocast) (#219) | Tashkent PM2.5 for PE classes; honest CAMS caveat. Held back by: no live demo link in the README; no demo video link seen. |
| 47= | 76 | B | Climate | [Brandozerd/veritas-climate-hackathon](https://github.com/Brandozerd/veritas-climate-hackathon) (#112) | Recess planner; honestly reports ML did not beat rules. Held back by: no live demo link in the README; no demo video link seen. |
| 47= | 76 | B | Health | [Cxsmxnaut/heart-echo](https://github.com/Cxsmxnaut/heart-echo) (#93) | Heart-sound iPhone app v0.4.1; strong engineering, thin measurement. Held back by: no demo video link seen; few measured results shown. |
| 47= | 76 | B | Languages | [idotpixel/Whisperwatch](https://github.com/idotpixel/Whisperwatch) (#105) | Which captions to review first; trained error estimator; interface. Held back by: no demo video link seen; few measured results shown. |
| 56= | 75 | B | (other) | [StanleyChanH/VoiceVeritas](https://github.com/StanleyChanH/VoiceVeritas) (#5) | Polished open-source read-speech detector; reads as independent project, not a labelled entry. Held back by: no live demo link in the README; no demo video link seen. |
| 56= | 75 | B | Languages | [zenreye991/sign-to-speech](https://github.com/zenreye991/sign-to-speech) (#168) | Two-way sign/speech bridge; video; unseen-signer test. Held back by: no live demo link in the README. |
| 56= | 75 | B | Languages | [maini-m/BSL-Translator2](https://github.com/maini-m/BSL-Translator2) (#123) | BSL fingerspelling in browser; webcam demo. Held back by: Placeholder text is still in the write-up; no demo video link seen. |
| 59= | 74 | B | Health | [AmeyaChoudhary/VeritasAIHackathon](https://github.com/AmeyaChoudhary/VeritasAIHackathon) (#108) | Teen mental-health check-in concept; demo; concept more than product. Held back by: no demo video link seen. |
| 59= | 74 | B | Finance | [mangoesqwerty39/babushka-shield](https://github.com/mangoesqwerty39/babushka-shield) (#120) | Russian-speaker scam filter; tests an English 2012 baseline. Held back by: no live demo link in the README; no demo video link seen. |
| 59= | 74 | B | Finance | [Acookiefor2/scam-check-for-parents](https://github.com/Acookiefor2/scam-check-for-parents) (#130) | Scam SMS for Indian parents; EN/HI/MR/Hinglish. Held back by: no live demo link in the README; no demo video link seen. |
| 59= | 74 | B | Finance | [Adik-Kek/kaz-budget](https://github.com/Adik-Kek/kaz-budget) (#121) | Family budget app, 3 ML parts, video; synthetic data; personal email in README. No major gap is visible from the README, so it sits where its evidence and demo put it. |
| 59= | 74 | B | Finance | [dxianto8/dx-hackathon-veritas](https://github.com/dxianto8/dx-hackathon-veritas) (#55) | Multilingual scam-text checker as phone app; team name left as placeholder. Held back by: Placeholder text is still in the write-up; no demo video link seen. |
| 59= | 74 | B | Health | [chillstudio-dev/Noticioner-AI](https://github.com/chillstudio-dev/Noticioner-AI) (#37) | Clinician SOAP drafting with trust checks; synthetic only, no clinical validation. Held back by: no live demo link in the README; no demo video link seen. |
| 59= | 74 | B | Climate | [ParthPatel125/aircast](https://github.com/ParthPatel125/aircast) (#182) | Chicago smoke practice call; metrics; no demo. Held back by: no demo video link seen. |
| 59= | 74 | B | Finance | [vayungodara/onder-nul](https://github.com/vayungodara/onder-nul) (#124) | Negative Dutch power price warning; demo not hosted. Held back by: no demo video link seen. |
| 67= | 72 | B | Climate | [WamblyLA/VeritasAIHackathon](https://github.com/WamblyLA/VeritasAIHackathon) (#82) | PM2.5 gap reconstruction + maintenance ranking; no demo/video seen. No major gap is visible from the README, so it sits where its evidence and demo put it. |
| 67= | 72 | B | Health | [ethanplayer1211-spec/Handsay](https://github.com/ethanplayer1211-spec/Handsay) (#23) | Webcam ASL caption tool on an existing credited model. Held back by: no live demo link in the README; no demo video link seen. |
| 67= | 72 | B | Finance | [jagejagejage/veritas-ai-hackathon](https://github.com/jagejagejage/veritas-ai-hackathon) (#19) | CashSense live demo; judges must use a non-default branch; little eval. Held back by: no demo video link seen; few measured results shown. |
| 67= | 72 | B | Languages | [Harshal623/doseguard](https://github.com/Harshal623/doseguard) (#201) | Dosage translator self-check; names still placeholder. Held back by: Placeholder text is still in the write-up; no live demo link in the README. |
| 67= | 72 | B | Finance | [scuzziexz/send-home-safely](https://github.com/scuzziexz/send-home-safely) (#43) | Remittance true-cost tool; results present; no demo. Held back by: no demo video link seen. |
| 67= | 72 | B | Climate | [fr3ddykru3g3r/aircast-jaipur](https://github.com/fr3ddykru3g3r/aircast-jaipur) (#113) | Jaipur next-day air; live prototype; frozen models. Held back by: no demo video link seen. |
| 67= | 72 | B | Climate | [hansonliu20110617-lang/solarplan-hackathon](https://github.com/hansonliu20110617-lang/solarplan-hackathon) (#187) | Solar forecast + $ impact; 3 cities core, split study. Held back by: no live demo link in the README; no demo video link seen. |
| 67= | 72 | B | Climate | [Santosh-Krishna-Reddy/Veritas-AI-Project](https://github.com/Santosh-Krishna-Reddy/Veritas-AI-Project) (#18) | PJM carbon-intensity forecast + Next.js dashboard; no demo link. Held back by: no demo video link seen. |
| 67= | 72 | B | Languages | [SZH2008/METranslate](https://github.com/SZH2008/METranslate) (#116) | Translator trust test AR/UR; video; modest depth. Held back by: no live demo link in the README. |
| 76= | 70 | B | Finance | [t2101722-maker/markettwin-ai](https://github.com/t2101722-maker/markettwin-ai) (#133) | Portfolio co-movement for beginners; live demo. Held back by: no demo video link seen. |
| 76= | 70 | B | Finance | [ionnixf/Veritas](https://github.com/ionnixf/Veritas) (#218) | Shop cancellation reserve; offline demo vs fixed rule. Held back by: no demo video link seen; few measured results shown. |
| 76= | 70 | B | Languages | [TomasZitko/slysim-te](https://github.com/TomasZitko/slysim-te) (#175) | Same project as #54 (Utter) - duplicate repo of same team. Held back by: no live demo link in the README; no demo video link seen. |
| 76= | 70 | B | Climate | [emircolponbekov-create/Veritas-AI-Hack](https://github.com/emircolponbekov-create/Veritas-AI-Hack) (#92) | Nuclear cooling-water explorer; broad, light eval. Held back by: no live demo link in the README; no demo video link seen. |
| 76= | 70 | B | Climate | [DenisLazerko/vibesgpt](https://github.com/DenisLazerko/vibesgpt) (#71) | PNW smoke forecast; notebook only. Held back by: no live demo link in the README; no demo video link seen. |
| 81= | 68 | C | Health | [agzama-sketch/cardio-lens](https://github.com/agzama-sketch/cardio-lens) (#142) | Heart-disease explainable demo; classic dataset. Held back by: no demo video link seen. |
| 81= | 68 | C | Health | [shyaam-perumal/PneumoAI](https://github.com/shyaam-perumal/PneumoAI) (#76) | Chest X-ray classifier with login; educational. Held back by: no live demo link in the README; no demo video link seen. |
| 81= | 68 | C | Languages | [tentaciaa/veritas-language-identification](https://github.com/tentaciaa/veritas-language-identification) (#103) | 5-language ID for short messages; CLI. Held back by: no live demo link in the README; no demo video link seen. |
| 84= | 66 | C | Health | [kalpesh99/veritas-ai-hackathon-2026](https://github.com/kalpesh99/veritas-ai-hackathon-2026) (#21) | 24-topic search tool; navigation more than ML; catalog sprawl. Held back by: no demo video link seen. |
| 84= | 66 | C | Languages | [juniorvuong8/Veritas-AI-Hackathon](https://github.com/juniorvuong8/Veritas-AI-Hackathon) (#203) | Vocabulary city game, Lovable; light eval. Held back by: no demo video link seen. |
| 84= | 66 | C | Finance | [extraolive7737/VTAI-Hackathon.team.Extraolive](https://github.com/extraolive7737/VTAI-Hackathon.team.Extraolive) (#164) | Headline sentiment vs market; notebook. Held back by: no live demo link in the README; no demo video link seen. |
| 84= | 66 | C | Climate | [ImamaAhmad/HeatSafe-Lahore](https://github.com/ImamaAhmad/HeatSafe-Lahore) (#237) | Lahore heat-risk; metrics, no demo. Held back by: no demo video link seen. |
| 84= | 66 | C | Climate | [umerasif67/AirWave_Islamabad](https://github.com/umerasif67/AirWave_Islamabad) (#132) | Islamabad PM2.5 viewer; admits seasonal-feature limit. Held back by: no demo video link seen. |
| 89 | 65 | C | Health | [tpspingol-lab/IGNITE](https://github.com/tpspingol-lab/IGNITE) (#149) | IGNITE habit/nutrition app; benchmark text; unclear track. Held back by: no demo video link seen; few measured results shown. |
| 90= | 64 | C | Climate | [yars0634-arc/windward](https://github.com/yars0634-arc/windward) (#178) | Wind forecast turned into game; creative, thin eval. Held back by: no demo video link seen; few measured results shown. |
| 90= | 64 | C | Languages | [thorfinn071/TilSwitch-AI-Veritas](https://github.com/thorfinn071/TilSwitch-AI-Veritas) (#115) | Kazakh-Russian-English span marker; short. Held back by: no live demo link in the README; no demo video link seen. |
| 92= | 62 | C | Health | [erjanowitz-code/veritas-heart-risk-mvp](https://github.com/erjanowitz-code/veritas-heart-risk-mvp) (#242) | Heart-risk on 303 patients from 1988; team name placeholder. Held back by: Placeholder text is still in the write-up; no live demo link in the README. |
| 92= | 62 | C | Finance | [Hm2shifty/VeritasAIstockpredictor](https://github.com/Hm2shifty/VeritasAIstockpredictor) (#26) | FINIQ Streamlit with requirements checklist; little real result. Held back by: no live demo link in the README; no demo video link seen. |
| 92= | 62 | C | Finance | [sidsriv09/Sentrimix](https://github.com/sidsriv09/Sentrimix) (#80) | FinBERT headlines vs stocks; basic. Held back by: no live demo link in the README; no demo video link seen. |
| 92= | 62 | C | Finance | [bobo322322/veritas-antifraud-hackathon](https://github.com/bobo322322/veritas-antifraud-hackathon) (#171) | Cost-sensitive fraud threshold; standard approach. Held back by: no demo video link seen. |
| 92= | 62 | C | Health | [namitbattancoc-design/veritas-AI-hackathon-project](https://github.com/namitbattancoc-design/veritas-AI-hackathon-project) (#220) | Lab-report explainer; mostly concept. Held back by: no live demo link in the README; no demo video link seen. |
| 92= | 62 | C | Climate | [k-e-v-i-n-t-a-o/Veritas_AI_Hackathon_2026](https://github.com/k-e-v-i-n-t-a-o/Veritas_AI_Hackathon_2026) (#41) | Air Ahead; informal, light. Held back by: no live demo link in the README; no demo video link seen. |
| 92= | 62 | C | Health | [bhargavkulkarni01/Veritas_AI_Dyslexia_App](https://github.com/bhargavkulkarni01/Veritas_AI_Dyslexia_App) (#72) | Dyslexia reading game; no eval. Held back by: no demo video link seen; few measured results shown. |
| 92= | 62 | C | Finance | [ThomasTheGodSmith/veritas-council](https://github.com/ThomasTheGodSmith/veritas-council) (#165) | Council of from-scratch models; Claude writes report. Held back by: no live demo link in the README; no demo video link seen. |
| 100= | 58 | D | Health | [not-nag/veritas-data-engg](https://github.com/not-nag/veritas-data-engg) (#98) | Medical-report standardiser pipeline; solid engineering; unclear fit. Held back by: no live demo link in the README; no demo video link seen. |
| 100= | 58 | D | Finance | [matheason/news-vs-dow](https://github.com/matheason/news-vs-dow) (#200) | News vs Dow; data not in repo. Held back by: no live demo link in the README; no demo video link seen. |
| 102= | 55 | D | Health | [AmenShirega/Onedoor--Veritas-AI-hackathon](https://github.com/AmenShirega/Onedoor--Veritas-AI-hackathon) (#94) | OneDoor survivor support web platform; no ML evidence; duplicate of 102. Held back by: no live demo link in the README; no demo video link seen. |
| 102= | 55 | D | Health | [shiva-dev-229/Veritas-Hackathon](https://github.com/shiva-dev-229/Veritas-Hackathon) (#136) | Parkinson keystroke LSTM; no results shown. Held back by: no live demo link in the README; no demo video link seen. |
| 104= | 50 | D | Health | [erjanowitz-code/veritas-health-hackathon](https://github.com/erjanowitz-code/veritas-health-hackathon) (#258) | Short README, heart/health; little visible. Held back by: no live demo link in the README; no demo video link seen. |
| 104= | 50 | D | Health | [ElijahBurkeDev/Oasis](https://github.com/ElijahBurkeDev/Oasis) (#61) | LLM mood harness; light results. Held back by: no live demo link in the README; no demo video link seen. |
| 106= | 40 | D | Health | [swingcheck/Veritas-Challenge](https://github.com/swingcheck/Veritas-Challenge) (#210) | Template unfilled: TODOs for team and numbers. Held back by: Placeholder text is still in the write-up; no live demo link in the README. |
| 106= | 40 | D | Languages | [KnXper7/veritas-ai-hackathon](https://github.com/KnXper7/veritas-ai-hackathon) (#7) | Mixed Signals: draft, every TODO still open. Held back by: Placeholder text is still in the write-up; no live demo link in the README. |
| 106= | 40 | D | ? | [rong-jason-0908/jasonrong_veritas_ai_hackathon](https://github.com/rong-jason-0908/jasonrong_veritas_ai_hackathon) (#63) | Short README. Held back by: no live demo link in the README; no demo video link seen. |
| 106= | 40 | D | Health | [nebyoujantirar-glitch/Onedoor--Veritas-AI-hackathon-main](https://github.com/nebyoujantirar-glitch/Onedoor--Veritas-AI-hackathon-main) (#102) | Copy of #94. Held back by: no live demo link in the README; no demo video link seen. |
| 106= | 40 | D | Finance | [umar20-web/scamshield-ai-hackathon](https://github.com/umar20-web/scamshield-ai-hackathon) (#183) | Short README (ScamShield). Held back by: no live demo link in the README; no demo video link seen. |
| 111 | 35 | F | ? | [mahashri142010/MeaningGuard-VeritasAI-2026](https://github.com/mahashri142010/MeaningGuard-VeritasAI-2026) (#129) | Stub README. Held back by: no live demo link in the README; no demo video link seen. |
| 112= | 30 | F | ? | [andy101bk/Veritas-AI-Hackathon](https://github.com/andy101bk/Veritas-AI-Hackathon) (#118) | Stub README. Held back by: no live demo link in the README; no demo video link seen. |
| 112= | 30 | F | ? | [ArNam8/NoShow](https://github.com/ArNam8/NoShow) (#138) | Stub README (NoShow). Held back by: no live demo link in the README; no demo video link seen. |
| 112= | 30 | F | Health | [anBardo/Veritas-Hackathon-afm-outbreak-risk-model](https://github.com/anBardo/Veritas-Hackathon-afm-outbreak-risk-model) (#139) | Stub README (AFM outbreak model). Held back by: no live demo link in the README; no demo video link seen. |
| 115 | 25 | F | ? | [yoan-hristov/veritas-26-yh-submission](https://github.com/yoan-hristov/veritas-26-yh-submission) (#137) | Stub README. Held back by: no live demo link in the README; no demo video link seen. |

**Read on the field**
- Strongest clusters: **Languages / accessibility** (Utter, Verbatim, Lsir, Qalaisyn, Senim) and **Health with external validation** (Roshni, BleedCheck, Sentinel). These pair a real affected user, an honest held-out test and a working demo or video.
- Climate is crowded: at least 11 next-day PM2.5 / smoke projects (the suggested brief 4.3.2). Ours is the **only drought/canal one** I saw, which is a differentiator. Saqshy, Rosafe and The Day After are the climate entries to beat.
- Likely duplicates or same-team double entries: #54 and #175 (Utter), #94 and #102 (OneDoor), #114 and #160, #190/#191 pair, #268/#269, #230 and #155.

## Not scored (183 repos)
Not Veritas hackathon entries, duplicates, empty, or too short to grade.

| # | Repo | Reason |
|---|---|---|
| 1 | [Kmjndv/Respira-Veritas-AI-Hackathon-](https://github.com/Kmjndv/Respira-Veritas-AI-Hackathon-) | Stub README (182 chars), nothing to grade |
| 3 | [godfathershit018326/veritas](https://github.com/godfathershit018326/veritas) | Other project |
| 4 | [oleglegkunets/Veritas-AI-Competition-2026](https://github.com/oleglegkunets/Veritas-AI-Competition-2026) | No README retrievable (private, empty, or no readme) |
| 8 | [uchijimatheloml-dev/VERITAS](https://github.com/uchijimatheloml-dev/VERITAS) | No README retrievable (private, empty, or no readme) |
| 11 | [ferreirajacicley7-cpu/tartarium-ai-core](https://github.com/ferreirajacicley7-cpu/tartarium-ai-core) | Other project: Portuguese textual AI box |
| 12 | [nagarjunak-pixel/veritas-rl](https://github.com/nagarjunak-pixel/veritas-rl) | Other: RL post-training reference impl (strong engineering, not an entry) |
| 22 | [garciaraymond689-boop/DeepBet](https://github.com/garciaraymond689-boop/DeepBet) | Other event: Hawaii Innovation Challenge |
| 24 | [NQV4X0QN/VeritasUI](https://github.com/NQV4X0QN/VeritasUI) | Other: WoW addon |
| 25 | [juancruz85/48-to-none-backend](https://github.com/juancruz85/48-to-none-backend) | Other: fraud dashboard backend (AWS) |
| 27 | [ChipmunkRPA/veritas](https://github.com/ChipmunkRPA/veritas) | Other: commercial image-forensics product |
| 31 | [juancruz85/48-to-none-frontend](https://github.com/juancruz85/48-to-none-frontend) | Other: fraud dashboard frontend |
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
| 66 | [wavedance1969-arch/VeritasAtmo](https://github.com/wavedance1969-arch/VeritasAtmo) | No README retrievable (private, empty, or no readme) |
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
| 107 | [annatalia-w/ThamaniKE](https://github.com/annatalia-w/ThamaniKE) | No README retrievable (private, empty, or no readme) |
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
| 189 | [GD-root/Veritas-in-Caritate](https://github.com/GD-root/Veritas-in-Caritate) | Stub README (47 chars), nothing to grade |
| 190 | [27-GROUP/kveritas-releases](https://github.com/27-GROUP/kveritas-releases) | Not an entry: K-Veritas binaries |
| 191 | [27-GROUP/kveritas-go](https://github.com/27-GROUP/kveritas-go) | Not an entry: K-Veritas crypto CLI |
| 192 | [Kiasha9229/veritas_ai_finance](https://github.com/Kiasha9229/veritas_ai_finance) | Stub README (20 chars), nothing to grade |
| 193 | [nnautomator-debug/Veritas-AI-Hackathon-Project-Backend](https://github.com/nnautomator-debug/Veritas-AI-Hackathon-Project-Backend) | No README retrievable (private, empty, or no readme) |
| 194 | [ArqishZaria/veritas](https://github.com/ArqishZaria/veritas) | No README retrievable (private, empty, or no readme) |
| 195 | [unb-mds/2026-2-VeritasIA](https://github.com/unb-mds/2026-2-VeritasIA) | Course project (UnB) |
| 196 | [adamgalon/veritass](https://github.com/adamgalon/veritass) | Stub README (375 chars), nothing to grade |
| 197 | [VeritasRiskEngine/VeritasRiskEngine](https://github.com/VeritasRiskEngine/VeritasRiskEngine) | Not an entry: GRC marketing |
| 198 | [FuzzDOT/VERITAS](https://github.com/FuzzDOT/VERITAS) | Other: solvency engine |
| 199 | [Mthwane/Veritas](https://github.com/Mthwane/Veritas) | Other: .NET data platform |
| 202 | [harvard-huit/hapi-veritas-cli](https://github.com/harvard-huit/hapi-veritas-cli) | Not an entry: Harvard HUIT CLI |
| 204 | [WardenOfTheCove/VanSolar](https://github.com/WardenOfTheCove/VanSolar) | Stub README (186 chars), nothing to grade |
| 205 | [veritaslock/veritaslock-cli](https://github.com/veritaslock/veritaslock-cli) | Not an entry: VeritasLock CLI |
| 206 | [gunturborneo31/veritas](https://github.com/gunturborneo31/veritas) | Not an entry: stock Laravel |
| 208 | [gpereiradeveloper-rgb/Harvard-Project-site-with-3d-Animation](https://github.com/gpereiradeveloper-rgb/Harvard-Project-site-with-3d-Animation) | Other: 3D site |
| 209 | [dylp1ckle11/veritas](https://github.com/dylp1ckle11/veritas) | No README retrievable (private, empty, or no readme) |
| 211 | [Emediong-Etuk/veritasclaim](https://github.com/Emediong-Etuk/veritasclaim) | Stub README (148 chars), nothing to grade |
| 212 | [ElKruegger/VeritasBackEnd](https://github.com/ElKruegger/VeritasBackEnd) | Other: e-commerce backend |
| 213 | [suares13/veritas-gem](https://github.com/suares13/veritas-gem) | Other: Gemini security tool |
| 214 | [amrutasahu2006/VeritasAI-GenAI](https://github.com/amrutasahu2006/VeritasAI-GenAI) | No README retrievable (private, empty, or no readme) |
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
| 255 | [Syed487/Veritas-AI-Hackathon](https://github.com/Syed487/Veritas-AI-Hackathon) | Stub README (47 chars), nothing to grade |
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
