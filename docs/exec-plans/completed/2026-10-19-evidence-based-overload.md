# Evidence-based load suggestions

## Purpose
Gymmy suggests the next working load for every exercise ([overloadEngine.ts](../../../src/services/overloadEngine.ts)). This plan checks those rules against the research on choosing and progressing loads, records what the evidence says with citations, and changes the rules where they depart from it. When it is done, the load suggestions on Home, the tracker and Progress follow the agreed rules below, `tests/overloadEngine.test.ts` covers each one, and the README section "Load suggestions (double progression)" describes them.

## Context
- Rules: [overloadEngine.ts](../../../src/services/overloadEngine.ts) (suggestions, deload, lighter weight, big-jump reps, 1RM), [loading.ts](../../../src/services/loading.ts) and [gymInventory.ts](../../../src/data/gymInventory.ts) (loads the home equipment makes: 10 kg bar, one dumbbell up to 25 kg, fixed plates), [effort.ts](../../../src/services/effort.ts) (RIR, stored as `rpe = 10 − RIR`), [progress.ts](../../../src/services/progress.ts) (estimated 1RM), [seedData.ts](../../../src/data/seedData.ts) (targets for a fresh install; saved targets in the database take precedence, see `storage.ts`).
- What the user sees: [README.md](../../../README.md) "Load suggestions (double progression)".
- Constraints: exercise `id`s, `OverloadStatus` values shown by `StatusBadge`, and stored data stay unchanged. No new dependency. `package.json` and the lockfile are off limits for this work (another session is merging Dependabot PRs).
- The user's history, read-only on 2026-10-19: 13 sessions since 2026-09-07; each lift is trained about once a week; RIR is logged on 12 of 179 completed sets; later sets often fall far below the first (Flat Bench 60 kg: 8 / 7 / 3 / 3, Skullcrusher 22.5 kg: 10 / 7 / 5), and Flat Bench has made no progress at 60 kg in six sessions.

