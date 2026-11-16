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
- Of the 115: A 11, B+ 35, B 34, C 19, D 11, F 5.

## Our grade: RioIQ (#10): **84, B+ (top cluster, roughly rank 10-15 of 115)**
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

## Who we are actually competing with (top 30, README-based)
| Rank | # | Repo | Track | Score | Why (README-level) |
|---|---|---|---|---|---|

| 1 | 54 | [TomasZitko/utter](https://github.com/TomasZitko/utter) | Languages | 88 (A) | Dysarthria voice control; app, video, held-out tests on dysarthric speech; polished |
| 2 | 77 | [MACVXACE/roshni](https://github.com/MACVXACE/roshni) | Health | 87 (A) | Offline diabetic-eye triage; AUC 0.911 on unseen hospitals; clinic-level cutoff insight; live demo |
| 3 | 51 | [brandonlign/verbatim](https://github.com/brandonlign/verbatim) | Languages | 86 (A) | Whisper code-switch failures quantified; demo+video; honest results section |
| 4 | 159 | [davie2009kh/lsir](https://github.com/davie2009kh/lsir) | Languages | 86 (A) | Armenian ASR LoRA; HF Space + model + video + report; WER tables |
| 5 | 170 | [dede-bebe-lele/saqshy](https://github.com/dede-bebe-lele/saqshy) | Climate | 86 (A) | Kazakhstan wildfire risk; notebook, live site, video; many metrics |
| 6 | 29 | [jacob-gorny/rosafe](https://github.com/jacob-gorny/rosafe) | Climate | 85 (A) | 855 DFW roads daily danger score + iPhone app; tests which inputs help |
| 7 | 56 | [kabirshah4/race-blind-isnt-fair](https://github.com/kabirshah4/race-blind-isnt-fair) | Finance | 85 (A) | Mortgage fairness on real HMDA data; "3x" headline is striking; live demo+video |
| 8 | 60 | [aarishasifkhan/veritas-hackathon-2026](https://github.com/aarishasifkhan/veritas-hackathon-2026) | Health | 85 (A) | Head-CT bleed vs ischemia; live demo, video, Kaggle notebook, failure section |
| 9 | 110 | [ZemBono/qalaisyn](https://github.com/ZemBono/qalaisyn) | Languages | 85 (A) | Kazakh text normalisation engine; embeds in other sites; demo+video; reproducible |
| 10 | 119 | [Mr-CEO-cloud/the-day-after](https://github.com/Mr-CEO-cloud/the-day-after) | Climate | 85 (A) | Gaza farmland recovery vs UN damage maps; HF Space; "how I kept it honest" |
| 11 | 10 | [samrramos1316-art/RioIQ-Drought-and-Canal-Planner](https://github.com/samrramos1316-art/RioIQ-Drought-and-Canal-Planner) | Climate | 84 (B+) | OURS. Frozen held-out tests, CI on 3 OSes, live site; but mostly ties, leak model unvalidated, video link missing |
| 12 | 13 | [Mika1904/sentinel](https://github.com/Mika1904/sentinel) | Health | 84 (B+) | Cancer-drug response ranking; live app, 2-min video, write-up |
| 13 | 109 | [arturbaimuratov1-sys/senim](https://github.com/arturbaimuratov1-sys/senim) | Languages | 84 (B+) | Kazakh translator warns on serious errors (6/8 vs 0 baseline); demo video |
| 14 | 9 | [godtier812/veritashackathon](https://github.com/godtier812/veritashackathon) | Health | 82 (B+) | BRCA1 variant model; honest 94.4%/437-of-899 tradeoff; team name left blank |
| 15 | 14 | [mofe-stack/say-so](https://github.com/mofe-stack/say-so) | Health | 82 (B+) | Confidence-gated dysarthric word recognition; demo site + notebook |
| 16 | 45 | [arshkudariya/Glacial-Lake-Watch-Veritas-Hackaton-Project---2026](https://github.com/arshkudariya/Glacial-Lake-Watch-Veritas-Hackaton-Project---2026) | Climate | 82 (B+) | Glacial lake mapping from satellite; baselines, unseen lakes; no demo |
| 17 | 100 | [u7po00/bishkek-smog-alert](https://github.com/u7po00/bishkek-smog-alert) | Climate | 82 (B+) | Bishkek PM2.5 forecast, trilingual alerts, tests inversion hypothesis; Colab + page |
| 18 | 135 | [dicsio100-dev/who-pays-for-the-correction](https://github.com/dicsio100-dev/who-pays-for-the-correction) | Languages | 82 (B+) | ASR fairness audit; African-accented callers asked to repeat more; interactive page |
| 19 | 244 | [curry06240624-dev/mother-tongue-detector](https://github.com/curry06240624-dev/mother-tongue-detector) | Languages | 82 (B+) | Hakka/Hokkien/Mandarin detector; beats langdetect; demo |
| 20 | 42 | [BHSVeritasHackathon26/VeritasHackathon26](https://github.com/BHSVeritasHackathon26/VeritasHackathon26) | Languages | 81 (B+) | Neural-data speech decoding, 13.7% PER; demo app; no live link in README |
| 21 | 6 | [adeviwon/hypecheck](https://github.com/adeviwon/hypecheck) | Finance | 80 (B+) | Memecoin sentiment, in-browser model, honest held-out scores |
| 22 | 15 | [Jarvis21stCentury/DiabetesCheck](https://github.com/Jarvis21stCentury/DiabetesCheck) | Health | 80 (B+) | 8-question diabetes screen; 50,736-adult test set; live site; limitations |
| 23 | 17 | [armaan-khoja/clear-voice](https://github.com/armaan-khoja/clear-voice) | Languages | 80 (B+) | Dysarthria recognition on TORGO; heavy metrics; non-commercial data licence; no demo |
| 24 | 20 | [proelium27/veritas-ai-hackathon](https://github.com/proelium27/veritas-ai-hackathon) | Languages | 80 (B+) | Mandarin to Serbian gender/politeness; Colab; "where it fails" |
| 25 | 28 | [mirmoosa1014-rgb/VitalSign](https://github.com/mirmoosa1014-rgb/VitalSign) | Health | 80 (B+) | ER sign-to-speech intake; signer cross-validation; no live demo |
| 26 | 30 | [blueslick/Veritas-AI-Hackathon-](https://github.com/blueslick/Veritas-AI-Hackathon-) | Health | 80 (B+) | Handover: merges 3 hospitals' records with quote provenance and conflict display; live app; synthetic patients |
| 27 | 35 | [rohanhariharan/dose](https://github.com/rohanhariharan/dose) | Health | 80 (B+) | Medication label reader, local-first, demo video, tests; light on ML eval |
| 28 | 44 | [CartHadash/Veritas-AI-mouse-tracker](https://github.com/CartHadash/Veritas-AI-mouse-tracker) | Health | 80 (B+) | Parkinson tremor detect+correct models; many metrics; no demo |
| 29 | 73 | [ahblxz/NEXTQUESTION-Veritas-2026](https://github.com/ahblxz/NEXTQUESTION-Veritas-2026) | Health | 80 (B+) | Adaptive diagnostic questioning; synthetic and real pilots kept separate |
| 30 | 111 | [sushixodev/following-dirty-money](https://github.com/sushixodev/following-dirty-money) | Finance | 80 (B+) | Bitcoin AML GNN + drift detection; notebook + app |

**Read on the field**
- Strongest clusters: **Languages / accessibility** (Utter, Verbatim, Lsir, Qalaisyn, Senim) and **Health with external validation** (Roshni, BleedCheck, Sentinel). These pair a real affected user, an honest held-out test and a working demo or video.
- Climate is crowded: at least 11 next-day PM2.5 / smoke projects (the suggested brief 4.3.2). Ours is the **only drought/canal one** I saw, which is a differentiator. Saqshy, Rosafe and The Day After are the climate entries to beat.
- Likely duplicates or same-team double entries: #54 and #175 (Utter), #94 and #102 (OneDoor), #114 and #160, #190/#191 pair, #268/#269, #230 and #155.

## Full list (all 298)
Score = my README-based grade. Blank score = not scored (reason given).

| # | Repo | Track | Score | Grade | Note |
|---|---|---|---|---|---|

| 1 | [Kmjndv/Respira-Veritas-AI-Hackathon-](https://github.com/Kmjndv/Respira-Veritas-AI-Hackathon-) |  |  |  | Stub README (182 chars), nothing to grade |
| 2 | [Riyadua777/pneumotype](https://github.com/Riyadua777/pneumotype) | Health | 78 | B+ | Pneumonia CNN from scratch + federated learning + refer option; headline 97% is recall-style; no demo; team placeholder |
| 3 | [godfathershit018326/veritas](https://github.com/godfathershit018326/veritas) |  |  |  | Other project |
| 4 | [oleglegkunets/Veritas-AI-Competition-2026](https://github.com/oleglegkunets/Veritas-AI-Competition-2026) |  |  |  | No README retrievable (private, empty, or no readme) |
| 5 | [StanleyChanH/VoiceVeritas](https://github.com/StanleyChanH/VoiceVeritas) | (other) | 75 | B | Polished open-source read-speech detector; reads as independent project, not a labelled entry |
| 6 | [adeviwon/hypecheck](https://github.com/adeviwon/hypecheck) | Finance | 80 | B+ | Memecoin sentiment, in-browser model, honest held-out scores |
| 7 | [KnXper7/veritas-ai-hackathon](https://github.com/KnXper7/veritas-ai-hackathon) | Languages | 40 | D | Mixed Signals: draft, every TODO still open |
| 8 | [uchijimatheloml-dev/VERITAS](https://github.com/uchijimatheloml-dev/VERITAS) |  |  |  | No README retrievable (private, empty, or no readme) |
| 9 | [godtier812/veritashackathon](https://github.com/godtier812/veritashackathon) | Health | 82 | B+ | BRCA1 variant model; honest 94.4%/437-of-899 tradeoff; team name left blank |
| 10 | [samrramos1316-art/RioIQ-Drought-and-Canal-Planner](https://github.com/samrramos1316-art/RioIQ-Drought-and-Canal-Planner) | Climate | 84 | B+ | OURS. Frozen held-out tests, CI on 3 OSes, live site; but mostly ties, leak model unvalidated, video link missing |
| 11 | [ferreirajacicley7-cpu/tartarium-ai-core](https://github.com/ferreirajacicley7-cpu/tartarium-ai-core) |  |  |  | Other project: Portuguese textual AI box |
| 12 | [nagarjunak-pixel/veritas-rl](https://github.com/nagarjunak-pixel/veritas-rl) |  |  |  | Other: RL post-training reference impl (strong engineering, not an entry) |
| 13 | [Mika1904/sentinel](https://github.com/Mika1904/sentinel) | Health | 84 | B+ | Cancer-drug response ranking; live app, 2-min video, write-up |
| 14 | [mofe-stack/say-so](https://github.com/mofe-stack/say-so) | Health | 82 | B+ | Confidence-gated dysarthric word recognition; demo site + notebook |
| 15 | [Jarvis21stCentury/DiabetesCheck](https://github.com/Jarvis21stCentury/DiabetesCheck) | Health | 80 | B+ | 8-question diabetes screen; 50,736-adult test set; live site; limitations |
| 16 | [bejenaru1/zbor-lav](https://github.com/bejenaru1/zbor-lav) | Languages | 78 | B+ | Aromanian/Romani helpers for Romanian readers; live site; low-resource |
| 17 | [armaan-khoja/clear-voice](https://github.com/armaan-khoja/clear-voice) | Languages | 80 | B+ | Dysarthria recognition on TORGO; heavy metrics; non-commercial data licence; no demo |
| 18 | [Santosh-Krishna-Reddy/Veritas-AI-Project](https://github.com/Santosh-Krishna-Reddy/Veritas-AI-Project) | Climate | 72 | B | PJM carbon-intensity forecast + Next.js dashboard; no demo link |
| 19 | [jagejagejage/veritas-ai-hackathon](https://github.com/jagejagejage/veritas-ai-hackathon) | Finance | 72 | B | CashSense live demo; judges must use a non-default branch; little eval |
| 20 | [proelium27/veritas-ai-hackathon](https://github.com/proelium27/veritas-ai-hackathon) | Languages | 80 | B+ | Mandarin to Serbian gender/politeness; Colab; "where it fails" |
| 21 | [kalpesh99/veritas-ai-hackathon-2026](https://github.com/kalpesh99/veritas-ai-hackathon-2026) | Health | 66 | C | 24-topic search tool; navigation more than ML; catalog sprawl |
| 22 | [garciaraymond689-boop/DeepBet](https://github.com/garciaraymond689-boop/DeepBet) |  |  |  | Other event: Hawaii Innovation Challenge |
| 23 | [ethanplayer1211-spec/Handsay](https://github.com/ethanplayer1211-spec/Handsay) | Health | 72 | B | Webcam ASL caption tool on an existing credited model |
| 24 | [NQV4X0QN/VeritasUI](https://github.com/NQV4X0QN/VeritasUI) |  |  |  | Other: WoW addon |
| 25 | [juancruz85/48-to-none-backend](https://github.com/juancruz85/48-to-none-backend) |  |  |  | Other: fraud dashboard backend (AWS) |
| 26 | [Hm2shifty/VeritasAIstockpredictor](https://github.com/Hm2shifty/VeritasAIstockpredictor) | Finance | 62 | C | FINIQ Streamlit with requirements checklist; little real result |
| 27 | [ChipmunkRPA/veritas](https://github.com/ChipmunkRPA/veritas) |  |  |  | Other: commercial image-forensics product |
| 28 | [mirmoosa1014-rgb/VitalSign](https://github.com/mirmoosa1014-rgb/VitalSign) | Health | 80 | B+ | ER sign-to-speech intake; signer cross-validation; no live demo |
| 29 | [jacob-gorny/rosafe](https://github.com/jacob-gorny/rosafe) | Climate | 85 | A | 855 DFW roads daily danger score + iPhone app; tests which inputs help |
| 30 | [blueslick/Veritas-AI-Hackathon-](https://github.com/blueslick/Veritas-AI-Hackathon-) | Health | 80 | B+ | Handover: merges 3 hospitals' records with quote provenance and conflict display; live app; synthetic patients |
| 31 | [juancruz85/48-to-none-frontend](https://github.com/juancruz85/48-to-none-frontend) |  |  |  | Other: fraud dashboard frontend |
| 32 | [seanpategan/VeritasHackathon](https://github.com/seanpategan/VeritasHackathon) | Climate | 78 | B+ | FieldWise crop map + AI audit; video, test; LLM-explanation heavy, light model eval |
| 33 | [mav40121/veritas-lab-services](https://github.com/mav40121/veritas-lab-services) |  |  |  | No README retrievable (private, empty, or no readme) |
| 34 | [JohnPoole3rd/veritas](https://github.com/JohnPoole3rd/veritas) | Climate | 78 | B+ | Satellite-text alignment (Procrustes); original idea; write-up/submission still pending |
| 35 | [rohanhariharan/dose](https://github.com/rohanhariharan/dose) | Health | 80 | B+ | Medication label reader, local-first, demo video, tests; light on ML eval |
| 36 | [depr3y/veritasbaseballindex](https://github.com/depr3y/veritasbaseballindex) |  |  |  | No README retrievable (private, empty, or no readme) |
| 37 | [chillstudio-dev/Noticioner-AI](https://github.com/chillstudio-dev/Noticioner-AI) | Health | 74 | B | Clinician SOAP drafting with trust checks; synthetic only, no clinical validation |
| 38 | [NOCTE-oss/veritas-biblioteca](https://github.com/NOCTE-oss/veritas-biblioteca) |  |  |  | Course project: Vue bookstore |
| 39 | [TaranAzrot-13/air-quality-forecast-milan](https://github.com/TaranAzrot-13/air-quality-forecast-milan) | Climate | 76 | B | Milan next-day PM2.5; video; baseline results; modest depth |
| 40 | [auctacius/utkarshpearl](https://github.com/auctacius/utkarshpearl) |  |  |  | No README retrievable (private, empty, or no readme) |
| 41 | [k-e-v-i-n-t-a-o/Veritas_AI_Hackathon_2026](https://github.com/k-e-v-i-n-t-a-o/Veritas_AI_Hackathon_2026) | Climate | 62 | C | Air Ahead; informal, light |
| 42 | [BHSVeritasHackathon26/VeritasHackathon26](https://github.com/BHSVeritasHackathon26/VeritasHackathon26) | Languages | 81 | B+ | Neural-data speech decoding, 13.7% PER; demo app; no live link in README |
| 43 | [scuzziexz/send-home-safely](https://github.com/scuzziexz/send-home-safely) | Finance | 72 | B | Remittance true-cost tool; results present; no demo |
| 44 | [CartHadash/Veritas-AI-mouse-tracker](https://github.com/CartHadash/Veritas-AI-mouse-tracker) | Health | 80 | B+ | Parkinson tremor detect+correct models; many metrics; no demo |
| 45 | [arshkudariya/Glacial-Lake-Watch-Veritas-Hackaton-Project---2026](https://github.com/arshkudariya/Glacial-Lake-Watch-Veritas-Hackaton-Project---2026) | Climate | 82 | B+ | Glacial lake mapping from satellite; baselines, unseen lakes; no demo |
| 46 | [IceVeritas/GigaVeritas-Digital-Evidence-Framework](https://github.com/IceVeritas/GigaVeritas-Digital-Evidence-Framework) |  |  |  | Not an entry: evidence toolkit |
| 47 | [IceVeritas/IceVeritas-Data-TIR-FR](https://github.com/IceVeritas/IceVeritas-Data-TIR-FR) |  |  |  | Not an entry: OSINT HGV research |
| 48 | [seanieM3132/veritas-status](https://github.com/seanieM3132/veritas-status) |  |  |  | No README retrievable (private, empty, or no readme) |
| 49 | [nicolehysi8/Veritas](https://github.com/nicolehysi8/Veritas) |  |  |  | No README retrievable (private, empty, or no readme) |
| 50 | [Anish-Dharurkar/Veritas-AI---Portfolio-Management](https://github.com/Anish-Dharurkar/Veritas-AI---Portfolio-Management) |  |  |  | No README retrievable (private, empty, or no readme) |
| 51 | [brandonlign/verbatim](https://github.com/brandonlign/verbatim) | Languages | 86 | A | Whisper code-switch failures quantified; demo+video; honest results section |
| 52 | [adriaansaeez/veritas-live](https://github.com/adriaansaeez/veritas-live) |  |  |  | Other: debate fact-checker, no hackathon label |
| 53 | [paladin120702/desafio-fullstack-veritas](https://github.com/paladin120702/desafio-fullstack-veritas) |  |  |  | Course challenge: Go kanban |
| 54 | [TomasZitko/utter](https://github.com/TomasZitko/utter) | Languages | 88 | A | Dysarthria voice control; app, video, held-out tests on dysarthric speech; polished |
| 55 | [dxianto8/dx-hackathon-veritas](https://github.com/dxianto8/dx-hackathon-veritas) | Finance | 74 | B | Multilingual scam-text checker as phone app; team name left as placeholder |
| 56 | [kabirshah4/race-blind-isnt-fair](https://github.com/kabirshah4/race-blind-isnt-fair) | Finance | 85 | A | Mortgage fairness on real HMDA data; "3x" headline is striking; live demo+video |
| 57 | [veritasquaesitorcai/veritas-quaesitor](https://github.com/veritasquaesitorcai/veritas-quaesitor) |  |  |  | Stub README (22 chars), nothing to grade |
| 58 | [TASRUNNER2010/Hackathon](https://github.com/TASRUNNER2010/Hackathon) |  |  |  | No README retrievable (private, empty, or no readme) |
| 59 | [AIGsniperYt/veritas_ai_hackathon](https://github.com/AIGsniperYt/veritas_ai_hackathon) |  |  |  | No README retrievable (private, empty, or no readme) |
| 60 | [aarishasifkhan/veritas-hackathon-2026](https://github.com/aarishasifkhan/veritas-hackathon-2026) | Health | 85 | A | Head-CT bleed vs ischemia; live demo, video, Kaggle notebook, failure section |
| 61 | [ElijahBurkeDev/Oasis](https://github.com/ElijahBurkeDev/Oasis) | Health | 50 | D | LLM mood harness; light results |
| 62 | [hzeng101118/veritasai](https://github.com/hzeng101118/veritasai) |  |  |  | Stub README (11 chars), nothing to grade |
| 63 | [rong-jason-0908/jasonrong_veritas_ai_hackathon](https://github.com/rong-jason-0908/jasonrong_veritas_ai_hackathon) | ? | 40 | D | Short README |
| 64 | [smoeberg/EiraOS](https://github.com/smoeberg/EiraOS) |  |  |  | Other: EiraOS Danish OS design |
| 65 | [Mebay821/health-hackathon-project](https://github.com/Mebay821/health-hackathon-project) | Health | 78 | B+ | Ethiopia HEW glucose-test triage; 4 routine inputs; metrics |
| 66 | [wavedance1969-arch/VeritasAtmo](https://github.com/wavedance1969-arch/VeritasAtmo) |  |  |  | No README retrievable (private, empty, or no readme) |
| 67 | [HarlequinCS/Veritas_Payloads](https://github.com/HarlequinCS/Veritas_Payloads) |  |  |  | Other: OWASP payload dataset |
| 68 | [RBKunnela/veritas-framework](https://github.com/RBKunnela/veritas-framework) |  |  |  | Other: agent-trust framework |
| 69 | [Newsrize/veritass](https://github.com/Newsrize/veritass) |  |  |  | Stub README (10 chars), nothing to grade |
| 70 | [nashwu0117/SolarCast-Lite](https://github.com/nashwu0117/SolarCast-Lite) | Climate | 78 | B+ | SolarCast NZ map forecast, EN/zh docs, live site, MIT |
| 71 | [DenisLazerko/vibesgpt](https://github.com/DenisLazerko/vibesgpt) | Climate | 70 | B | PNW smoke forecast; notebook only |
| 72 | [bhargavkulkarni01/Veritas_AI_Dyslexia_App](https://github.com/bhargavkulkarni01/Veritas_AI_Dyslexia_App) | Health | 62 | C | Dyslexia reading game; no eval |
| 73 | [ahblxz/NEXTQUESTION-Veritas-2026](https://github.com/ahblxz/NEXTQUESTION-Veritas-2026) | Health | 80 | B+ | Adaptive diagnostic questioning; synthetic and real pilots kept separate |
| 74 | [j4ck4L0up3/veritas](https://github.com/j4ck4L0up3/veritas) |  |  |  | Stub README (10 chars), nothing to grade |
| 75 | [magal-dev/veritas-ai](https://github.com/magal-dev/veritas-ai) |  |  |  | Other: Brazilian TCC |
| 76 | [shyaam-perumal/PneumoAI](https://github.com/shyaam-perumal/PneumoAI) | Health | 68 | C | Chest X-ray classifier with login; educational |
| 77 | [MACVXACE/roshni](https://github.com/MACVXACE/roshni) | Health | 87 | A | Offline diabetic-eye triage; AUC 0.911 on unseen hospitals; clinic-level cutoff insight; live demo |
| 78 | [resurgances/accent-gap](https://github.com/resurgances/accent-gap) | Languages | 78 | B+ | Sindhi-accented ASR gap; video; every number traced to a file |
| 79 | [mavrinlabs-prog/MarkupCheck](https://github.com/mavrinlabs-prog/MarkupCheck) | Finance | 78 | B+ | Auto-loan markup check; stress-tested verdict; no demo |
| 80 | [sidsriv09/Sentrimix](https://github.com/sidsriv09/Sentrimix) | Finance | 62 | C | FinBERT headlines vs stocks; basic |
| 81 | [ConnorWolff0/veritas-cloud-monitor](https://github.com/ConnorWolff0/veritas-cloud-monitor) |  |  |  | Other: site monitor |
| 82 | [WamblyLA/VeritasAIHackathon](https://github.com/WamblyLA/VeritasAIHackathon) | Climate | 72 | B | PM2.5 gap reconstruction + maintenance ranking; no demo/video seen |
| 83 | [agastyamittal/VeritasAIHackathon](https://github.com/agastyamittal/VeritasAIHackathon) |  |  |  | Unlabelled: AEROFORM 3D viewer (inventive, off-track) |
| 84 | [Mahyarrk/project-veritas](https://github.com/Mahyarrk/project-veritas) |  |  |  | Unlabelled: stats auditor for papers (smart, validated on own thesis) |
| 85 | [jmunies30/Veritas-AI-Hackathon](https://github.com/jmunies30/Veritas-AI-Hackathon) |  |  |  | No README retrievable (private, empty, or no readme) |
| 86 | [C-Nietzschmann/veritas-hackathon](https://github.com/C-Nietzschmann/veritas-hackathon) | Finance | 78 | B+ | Insolvent-director matcher on Companies House; scored matches |
| 87 | [josejorge/josejorge](https://github.com/josejorge/josejorge) |  |  |  | Not a project: profile README |
| 88 | [hiteacheryouare/veritas](https://github.com/hiteacheryouare/veritas) |  |  |  | No README retrievable (private, empty, or no readme) |
| 89 | [kevinbato767-sudo/Veritas-Backup-Exec-Guide](https://github.com/kevinbato767-sudo/Veritas-Backup-Exec-Guide) |  |  |  | NOT a hackathon entry: Veritas Backup Exec guide |
| 90 | [ChristianMangwanda/veritas-research-radar](https://github.com/ChristianMangwanda/veritas-research-radar) |  |  |  | Other: visa-eligibility extension |
| 91 | [NTinkicht/veritas-atlas](https://github.com/NTinkicht/veritas-atlas) |  |  |  | Other: .NET platform |
| 92 | [emircolponbekov-create/Veritas-AI-Hack](https://github.com/emircolponbekov-create/Veritas-AI-Hack) | Climate | 70 | B | Nuclear cooling-water explorer; broad, light eval |
| 93 | [Cxsmxnaut/heart-echo](https://github.com/Cxsmxnaut/heart-echo) | Health | 76 | B | Heart-sound iPhone app v0.4.1; strong engineering, thin measurement |
| 94 | [AmenShirega/Onedoor--Veritas-AI-hackathon](https://github.com/AmenShirega/Onedoor--Veritas-AI-hackathon) | Health | 55 | D | OneDoor survivor support web platform; no ML evidence; duplicate of 102 |
| 95 | [ChaiTravelTeam/airline-directory](https://github.com/ChaiTravelTeam/airline-directory) |  |  |  | Empty |
| 96 | [mehmetcankatar/NeuroScope_VeritasAI](https://github.com/mehmetcankatar/NeuroScope_VeritasAI) |  |  |  | Stub README (22 chars), nothing to grade |
| 97 | [vikram-saraswatula/veritasEEpipeline](https://github.com/vikram-saraswatula/veritasEEpipeline) |  |  |  | No README retrievable (private, empty, or no readme) |
| 98 | [not-nag/veritas-data-engg](https://github.com/not-nag/veritas-data-engg) | Health | 58 | D | Medical-report standardiser pipeline; solid engineering; unclear fit |
| 99 | [Saikrishna0817/Veritas](https://github.com/Saikrishna0817/Veritas) |  |  |  | Other event: SDG hackathon |
| 100 | [u7po00/bishkek-smog-alert](https://github.com/u7po00/bishkek-smog-alert) | Climate | 82 | B+ | Bishkek PM2.5 forecast, trilingual alerts, tests inversion hypothesis; Colab + page |
| 101 | [Hibakupoxzz/VERITAS](https://github.com/Hibakupoxzz/VERITAS) |  |  |  | Not an entry: stock Laravel |
| 102 | [nebyoujantirar-glitch/Onedoor--Veritas-AI-hackathon-main](https://github.com/nebyoujantirar-glitch/Onedoor--Veritas-AI-hackathon-main) | Health | 40 | D | Copy of #94 |
| 103 | [tentaciaa/veritas-language-identification](https://github.com/tentaciaa/veritas-language-identification) | Languages | 68 | C | 5-language ID for short messages; CLI |
| 104 | [mo74x/veritas-bridge](https://github.com/mo74x/veritas-bridge) |  |  |  | No README retrievable (private, empty, or no readme) |
| 105 | [idotpixel/Whisperwatch](https://github.com/idotpixel/Whisperwatch) | Languages | 76 | B | Which captions to review first; trained error estimator; interface |
| 106 | [Veritas-AI-International-Hackathon/Veritas-AI-International-Highschool-Hackathon-2026](https://github.com/Veritas-AI-International-Hackathon/Veritas-AI-International-Highschool-Hackathon-2026) |  |  |  | Stub README (84 chars), nothing to grade |
| 107 | [annatalia-w/ThamaniKE](https://github.com/annatalia-w/ThamaniKE) |  |  |  | No README retrievable (private, empty, or no readme) |
| 108 | [AmeyaChoudhary/VeritasAIHackathon](https://github.com/AmeyaChoudhary/VeritasAIHackathon) | Health | 74 | B | Teen mental-health check-in concept; demo; concept more than product |
| 109 | [arturbaimuratov1-sys/senim](https://github.com/arturbaimuratov1-sys/senim) | Languages | 84 | B+ | Kazakh translator warns on serious errors (6/8 vs 0 baseline); demo video |
| 110 | [ZemBono/qalaisyn](https://github.com/ZemBono/qalaisyn) | Languages | 85 | A | Kazakh text normalisation engine; embeds in other sites; demo+video; reproducible |
| 111 | [sushixodev/following-dirty-money](https://github.com/sushixodev/following-dirty-money) | Finance | 80 | B+ | Bitcoin AML GNN + drift detection; notebook + app |
| 112 | [Brandozerd/veritas-climate-hackathon](https://github.com/Brandozerd/veritas-climate-hackathon) | Climate | 76 | B | Recess planner; honestly reports ML did not beat rules |
| 113 | [fr3ddykru3g3r/aircast-jaipur](https://github.com/fr3ddykru3g3r/aircast-jaipur) | Climate | 72 | B | Jaipur next-day air; live prototype; frozen models |
| 114 | [actions-marketplace-validations/jayvion-Strata_veritas-article14-scanner](https://github.com/actions-marketplace-validations/jayvion-Strata_veritas-article14-scanner) |  |  |  | Not an entry: EU AI Act scanner |
| 115 | [thorfinn071/TilSwitch-AI-Veritas](https://github.com/thorfinn071/TilSwitch-AI-Veritas) | Languages | 64 | C | Kazakh-Russian-English span marker; short |
| 116 | [SZH2008/METranslate](https://github.com/SZH2008/METranslate) | Languages | 72 | B | Translator trust test AR/UR; video; modest depth |
| 117 | [rehim2009book-ui/fairloan](https://github.com/rehim2009book-ui/fairloan) | Finance | 80 | B+ | Hidden age-bias in loans; video, notebook; fairness angle |
| 118 | [andy101bk/Veritas-AI-Hackathon](https://github.com/andy101bk/Veritas-AI-Hackathon) | ? | 30 | F | Stub README |
| 119 | [Mr-CEO-cloud/the-day-after](https://github.com/Mr-CEO-cloud/the-day-after) | Climate | 85 | A | Gaza farmland recovery vs UN damage maps; HF Space; "how I kept it honest" |
| 120 | [mangoesqwerty39/babushka-shield](https://github.com/mangoesqwerty39/babushka-shield) | Finance | 74 | B | Russian-speaker scam filter; tests an English 2012 baseline |
| 121 | [Adik-Kek/kaz-budget](https://github.com/Adik-Kek/kaz-budget) | Finance | 74 | B | Family budget app, 3 ML parts, video; synthetic data; personal email in README |
| 122 | [SabaSad/veritas-ai-hackathon](https://github.com/SabaSad/veritas-ai-hackathon) | Finance | 76 | B | Is a strategy luck? Sim-trained model; video; Gradio demo lives only while notebook runs |
| 123 | [maini-m/BSL-Translator2](https://github.com/maini-m/BSL-Translator2) | Languages | 75 | B | BSL fingerspelling in browser; webcam demo |
| 124 | [vayungodara/onder-nul](https://github.com/vayungodara/onder-nul) | Finance | 74 | B | Negative Dutch power price warning; demo not hosted |
| 125 | [mytherrant/VERITAS-Academy](https://github.com/mytherrant/VERITAS-Academy) |  |  |  | No README retrievable (private, empty, or no readme) |
| 126 | [qwertybob1978/Veritas](https://github.com/qwertybob1978/Veritas) |  |  |  | No README retrievable (private, empty, or no readme) |
| 127 | [ProfessionalYapper0311/Veritas---RAG-v2.0](https://github.com/ProfessionalYapper0311/Veritas---RAG-v2.0) |  |  |  | Stub README (130 chars), nothing to grade |
| 128 | [felixbellafkih/veritas-analyst-front](https://github.com/felixbellafkih/veritas-analyst-front) |  |  |  | Other: Quranic NLP kernel |
| 129 | [mahashri142010/MeaningGuard-VeritasAI-2026](https://github.com/mahashri142010/MeaningGuard-VeritasAI-2026) | ? | 35 | F | Stub README |
| 130 | [Acookiefor2/scam-check-for-parents](https://github.com/Acookiefor2/scam-check-for-parents) | Finance | 74 | B | Scam SMS for Indian parents; EN/HI/MR/Hinglish |
| 131 | [VERITAS-Observatory/Eventdisplay_AnalysisScripts_VTS](https://github.com/VERITAS-Observatory/Eventdisplay_AnalysisScripts_VTS) |  |  |  | NOT an entry: VERITAS gamma-ray observatory |
| 132 | [umerasif67/AirWave_Islamabad](https://github.com/umerasif67/AirWave_Islamabad) | Climate | 66 | C | Islamabad PM2.5 viewer; admits seasonal-feature limit |
| 133 | [t2101722-maker/markettwin-ai](https://github.com/t2101722-maker/markettwin-ai) | Finance | 70 | B | Portfolio co-movement for beginners; live demo |
| 134 | [SycthePlays/SigapBumil](https://github.com/SycthePlays/SigapBumil) | Health | 76 | B | Maternal risk triage, live demo; video link "to be added" |
| 135 | [dicsio100-dev/who-pays-for-the-correction](https://github.com/dicsio100-dev/who-pays-for-the-correction) | Languages | 82 | B+ | ASR fairness audit; African-accented callers asked to repeat more; interactive page |
| 136 | [shiva-dev-229/Veritas-Hackathon](https://github.com/shiva-dev-229/Veritas-Hackathon) | Health | 55 | D | Parkinson keystroke LSTM; no results shown |
| 137 | [yoan-hristov/veritas-26-yh-submission](https://github.com/yoan-hristov/veritas-26-yh-submission) | ? | 25 | F | Stub README |
| 138 | [ArNam8/NoShow](https://github.com/ArNam8/NoShow) | ? | 30 | F | Stub README (NoShow) |
| 139 | [anBardo/Veritas-Hackathon-afm-outbreak-risk-model](https://github.com/anBardo/Veritas-Hackathon-afm-outbreak-risk-model) | Health | 30 | F | Stub README (AFM outbreak model) |
| 140 | [lordjunnior/lord-veritas](https://github.com/lordjunnior/lord-veritas) |  |  |  | Other: OpenTimestamps tool |
| 141 | [srixtan95/veritas-ai-hackathon](https://github.com/srixtan95/veritas-ai-hackathon) | Finance | 76 | B | Fairness-aware credit; Streamlit app |
| 142 | [agzama-sketch/cardio-lens](https://github.com/agzama-sketch/cardio-lens) | Health | 68 | C | Heart-disease explainable demo; classic dataset |
| 143 | [veritasfuji-japan/veritas_os](https://github.com/veritasfuji-japan/veritas_os) |  |  |  | Not an entry: veritas_os governance product |
| 144 | [samairaisabella-stack/Veritas-AI-Hackathon-2026](https://github.com/samairaisabella-stack/Veritas-AI-Hackathon-2026) |  |  |  | Stub README (27 chars), nothing to grade |
| 145 | [jayden-ferianto/Ecce-Veritas](https://github.com/jayden-ferianto/Ecce-Veritas) |  |  |  | Other: habit tracker |
| 146 | [PanshulVempalli/Veritas-AI-Hackathon](https://github.com/PanshulVempalli/Veritas-AI-Hackathon) |  |  |  | Stub README (22 chars), nothing to grade |
| 147 | [burgerrrman21/Veritas-ai-hackahon-project](https://github.com/burgerrrman21/Veritas-ai-hackahon-project) |  |  |  | Stub README (46 chars), nothing to grade |
| 148 | [Ruby570bocadito/Tinta-Veritas-AI-Hackaton](https://github.com/Ruby570bocadito/Tinta-Veritas-AI-Hackaton) | Health | 80 | B+ | Alzheimer early-signal phone tool, offline, EN/ES; demo |
| 149 | [tpspingol-lab/IGNITE](https://github.com/tpspingol-lab/IGNITE) | Health | 65 | C | IGNITE habit/nutrition app; benchmark text; unclear track |
| 150 | [nehanshkesharwani/writing-portfolio](https://github.com/nehanshkesharwani/writing-portfolio) |  |  |  | Not an entry: portfolio |
| 151 | [abusanaevdias/carbon-copilot](https://github.com/abusanaevdias/carbon-copilot) |  |  |  | Other event: CATALYST 2026 (Bureau Veritas case) |
| 152 | [seeuny2022-commits/finflag](https://github.com/seeuny2022-commits/finflag) | Finance | 80 | B+ | Finance-video red flags; 50 held-out videos, baselines, admits keyword rule won |
| 153 | [OscarBuzz2006/Project-Veritas](https://github.com/OscarBuzz2006/Project-Veritas) |  |  |  | Other: epistemics simulation (Apart) |
| 154 | [Catherine61005/VERITAS-Echo](https://github.com/Catherine61005/VERITAS-Echo) |  |  |  | Other: echocardiography research |
| 155 | [adamcodetime/veritas_html](https://github.com/adamcodetime/veritas_html) |  |  |  | Unlabelled: EquinoxAI market ONNX demo |
| 156 | [sandyowens206-netizen/veritas](https://github.com/sandyowens206-netizen/veritas) |  |  |  | No README retrievable (private, empty, or no readme) |
| 157 | [VrtxOmega/VrtxOmega](https://github.com/VrtxOmega/VrtxOmega) |  |  |  | Not a project: profile |
| 158 | [samirusham-dotcom/veritas](https://github.com/samirusham-dotcom/veritas) |  |  |  | Unverifiable |
| 159 | [davie2009kh/lsir](https://github.com/davie2009kh/lsir) | Languages | 86 | A | Armenian ASR LoRA; HF Space + model + video + report; WER tables |
| 160 | [jayvion-Strata/veritas-article14-scanner](https://github.com/jayvion-Strata/veritas-article14-scanner) |  |  |  | Not an entry: same scanner as #114 |
| 161 | [BMWareSPEEDY/UrbanFlow](https://github.com/BMWareSPEEDY/UrbanFlow) | Climate | 76 | B | Bengaluru flood dispatch vs EPA SWMM; personal email in README |
| 162 | [Varad9800x3d/Veritas-AI-Project](https://github.com/Varad9800x3d/Veritas-AI-Project) |  |  |  | Stub README (20 chars), nothing to grade |
| 163 | [AabidAlias/veritas1.0](https://github.com/AabidAlias/veritas1.0) |  |  |  | No README retrievable (private, empty, or no readme) |
| 164 | [extraolive7737/VTAI-Hackathon.team.Extraolive](https://github.com/extraolive7737/VTAI-Hackathon.team.Extraolive) | Finance | 66 | C | Headline sentiment vs market; notebook |
| 165 | [ThomasTheGodSmith/veritas-council](https://github.com/ThomasTheGodSmith/veritas-council) | Finance | 62 | C | Council of from-scratch models; Claude writes report |
| 166 | [Fable98/Veritas](https://github.com/Fable98/Veritas) |  |  |  | Stub README (101 chars), nothing to grade |
| 167 | [odh50fire-sys/veritasenglish](https://github.com/odh50fire-sys/veritasenglish) |  |  |  | Other: Korean English-learning app |
| 168 | [zenreye991/sign-to-speech](https://github.com/zenreye991/sign-to-speech) | Languages | 75 | B | Two-way sign/speech bridge; video; unseen-signer test |
| 169 | [KVERITAS-SCIENCE/ledger](https://github.com/KVERITAS-SCIENCE/ledger) |  |  |  | Unverifiable |
| 170 | [dede-bebe-lele/saqshy](https://github.com/dede-bebe-lele/saqshy) | Climate | 86 | A | Kazakhstan wildfire risk; notebook, live site, video; many metrics |
| 171 | [bobo322322/veritas-antifraud-hackathon](https://github.com/bobo322322/veritas-antifraud-hackathon) | Finance | 62 | C | Cost-sensitive fraud threshold; standard approach |
| 172 | [gauravmes9a11-alt/VERITAS](https://github.com/gauravmes9a11-alt/VERITAS) |  |  |  | Other: labour-law multi-agent system |
| 173 | [FPC-effortless/veritas](https://github.com/FPC-effortless/veritas) |  |  |  | Other: agent training foundry product |
| 174 | [AIGCNWPU/aigcdetect](https://github.com/AIGCNWPU/aigcdetect) |  |  |  | Other: Chinese AIGC detector |
| 175 | [TomasZitko/slysim-te](https://github.com/TomasZitko/slysim-te) | Languages | 70 | B | Same project as #54 (Utter) - duplicate repo of same team |
| 176 | [aserhamadaweb-cpu/Khalli-Balak](https://github.com/aserhamadaweb-cpu/Khalli-Balak) | Finance | 78 | B+ | Egyptian/Franco-Arabic scam SMS transfer test; always-SAFE baseline |
| 177 | [elon00/veritas-venus-mapper](https://github.com/elon00/veritas-venus-mapper) |  |  |  | Not an entry: blockchain boilerplate |
| 178 | [yars0634-arc/windward](https://github.com/yars0634-arc/windward) | Climate | 64 | C | Wind forecast turned into game; creative, thin eval |
| 179 | [FrudenFireKing/VeritasHack](https://github.com/FrudenFireKing/VeritasHack) |  |  |  | Other event: Geek Room hackathon (stale-answer detector) |
| 180 | [Thilak-raj-08/veritas-student-erp](https://github.com/Thilak-raj-08/veritas-student-erp) |  |  |  | Other: student ERP |
| 181 | [samir701/Veritas---Ai-powered-Exam-portal](https://github.com/samir701/Veritas---Ai-powered-Exam-portal) |  |  |  | Other: exam portal |
| 182 | [ParthPatel125/aircast](https://github.com/ParthPatel125/aircast) | Climate | 74 | B | Chicago smoke practice call; metrics; no demo |
| 183 | [umar20-web/scamshield-ai-hackathon](https://github.com/umar20-web/scamshield-ai-hackathon) | Finance | 40 | D | Short README (ScamShield) |
| 184 | [accountscivitas/ifv-league](https://github.com/accountscivitas/ifv-league) |  |  |  | No README retrievable (private, empty, or no readme) |
| 185 | [agolaurluik/Veritas](https://github.com/agolaurluik/Veritas) |  |  |  | Other: manipulation analyser + extension (Estonia) |
| 186 | [addyy-lee/veritas-ai-project-2026](https://github.com/addyy-lee/veritas-ai-project-2026) |  |  |  | No README retrievable (private, empty, or no readme) |
| 187 | [hansonliu20110617-lang/solarplan-hackathon](https://github.com/hansonliu20110617-lang/solarplan-hackathon) | Climate | 72 | B | Solar forecast + $ impact; 3 cities core, split study |
| 188 | [fruutium/smokecheck](https://github.com/fruutium/smokecheck) | Climate | 80 | B+ | Midwest smoke PM2.5; live page + 1:54 video; held-out year |
| 189 | [GD-root/Veritas-in-Caritate](https://github.com/GD-root/Veritas-in-Caritate) |  |  |  | Stub README (47 chars), nothing to grade |
| 190 | [27-GROUP/kveritas-releases](https://github.com/27-GROUP/kveritas-releases) |  |  |  | Not an entry: K-Veritas binaries |
| 191 | [27-GROUP/kveritas-go](https://github.com/27-GROUP/kveritas-go) |  |  |  | Not an entry: K-Veritas crypto CLI |
| 192 | [Kiasha9229/veritas_ai_finance](https://github.com/Kiasha9229/veritas_ai_finance) |  |  |  | Stub README (20 chars), nothing to grade |
| 193 | [nnautomator-debug/Veritas-AI-Hackathon-Project-Backend](https://github.com/nnautomator-debug/Veritas-AI-Hackathon-Project-Backend) |  |  |  | No README retrievable (private, empty, or no readme) |
| 194 | [ArqishZaria/veritas](https://github.com/ArqishZaria/veritas) |  |  |  | No README retrievable (private, empty, or no readme) |
| 195 | [unb-mds/2026-2-VeritasIA](https://github.com/unb-mds/2026-2-VeritasIA) |  |  |  | Course project (UnB) |
| 196 | [adamgalon/veritass](https://github.com/adamgalon/veritass) |  |  |  | Stub README (375 chars), nothing to grade |
| 197 | [VeritasRiskEngine/VeritasRiskEngine](https://github.com/VeritasRiskEngine/VeritasRiskEngine) |  |  |  | Not an entry: GRC marketing |
| 198 | [FuzzDOT/VERITAS](https://github.com/FuzzDOT/VERITAS) |  |  |  | Other: solvency engine |
| 199 | [Mthwane/Veritas](https://github.com/Mthwane/Veritas) |  |  |  | Other: .NET data platform |
| 200 | [matheason/news-vs-dow](https://github.com/matheason/news-vs-dow) | Finance | 58 | D | News vs Dow; data not in repo |
| 201 | [Harshal623/doseguard](https://github.com/Harshal623/doseguard) | Languages | 72 | B | Dosage translator self-check; names still placeholder |
| 202 | [harvard-huit/hapi-veritas-cli](https://github.com/harvard-huit/hapi-veritas-cli) |  |  |  | Not an entry: Harvard HUIT CLI |
| 203 | [juniorvuong8/Veritas-AI-Hackathon](https://github.com/juniorvuong8/Veritas-AI-Hackathon) | Languages | 66 | C | Vocabulary city game, Lovable; light eval |
| 204 | [WardenOfTheCove/VanSolar](https://github.com/WardenOfTheCove/VanSolar) |  |  |  | Stub README (186 chars), nothing to grade |
| 205 | [veritaslock/veritaslock-cli](https://github.com/veritaslock/veritaslock-cli) |  |  |  | Not an entry: VeritasLock CLI |
| 206 | [gunturborneo31/veritas](https://github.com/gunturborneo31/veritas) |  |  |  | Not an entry: stock Laravel |
| 207 | [julianjms-beep/aire-manana](https://github.com/julianjms-beep/aire-manana) | Climate | 80 | B+ | Madrid air forecast for teachers; live bilingual site, nightly updates |
| 208 | [gpereiradeveloper-rgb/Harvard-Project-site-with-3d-Animation](https://github.com/gpereiradeveloper-rgb/Harvard-Project-site-with-3d-Animation) |  |  |  | Other: 3D site |
| 209 | [dylp1ckle11/veritas](https://github.com/dylp1ckle11/veritas) |  |  |  | No README retrievable (private, empty, or no readme) |
| 210 | [swingcheck/Veritas-Challenge](https://github.com/swingcheck/Veritas-Challenge) | Health | 40 | D | Template unfilled: TODOs for team and numbers |
| 211 | [Emediong-Etuk/veritasclaim](https://github.com/Emediong-Etuk/veritasclaim) |  |  |  | Stub README (148 chars), nothing to grade |
| 212 | [ElKruegger/VeritasBackEnd](https://github.com/ElKruegger/VeritasBackEnd) |  |  |  | Other: e-commerce backend |
| 213 | [suares13/veritas-gem](https://github.com/suares13/veritas-gem) |  |  |  | Other: Gemini security tool |
| 214 | [amrutasahu2006/VeritasAI-GenAI](https://github.com/amrutasahu2006/VeritasAI-GenAI) |  |  |  | No README retrievable (private, empty, or no readme) |
| 215 | [brtucker42/FTCRoboticsWithPedroPathing2026-27](https://github.com/brtucker42/FTCRoboticsWithPedroPathing2026-27) |  |  |  | NOT an entry: FTC robotics SDK |
| 216 | [holland202/sovereign-veritas](https://github.com/holland202/sovereign-veritas) |  |  |  | Other: governance prototype |
| 217 | [M-697735/VERITAS-Triforge](https://github.com/M-697735/VERITAS-Triforge) |  |  |  | Other event?: email forensics |
| 218 | [ionnixf/Veritas](https://github.com/ionnixf/Veritas) | Finance | 70 | B | Shop cancellation reserve; offline demo vs fixed rule |
| 219 | [wpersonxdd/havocast](https://github.com/wpersonxdd/havocast) | Climate | 76 | B | Tashkent PM2.5 for PE classes; honest CAMS caveat |
| 220 | [namitbattancoc-design/veritas-AI-hackathon-project](https://github.com/namitbattancoc-design/veritas-AI-hackathon-project) | Health | 62 | C | Lab-report explainer; mostly concept |
| 221 | [DoodleDivine/Veritas-ai-climate-project](https://github.com/DoodleDivine/Veritas-ai-climate-project) |  |  |  | Stub README (42 chars), nothing to grade |
| 222 | [m-hesam-moradian/veritasnet](https://github.com/m-hesam-moradian/veritasnet) |  |  |  | Other: decentralised ML infra |
| 223 | [jjba23/veritas.el](https://github.com/jjba23/veritas.el) |  |  |  | Not an entry: Emacs |
| 224 | [yuvraj9990-en/MEDPULSE-AI](https://github.com/yuvraj9990-en/MEDPULSE-AI) |  |  |  | No README retrievable (private, empty, or no readme) |
| 225 | [ofuree2la/rider](https://github.com/ofuree2la/rider) |  |  |  | Other: campus ride app |
| 226 | [richeroveis/arena-veritas](https://github.com/richeroveis/arena-veritas) |  |  |  | Other: GenLayer dApp |
| 227 | [curry06240624-dev/power-weather-taiwan](https://github.com/curry06240624-dev/power-weather-taiwan) | Climate | 80 | B+ | Taiwan grid demand forecast; browser demo + notebook |
| 228 | [joaomarcoss1/VERITASUNICLASS](https://github.com/joaomarcoss1/VERITASUNICLASS) |  |  |  | Other: course platform |
| 229 | [navyarangwani/veritas](https://github.com/navyarangwani/veritas) |  |  |  | Other: ESG audit product |
| 230 | [adamcodetime/VERITAS_HACKATHON](https://github.com/adamcodetime/VERITAS_HACKATHON) |  |  |  | No README retrievable (private, empty, or no readme) |
| 231 | [Architekt-future/veritas-protocol](https://github.com/Architekt-future/veritas-protocol) |  |  |  | Other: Ukrainian truth-protocol |
| 232 | [Umar-coder1/Vision-Ai-Climate](https://github.com/Umar-coder1/Vision-Ai-Climate) |  |  |  | Stub README (84 chars), nothing to grade |
| 233 | [arphesegreteria-arch/arphe-graphic-kit](https://github.com/arphesegreteria-arch/arphe-graphic-kit) |  |  |  | Not an entry: graphic kit |
| 234 | [annatalia-w/Veritas-AI-Hackathon](https://github.com/annatalia-w/Veritas-AI-Hackathon) |  |  |  | Stub README (22 chars), nothing to grade |
| 235 | [Codeman-lex/engineering-portfolio](https://github.com/Codeman-lex/engineering-portfolio) |  |  |  | Not an entry: portfolio |
| 236 | [TEAMNAJAA/veritas](https://github.com/TEAMNAJAA/veritas) |  |  |  | No README retrievable (private, empty, or no readme) |
| 237 | [ImamaAhmad/HeatSafe-Lahore](https://github.com/ImamaAhmad/HeatSafe-Lahore) | Climate | 66 | C | Lahore heat-risk; metrics, no demo |
| 238 | [16oweno-art/veritas-ai](https://github.com/16oweno-art/veritas-ai) |  |  |  | No README retrievable (private, empty, or no readme) |
| 239 | [sabari-k07/Veritas_CMS](https://github.com/sabari-k07/Veritas_CMS) |  |  |  | Other: college portal |
| 240 | [f8fixlu/veritas](https://github.com/f8fixlu/veritas) |  |  |  | Other: exam system |
| 241 | [Aragoorn/VeritasCourt](https://github.com/Aragoorn/VeritasCourt) |  |  |  | Other: GenLayer court |
| 242 | [erjanowitz-code/veritas-heart-risk-mvp](https://github.com/erjanowitz-code/veritas-heart-risk-mvp) | Health | 62 | C | Heart-risk on 303 patients from 1988; team name placeholder |
| 243 | [a30399983-art/veritas03](https://github.com/a30399983-art/veritas03) |  |  |  | Other: Render test |
| 244 | [curry06240624-dev/mother-tongue-detector](https://github.com/curry06240624-dev/mother-tongue-detector) | Languages | 82 | B+ | Hakka/Hokkien/Mandarin detector; beats langdetect; demo |
| 245 | [api-evangelist/cohesity](https://github.com/api-evangelist/cohesity) |  |  |  | NOT an entry: API profile of Cohesity |
| 246 | [AION-Analytics-India/aion-veritas](https://github.com/AION-Analytics-India/aion-veritas) |  |  |  | Other: Indian index forecasts product |
| 247 | [MogSquad-FinalYear/Veritas-Frontend](https://github.com/MogSquad-FinalYear/Veritas-Frontend) |  |  |  | Other: frontend for 3 backends |
| 248 | [jasna18/veritas-clinic](https://github.com/jasna18/veritas-clinic) |  |  |  | No README retrievable (private, empty, or no readme) |
| 249 | [AtharvaJaysingpure25/Veritas-AI](https://github.com/AtharvaJaysingpure25/Veritas-AI) |  |  |  | Stub README (12 chars), nothing to grade |
| 250 | [niyatiswaroop/VERITAS](https://github.com/niyatiswaroop/VERITAS) |  |  |  | Other: B.Tech project |
| 251 | [Gauravvj/VERITAS-AI](https://github.com/Gauravvj/VERITAS-AI) |  |  |  | Stub README (12 chars), nothing to grade |
| 252 | [Giddy-chordz/VERITAS-AI](https://github.com/Giddy-chordz/VERITAS-AI) |  |  |  | No README retrievable (private, empty, or no readme) |
| 253 | [Sishan24/veritas-enhanced](https://github.com/Sishan24/veritas-enhanced) |  |  |  | Other: claim verification |
| 254 | [coha45/veritas-cv](https://github.com/coha45/veritas-cv) |  |  |  | No README retrievable (private, empty, or no readme) |
| 255 | [Syed487/Veritas-AI-Hackathon](https://github.com/Syed487/Veritas-AI-Hackathon) |  |  |  | Stub README (47 chars), nothing to grade |
| 256 | [Vinay4556/Veritas-AI](https://github.com/Vinay4556/Veritas-AI) |  |  |  | Other: procurement compliance |
| 257 | [gigabyte-artur/Veritas](https://github.com/gigabyte-artur/Veritas) |  |  |  | Stub README |
| 258 | [erjanowitz-code/veritas-health-hackathon](https://github.com/erjanowitz-code/veritas-health-hackathon) | Health | 50 | D | Short README, heart/health; little visible |
| 259 | [shreyanshsharma-1210/veritas-ai](https://github.com/shreyanshsharma-1210/veritas-ai) |  |  |  | Short README: unverifiable |
| 260 | [jjba23/veritas](https://github.com/jjba23/veritas) |  |  |  | No README retrievable (private, empty, or no readme) |
| 261 | [Sanchay0123/Veritas-Stream](https://github.com/Sanchay0123/Veritas-Stream) |  |  |  | Other: deepfake forensics |
| 262 | [gmackie/t3code-veritas-plugin](https://github.com/gmackie/t3code-veritas-plugin) |  |  |  | Not an entry: plugin |
| 263 | [hessiser/veritas](https://github.com/hessiser/veritas) |  |  |  | NOT an entry: Honkai Star Rail overlay |
| 264 | [yuvraj8eee25-rgb/Veritas](https://github.com/yuvraj8eee25-rgb/Veritas) |  |  |  | Stub README |
| 265 | [msdyatt/vvcoop-familyportal](https://github.com/msdyatt/vvcoop-familyportal) |  |  |  | Not an entry: starter template |
| 266 | [LuizHenriqueNogueira/Veritas](https://github.com/LuizHenriqueNogueira/Veritas) |  |  |  | Other: Brazilian disinfo app |
| 267 | [trunks2kg/veritas-motor-group](https://github.com/trunks2kg/veritas-motor-group) |  |  |  | No README retrievable (private, empty, or no readme) |
| 268 | [yanicpeterson-prog/veritas](https://github.com/yanicpeterson-prog/veritas) |  |  |  | No README retrievable (private, empty, or no readme) |
| 269 | [yanicpeterson-prog/veritas-1](https://github.com/yanicpeterson-prog/veritas-1) |  |  |  | No README retrievable (private, empty, or no readme) |
| 270 | [HIMANSHU-heist/VERITAS](https://github.com/HIMANSHU-heist/VERITAS) |  |  |  | Other: paper-trading system |
| 271 | [Milan-6/VERITAS](https://github.com/Milan-6/VERITAS) |  |  |  | Other: research platform |
| 272 | [shiroonigami23-ui/veritas-protocol-ai-agents](https://github.com/shiroonigami23-ui/veritas-protocol-ai-agents) |  |  |  | Not an entry: agent audit chain |
| 273 | [gabrielhca/Micelio-Veritas](https://github.com/gabrielhca/Micelio-Veritas) |  |  |  | Other: Micelio |
| 274 | [Bhoomified/VeritasAI](https://github.com/Bhoomified/VeritasAI) |  |  |  | Other: deepfake Django |
| 275 | [veritasneko/veritasneko.github.io](https://github.com/veritasneko/veritasneko.github.io) |  |  |  | Stub README (23 chars), nothing to grade |
| 276 | [Zephyr-110/Veritas](https://github.com/Zephyr-110/Veritas) |  |  |  | Other: Solana prediction market |
| 277 | [veritashong-adimn/veritas-platform](https://github.com/veritashong-adimn/veritas-platform) |  |  |  | No README retrievable (private, empty, or no readme) |
| 278 | [JorVe299/Veritas](https://github.com/JorVe299/Veritas) |  |  |  | Not an entry: FiveM admin panel |
| 279 | [picklunchforme/veritasundmedizin](https://github.com/picklunchforme/veritasundmedizin) |  |  |  | Unverifiable (page markup, not README) |
| 280 | [saaniiyaa/veritas-sharda](https://github.com/saaniiyaa/veritas-sharda) |  |  |  | No README retrievable (private, empty, or no readme) |
| 281 | [studioveritas/studio-veritas](https://github.com/studioveritas/studio-veritas) |  |  |  | Not an entry: studio site |
| 282 | [faust-dark/veritas](https://github.com/faust-dark/veritas) |  |  |  | Other event: Cortensor hackathon |
| 283 | [Patrick190508/whaleshark-mafia-island](https://github.com/Patrick190508/whaleshark-mafia-island) |  |  |  | No README retrievable (private, empty, or no readme) |
| 284 | [nurulirfan1828-boop/readability-scorer18](https://github.com/nurulirfan1828-boop/readability-scorer18) |  |  |  | Unlabelled: readability scorer, 1 KB README, unverifiable |
| 285 | [samskruthiReddy/VERITAS-AI](https://github.com/samskruthiReddy/VERITAS-AI) |  |  |  | Other event: YUKTIK-2026 |
| 286 | [ShreyaP168/Bureau_veritas](https://github.com/ShreyaP168/Bureau_veritas) |  |  |  | Other: Bureau Veritas invoicing |
| 287 | [JCMtz55/arcanum-veritas](https://github.com/JCMtz55/arcanum-veritas) |  |  |  | Not an entry: TTRPG tool |
| 288 | [AtharvS7/VeritasAI-v2](https://github.com/AtharvS7/VeritasAI-v2) |  |  |  | Other: misinformation checker (live) |
| 289 | [kwesi-mb/veritasrag](https://github.com/kwesi-mb/veritasrag) |  |  |  | No README retrievable (private, empty, or no readme) |
| 290 | [cedriccollins2010/Veritas-platform](https://github.com/cedriccollins2010/Veritas-platform) |  |  |  | Other: evidence platform |
| 291 | [hamzatahir06/Veritas-Ai](https://github.com/hamzatahir06/Veritas-Ai) |  |  |  | Other: research agent |
| 292 | [Logankenney/MentasVeritas](https://github.com/Logankenney/MentasVeritas) |  |  |  | Stub README (234 chars), nothing to grade |
| 293 | [Lucas-Maransaldi/veritas-core-sheet](https://github.com/Lucas-Maransaldi/veritas-core-sheet) |  |  |  | Not an entry: Foundry module |
| 294 | [Lucas-Maransaldi/veritas-features](https://github.com/Lucas-Maransaldi/veritas-features) |  |  |  | Not an entry: Foundry module |
| 295 | [sriharish99/VeritasRAG](https://github.com/sriharish99/VeritasRAG) |  |  |  | Other: HR policy RAG |
| 296 | [lixinveritas/veritas-link-releases](https://github.com/lixinveritas/veritas-link-releases) |  |  |  | Stub README (86 chars), nothing to grade |
| 297 | [JoeyGirdhar/Veritas](https://github.com/JoeyGirdhar/Veritas) |  |  |  | Other: agentic analyst |
| 298 | [Caiorhcp/veritas](https://github.com/Caiorhcp/veritas) |  |  |  | Not an entry: Claude plugin |