## Research findings
Evidence strength, used below: **High** = a large meta-analysis or umbrella review with consistent results; **Moderate** = a meta-analysis with few studies or large heterogeneity, or several consistent trials; **Low** = one small trial, a survey or an expert consensus; **Opinion** = a position-stand or textbook recommendation without trials behind that specific number. Newer evidence is weighted higher only when it is also large ([References](#references) has the full citations).

### Loads, rep ranges and sets
- **Hypertrophy is similar across a wide range of loads when sets go close to failure; strength favors heavy loads.** Currier 2023 (BJSM network meta-analysis, 178 studies, n = 5097 for strength; 119 studies, n = 3364 for hypertrophy): loads above 80 % 1RM maximize strength, all prescriptions build muscle comparably. Lopez 2021 (MSSE, 28 studies, n = 747) and Schoenfeld 2017a (JSCR, 21 studies) agree. **High.**
- **Very light loads are worse.** Lasevicius 2018 (EJSS, n = 30, within-subject): 20 % 1RM gave about half the growth of 80 %; 40–80 % were close. **Low–Moderate.** This bounds rep progression at roughly 30 reps (the engine's `REP_TARGET_CAP`).
- **Volume: more weekly sets build more muscle, with diminishing returns; strength plateaus sooner.** Pelland 2026 (Sports Med, 67 studies, n = 2058); Schoenfeld 2017b (J Sports Sci, 15 studies): about 10 or more sets per muscle per week. The ACSM 2026 position stand (Currier 2026, MSSE, umbrella of 137 reviews, more than 30,000 participants) suggests about 10 weekly sets per muscle for hypertrophy and 2–3 sets of heavy (~80 % 1RM) work per exercise for strength. **High.**
- **Rep ranges.** ACSM 2009: strength emphasis 1–6 RM, hypertrophy emphasis 6–12 RM, within a periodized 1–12 RM. **Opinion**, now superseded in spirit by the load findings above: any range from about 5 to 30 reps builds muscle near failure; heavier work (≤ 6–8 reps) builds more strength.

### Progression: when and how much
- **Adding reps at a fixed load works as well as adding load.** Plotkin 2022 (PeerJ, n = 43 trained, 8 weeks): load progression and rep progression gave similar hypertrophy and strength. **Low–Moderate** (one trial, but in trained lifters, with narrow intervals). This supports double progression and, for small dumbbell lifts, earning big jumps with extra reps.
- **When to add load.** ACSM 2009 and 2002: add load when the lifter can do 1–2 reps beyond the target, by 2–10 %. NSCA's "2-for-2 rule" (two extra reps in two consecutive sessions) is textbook guidance. **Opinion**: no trial compares these triggers.
- **Increment size.** ACSM's 2–10 % is **Opinion**. No trial tests increment sizes directly. Gymmy's 2.5 kg barbell step is 2.5 % (Deadlifts at 100 kg) to 11 % (Skullcrusher at 22.5 kg); its 2.5 kg dumbbell step is 25–50 % for 5–10 kg dumbbells, far outside that range.

### Small lifts and big percent jumps
- With fixed 2.5 kg dumbbell steps, Lateral Raise 5 → 7.5 kg is +50 % and Biceps Curl 10 → 12.5 kg is +25 %. The evidence above (Plotkin 2022; Schoenfeld 2017a; Lopez 2021) says staying at the lighter load and adding reps loses little for hypertrophy, up to about 30 reps (Lasevicius 2018). **Moderate.**
- **How many reps at the lighter load "equal" the bottom of the range at the heavier one** depends on the reps–%1RM relationship, which equations model poorly above about 10 reps. Nuzzo 2024 (Sports Med meta-regression, 269 studies, n = 7289): about 15 reps at 70 % 1RM on average (bench press 14.1, leg press 19.0), 8.8 reps at 80 % on the bench press, with a between-person SD of about 4.4 reps at 60 %. Brzycki predicts 11.8 reps at 70 %, Epley 12.9. At light loads both underpredict, Brzycki more. **High** for the average relationship; individual spread is wide.

### Reps in reserve and autoregulation
- **RIR-based RPE is a usable effort scale.** Zourdos 2016 (JSCR, n = 29): RIR ratings track bar speed (r = −0.77 to −0.88). **Low–Moderate.**
- **People misjudge RIR by about one rep, worse for sets above 12 reps.** Halperin 2022 (Sports Med, 13 studies, n = 414): lifters underpredict reps to failure by 0.95 reps on average; error grows for sets of more than 12 reps. **Moderate.**
- **Autoregulated loading works about as well as fixed loading.** Hickmott 2022 (Sports Med Open, 15 studies): no significant strength difference for load autoregulation (SMD 0.21, p = 0.09). Helms 2018 (Front Physiol, n = 21): RPE-based loading matched %1RM loading, with a possible small strength edge. **Moderate.**
- **Proximity to failure matters for hypertrophy, little for strength.** Robinson 2024 (Sports Med, meta-regressions): hypertrophy rises as sets end closer to failure; strength shows no clear relationship. Refalo 2023 (Sports Med, 15 studies): failure versus non-failure training gives a trivial hypertrophy difference (ES 0.12, not significant). The ACSM 2026 stand calls failure training optional. **Moderate–High.** So sets stopped 1–2 reps short lose little, and a drop in reps is only a fatigue signal when effort was comparable.

### Rest between sets
- Grgic 2018 (Sports Med, 23 studies, n = 491): trained lifters need more than 2 minutes' rest to maximize strength; 60–120 s suffices for untrained lifters. Schoenfeld 2016 (JSCR, n = 21 trained men): 3-minute rest beat 1-minute rest for strength and thigh hypertrophy. Singer 2024 (Front Sports Act Living, Bayesian meta-analysis, 9 studies): a small hypertrophy benefit from resting more than 60 s, none appreciable beyond 90 s, plausibly because longer rest preserves reps in later sets. **Moderate.**

### 1RM estimation
- LeSuer 1997 (JSCR, n = 67, seven equations, bench press, squat, deadlift): every equation correlated highly (r > 0.95); all underestimated the deadlift. Reynolds 2006 (JSCR, n = 70): a 5RM predicts 1RM best (R² 0.97–0.99), accuracy falls at 10RM and 20RM; the authors advise no more than 10 reps. Mayhew 1995 (J Sports Med Phys Fitness, n = 220) found Brzycki most accurate on the bench press at 10 reps or fewer, and no equation best above 10. **Moderate** for "equations agree within a few percent at ≤ 10 reps, diverge above"; no recent large meta-analysis compares the equations (a 2026 arXiv preprint does, but it is not peer reviewed and is not weighted here).
- Brzycki and Epley give the same answer at 10 reps; Epley is up to 3–4 % higher at 2–6 reps; above 10 reps Epley predicts more reps at a given load, closer to the Nuzzo 2024 averages.

### Deloads, stalls and drops in performance
- **Definition and shape.** Bell 2023 (Sports Med Open, Delphi, 21 coaches in the final round): a deload is "a period of reduced training stress designed to mitigate physiological and psychological fatigue". 100 % agreement that it can cut sets, cut reps, and reduce proximity to failure; 95 % that load may stay the same while volume drops; 100 % that it can be pre-planned, autoregulated, or both, and taken when the lifter feels fatigued. **Low** (expert consensus).
- **Practice.** Rogerson 2024 (Sports Med Open, survey, n = 246 strength and physique athletes): deload every 5.6 ± 2.3 weeks for 6.4 ± 1.7 days; 79 % cut weekly sets, 84 % lower the load and 85 % leave more reps in reserve on multi-joint lifts; frequency usually unchanged. Triggers: the programme says so (65 %), feeling beaten up (63 %), performance stalls or decreases (54 %). **Low** (self-report of practice, not outcomes).
- **Outcome evidence is thin.** Coleman 2024 (PeerJ, n = 39 trained, 9 weeks): a full week off at mid-point gave no hypertrophy benefit and slightly smaller lower-body strength gains than training straight through. **Low.** It tested complete rest, not a reduced-load week, so it argues against stopping, not against a lighter week.
- **No trial compares deload sizes or stall rules.** The 10 % drop and the triggers are practice and consensus, not tested values.

## Comparison with the current rules
| Rule now | Evidence | Verdict |
| :-- | :-- | :-- |
| Double progression: reps first, then the next load when every set reaches the top | Plotkin 2022; ACSM 2009 | Agrees |
| Next load is one equipment step (2.5 kg bar and dumbbell, 1.25 kg landmine) | ACSM 2–10 %: barbell steps are 2.5–11 % | Agrees for barbell and landmine |
| Jumps over 15 % earned with extra reps, target from Brzycki, capped at 30 | Rep progression is as good (Plotkin 2022); light loads to ~30 reps still work (Lasevicius 2018); Brzycki underpredicts reps at light loads (Nuzzo 2024) | Agrees in principle; **the Brzycki target is too low** (Lateral Raise 19 reps at 5 kg is likely to land below 10 reps at 7.5 kg) |
| Deload: average reps fall two sessions running at one weight → about 10 % lighter "for a week" | Performance decline is a common trigger (Rogerson 2024); deloads cut load, sets and effort (Bell 2023; Rogerson 2024) | Trigger agrees; **the deload only cuts load**, says nothing about sets or effort, and **never returns**: afterwards the engine rebuilds 2.5 kg at a time from the lighter weight |
| Stall inside the range: hold forever | Stalling is a deload trigger for 54 % of athletes (Rogerson 2024) | **Departs**: no response to a long stall (Flat Bench: six sessions at 60 kg) |
| Stuck below the range three sessions → one step lighter | Hypertrophy is similar across loads (Currier 2023); a load that keeps reps under the range is out of the target range | Agrees |
| First set at the top, later sets drop → hold | Longer rest preserves reps in later sets and helps strength (Grgic 2018; Schoenfeld 2016; Singer 2024) | Agrees, but **gives no reason or remedy** for large drop-offs |
| RIR logged but ignored | Reps compare only at similar effort (Robinson 2024; Refalo 2023); RIR is about one rep off (Halperin 2022) | **Departs**: a set stopped early reads as fatigue |
| Estimated 1RM: Brzycki, capped at 37 reps | Accurate within a few percent to 10 reps (LeSuer 1997; Reynolds 2006; Mayhew 1995) | Agrees; less accurate for 12–15 rep isolation lifts, but consistent for trends |
| Seed ranges 5–15 reps, 3–4 sets, 75–180 s rest | Rep ranges and rest fit Currier 2023, Grgic 2018, Singer 2024 | Agrees. Volume: at once a week per split, most muscles get 3–7 sets a week, under the ~10 suggested (Pelland 2026; ACSM 2026). Program design, not suggestion logic |

## Proposed rule changes
1. **Deload content.** Keep about 10 % lighter; also ask for about half the sets (rounded up) and every set stopped about 3 reps short of failure.
2. **Return after a deload.** After one session at the deload weight, suggest going back to the weight before the deload. At once a week per lift, one session is the week the evidence describes.
3. **Stall inside the range.** When four or more sessions at one weight show no new best average in the last three, and no gain from the first of those to the last, suggest the same deload.
4. **Big-jump rep target from Epley.** Lateral Raise 5 → 7.5 kg needs 30 reps at 5 kg (Brzycki: 19); Incline DB Press and Biceps Curl 10 → 12.5 kg need 18 (Brzycki: 14). Cap stays 30.
5. **Drop-off advice.** When the first set is in or above the range and the last falls below it, the hold advice adds: rest 2–3 minutes between sets, or stop the early sets 1–2 reps short of failure. Text only; load and status unchanged.
6. **RIR in trends.** When every working set of every session at the current weight has a logged RIR, compare sessions by average reps plus RIR (reps the sets had in them) instead of reps alone. *Rejected by the user; see the Decision log.*
7. **Unchanged:** one-step increments, the "every set at the top once" trigger, the 15 % big-jump threshold, the below-range rule, Brzycki for the Progress 1RM, seed targets, and no calendar-scheduled deloads.

## Interview
Each question has a recommended answer; "yes" accepts it. Answers go into the Decision log.
1. Deload content: about 10 % lighter, half the sets rounded up, each set about 3 reps short of failure? Recommended: yes.
2. Return to the pre-deload weight after one deload session, instead of rebuilding a step at a time? Recommended: yes.
3. Treat four sessions at one weight with no new best in the last three as a stall, and suggest a deload? Recommended: yes.
4. Use Epley for the big-jump rep target (30 reps for Lateral Raise at 5 kg, 18 for 10 kg dumbbell lifts)? Recommended: yes.
5. Add rest and RIR advice to the hold message when later sets fall below the range? Recommended: yes.
6. Judge trends by reps plus RIR when every set at that weight has RIR logged? Recommended: yes.
7. Keep everything in "Unchanged" as is, including no bigger jumps for Squats and Deadlifts and no scheduled deloads? Recommended: yes.
8. Leave completed sets logged with 0 reps (Pull-Ups, RDL in the history) out of this work, as a tech-debt entry? Recommended: yes.

## Plan
1. Interview the user and log the answers. Verify: Decision log has an entry per question.
2. Implement each agreed rule test-first in `tests/overloadEngine.test.ts`. Verify: each new test fails before its change and passes after; `npm test`.
3. Update the README section, the CHANGELOG and any doc that describes the rules. Verify: `npm run check:docs`.
4. `npm run verify`, reviewer subagent, pull request into `main`. Verify: CI `verify` and `secrets` pass.

## Progress
- [x] 2026-10-19 Research and comparison with the current rules
- [x] 2026-10-19 Interview and agreement
- [x] 2026-10-19 Rules implemented with tests
- [x] 2026-10-19 Docs, CHANGELOG, verify and pull request

## Decision log
- 2026-10-19 (Q1): A deload is about 10 % lighter, half the sets rounded up, each set stopped about 3 reps short of failure, because deloads cut volume and effort as well as load (Bell 2023; Rogerson 2024). Rejected: load only (the old rule); sets and effort only.
- 2026-10-19 (Q2): After one session at the deload weight, the suggestion returns to the weight before the deload, because a deload is a temporary cut (Bell 2023). At once a week per lift, one session is about a week. Rejected: rebuilding a step at a time from the lighter weight (the old behavior).
- 2026-10-19 (Q3): Four or more sessions at one weight with no new best average in the last three is a stall and gets the same deload, because stalls are a common deload trigger (Rogerson 2024). Rejected: one step lighter; holding indefinitely (the old behavior).
- 2026-10-19 (Q3, amended after review): Reps that rise over the last three sessions are not a stall, even below an earlier best: a stall also needs no gain from the first of the three to the last, as the below-range rule already does. The reviewer showed the literal rule deloaded a lifter climbing back after a bad week, and deloaded again after every return. The user chose the narrower rule. Rejected: the literal "no new best in the last three".
- 2026-10-19 (Q4): The reps that earn a jump of more than 15 % come from Epley instead of Brzycki, because Epley is closer to the measured reps at light loads (Nuzzo 2024). The 30-rep cap stays. Rejected: keeping Brzycki.
- 2026-10-19 (Q5): When the first set is in or above the range and the last set falls below it, the hold advice suggests 2–3 minutes' rest or stopping early sets 1–2 reps short (Grgic 2018; Schoenfeld 2016; Singer 2024). Text only.
- 2026-10-19 (Q6): The user chose not to use logged RIR in the trend rules; RIR stays a logged note. Rejected: comparing reps plus RIR.
- 2026-10-19 (Q7): One-step increments, the move-up trigger, the 15 % threshold, the below-range rule, Brzycki for the Progress 1RM, the seed targets and reactive-only deloads stay as they are.
- 2026-10-19 (Q8): The user agreed to leave 0-rep sets out of this work. Checking the code afterwards showed the question rested on a wrong reading: `indexCompletedLogs` in `exerciseLogs.ts` already leaves out completed sets with 0 reps, so there was no debt to record.
- 2026-10-19: Kept the research summary in this plan rather than a design doc, because the rules are cheap to change later and the design-doc bar asks for a hard-to-reverse decision. Rejected: a `docs/design-docs/load-progression.md`.

## Surprises
- The user's own history shows large drops across sets (Flat Bench 8 / 7 / 3 / 3 at 60 kg) and very little RIR logging (12 of 179 sets), so RIR-based rules will rarely fire for this user while the drop-off and stall rules will.
- Saved exercise targets in the database take precedence over `seedData.ts`, so seed changes would reach only a fresh install.
- Interview question 8 assumed 0-rep sets count as working sets. They don't: `indexCompletedLogs` filters them out (Pull-Ups is judged on its 1-rep set, RDL has no logged session).
- Run read-only over the user's history, the new rules change two of twelve suggestions: Skullcrusher (22.5 → 20 kg) gets a stall deload, and Overhead Press, which the user dropped from 25 to 22.5 kg on their own after a stall, is read as a finished deload and sent back to 25 kg. Flat Bench and Deadlifts are below an earlier best but climbing, so they hold. The rest-advice line appears on Incline DB Press, Meadows Row and Biceps Curl. The old rules held every load.

## Validation
- `npm test`: every case in `tests/overloadEngine.test.ts` passes, including one per agreed rule. Result on 2026-10-19: 163 tests pass, 0 fail; every new or changed case failed before its engine change.
- `npm run verify` passes locally and in CI.

## Outcome
Shipped: changes 1–5 of the proposed rules (deload content, return after a deload, stall deload, Epley big-jump target, rest advice on drop-offs), with tests, and the README, PRODUCT.md and CHANGELOG updated. Not shipped: RIR in trends (change 6), rejected by the user. Nothing else changed in `loading.ts`, `effort.ts`, `progress.ts` or `seedData.ts`.

Follow-ups, not planned: weekly volume per muscle is under the ~10 sets the evidence suggests when each split is trained once a week (Pelland 2026; ACSM 2026); that is a program choice for the user, not suggestion logic.

## References
- Bell L, Strafford BW, Coleman M, Androulakis Korakakis P, Nolan D. Integrating deloading into strength and physique sports training programmes: an international Delphi consensus approach. *Sports Med Open*. 2023;9:87. Delphi, 34 → 21 coaches.
- Coleman M, Burke R, Augustin F, et al. Gaining more from doing less? The effects of a one-week deload period during supervised resistance training on muscular adaptations. *PeerJ*. 2024;12:e16777. RCT, n = 39.
- Currier BS, Mcleod JC, Banfield L, et al. Resistance training prescription for muscle strength and hypertrophy in healthy adults: a systematic review and Bayesian network meta-analysis. *Br J Sports Med*. 2023;57(18):1211–1220. 178 studies, n = 5097.
- Currier BS, D'Souza AC, Singh MAF, et al.; Phillips SM (chair). American College of Sports Medicine position stand. Resistance training prescription for muscle function, hypertrophy, and physical performance in healthy adults: an overview of reviews. *Med Sci Sports Exerc*. 2026;58(4):851–872. 137 systematic reviews, more than 30,000 participants.
- Grgic J, Schoenfeld BJ, Skrepnik M, Davies TB, Mikulic P. Effects of rest interval duration in resistance training on measures of muscular strength: a systematic review. *Sports Med*. 2018;48(1):137–151. 23 studies, n = 491.
- Halperin I, Malleron T, Har-Nir I, et al. Accuracy in predicting repetitions to task failure in resistance exercise: a scoping review and exploratory meta-analysis. *Sports Med*. 2022;52(2):377–390. 13 studies, n = 414.
- Helms ER, Byrnes RK, Cooke DM, et al. RPE vs. percentage 1RM loading in periodized programs matched for sets and repetitions. *Front Physiol*. 2018;9:247. RCT, n = 21.
- Hickmott LM, Chilibeck PD, Shaw KA, Butcher SJ. The effect of load and volume autoregulation on muscular strength and hypertrophy: a systematic review and meta-analysis. *Sports Med Open*. 2022;8:9. 15 studies.
- Lasevicius T, Ugrinowitsch C, Schoenfeld BJ, et al. Effects of different intensities of resistance training with equated volume load on muscle strength and hypertrophy. *Eur J Sport Sci*. 2018;18(6):772–780. n = 30.
- LeSuer DA, McCormick JH, Mayhew JL, Wasserstein RL, Arnold MD. The accuracy of prediction equations for estimating 1-RM performance in the bench press, squat, and deadlift. *J Strength Cond Res*. 1997;11(4):211–213. n = 67.
- Lopez P, Radaelli R, Taaffe DR, et al. Resistance training load effects on muscle hypertrophy and strength gain: systematic review and network meta-analysis. *Med Sci Sports Exerc*. 2021;53(6):1206–1216. 28 studies, n = 747.
- Mayhew JL, Prinster JL, Ware JS, Zimmer DL, Arabas JR, Bemben MG. Muscular endurance repetitions to predict bench press strength in men of different training levels. *J Sports Med Phys Fitness*. 1995;35(2):108–113. n = 220.
- Nuzzo JL, Pinto MD, Nosaka K, Steele J. Maximal number of repetitions at percentages of the one repetition maximum: a meta-regression and moderator analysis of sex, age, training status, and exercise. *Sports Med*. 2024;54(2):303–321. 269 studies, n = 7289.
- Pelland JC, Remmert JF, Robinson ZP, Hinson SR, Zourdos MC. The resistance training dose response: meta-regressions exploring the effects of weekly volume and frequency on muscle hypertrophy and strength gains. *Sports Med*. 2026;56(2):481–505. 67 studies, n = 2058.
- Plotkin D, Coleman M, Van Every D, et al. Progressive overload without progressing load? The effects of load or repetition progression on muscular adaptations. *PeerJ*. 2022;10:e14142. RCT, n = 43.
- Ratamess NA, Alvar BA, Evetoch TK, et al.; American College of Sports Medicine. Progression models in resistance training for healthy adults. *Med Sci Sports Exerc*. 2009;41(3):687–708. Position stand.
- Refalo MC, Helms ER, Trexler ET, Hamilton DL, Fyfe JJ. Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy: a systematic review with meta-analysis. *Sports Med*. 2023;53(3):649–665. 15 studies.
- Reynolds JM, Gordon TJ, Robergs RA. Prediction of one repetition maximum strength from multiple repetition maximum testing and anthropometry. *J Strength Cond Res*. 2006;20(3):584–592. n = 70.
- Robinson ZP, Pelland JC, Remmert JF, et al. Exploring the dose–response relationship between estimated resistance training proximity to failure, strength gain, and muscle hypertrophy: a series of meta-regressions. *Sports Med*. 2024;54(9):2209–2231.
- Rogerson D, Nolan D, Androulakis Korakakis P, Immonen V, Wolf M, Bell L. Deloading practices in strength and physique sports: a cross-sectional survey. *Sports Med Open*. 2024;10:26. n = 246.
- Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW. Strength and hypertrophy adaptations between low- vs. high-load resistance training: a systematic review and meta-analysis. *J Strength Cond Res*. 2017;31(12):3508–3523. 21 studies. (Schoenfeld 2017a)
- Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response relationship between weekly resistance training volume and increases in muscle mass: a systematic review and meta-analysis. *J Sports Sci*. 2017;35(11):1073–1082. 15 studies. (Schoenfeld 2017b)
- Schoenfeld BJ, Pope ZK, Benik FM, et al. Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men. *J Strength Cond Res*. 2016;30(7):1805–1812. RCT, n = 21.
- Singer A, Wolf M, Generoso L, et al. Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy. *Front Sports Act Living*. 2024;6:1429789. 9 studies.
- Zourdos MC, Klemp A, Dolan C, et al. Novel resistance training-specific rating of perceived exertion scale measuring repetitions in reserve. *J Strength Cond Res*. 2016;30(1):267–275. n = 29.
