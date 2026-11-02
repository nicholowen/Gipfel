# Gipfel curriculum guidelines

How Gipfel decides what to teach, in what order, and how graded stories fit in. Every new level and story follows this document. If a decision here changes, change this document first.

## Goal

- **Conversational German** for English-speaking learners: understanding and taking part in everyday conversation, not passing exams.
- **A long road, not a short course.** The curriculum starts from zero and keeps going: A1 and A2 first, then a speaking milestone, then B1 and B2 and beyond. Reaching the speaking milestone does not end the curriculum; new levels keep coming.
- **Steady pace.** Designed for roughly 20–40 minutes a day. The method is not built for cramming.
- **Speaking matters most.** Reading and flashcards serve speaking; they are not the end goal.

## Principle 1: the app is one strand of four

Paul Nation's four strands framework says a balanced course gives roughly equal time to four kinds of learning:

| Strand | What it is | Where it happens |
| --- | --- | --- |
| Meaning-focused input | Reading and listening to things you mostly understand | Graded stories, read aloud |
| Meaning-focused output | Speaking and writing to get a message across | Real conversation, outside the app |
| Language-focused learning | Deliberate study of words, phrases and grammar | Lessons and reviews (the SRS) |
| Fluency development | Getting faster with what you already know | Re-reading easy stories, quick reviews |

Consequences:

- Gipfel's SRS covers only language-focused learning. It must not try to be the whole course.
- Graded stories with audio are the input strand and part of the fluency strand. They are a core feature, not an extra.
- Speaking happens outside the app (a tutor, a German speaker the learner knows). The app flags when the learner is ready (see the speaking milestone below) and the stories rehearse the exchanges they will meet.
- Suggested daily split once stories exist: about half SRS, half reading and listening. Speaking practice joins at the milestone.

## Principle 2: teach the most useful words first

- **Frequency first.** Order words by how often they occur in everyday spoken German. A relatively small set of very frequent words covers most of what people say, so frequency order gives the fastest return at every stage.
- **Spoken register.** Prefer the words people say over the words people write. For example, *gucken* alongside *sehen*, *kriegen* later alongside *bekommen*.
- **Function words early.** *und, aber, ich, du, nicht, kein, ein, in, mit, auch, schon, noch* make up much of running speech. Stories and conversation are impossible without them.
- **Conversation needs.** Greetings, polite forms, asking for repetition, talking about yourself, family, home, food, plans, work, feelings, opinions.
- **Stories may add a few words, but do not steer.** Frequency decides the curriculum and stories are written to fit it. A story may pull a useful word into the next level; it never pulls in rare words (no turnips and wolves in early levels unless glossed).
- CEFR word lists (A1, A2, B1) are a sanity check for gaps, not a target.

## Principle 3: phrases are first-class items

Formulaic sequences (ready-made chunks) predict speaking fluency and give a processing advantage: faster speech, fewer pauses. So:

- Add a **phrase** item kind, taught and reviewed as a whole unit: *Wie geht's?*, *Ich weiß nicht.*, *Kannst du das wiederholen?*, *Ich hätte gern …*, *Keine Ahnung.*
- A phrase can come before the grammar that explains it. You learn *Ich hätte gern* long before the subjunctive.
- Accept reasonable variants (punctuation, *geht's* / *geht es*).
- Aim for roughly 20–30% of each level's items to be phrases in the early stages. Later stages shift toward collocations and idioms (*eine Entscheidung treffen*, *Das ist mir egal*).

## Principle 4: recall the German, not just the meaning

- Reviews ask both directions, typed: German → English (meaning) and English → German (production).
- Typed English → German recall is the format that best builds the ability to produce words, which is what speaking needs. Keep it, and never fall back to multiple choice.
- Nouns are always learned with their article. Capitalisation and article mistakes get a nudge, as now.

## Principle 5: group by scene, never by category

Teaching tightly related words together (all family members, all colours, all numbers, all days) causes interference: learners mix them up. Words connected by a theme or a scene (*Mutter, Kuchen, backen, warm*) help each other stick. Research results are mixed but the mainstream advice is consistent, so:

- **At most two words from the same tight category in one level.** Category sets (family, numbers, days, colours, body parts, rooms) are spread across several levels.
- **Opposite pairs are spread too** where possible (*groß* now, *klein* a level later). Level 1 predates this rule and is left as is.
- **Build each level around one or two scenes** (meeting someone, at the bakery, a phone call), so its words and its story belong together.
- Numbers are taught gradually, a few per level, and practised inside phrases (*um drei Uhr*, *zwei Kaffee, bitte*).

## Principle 6: grammar order serves conversation

Grammar comes in through items, phrases and stories, in this order.

**A1–A2**

1. **Present tense** of the core verbs, with *ich*, *du*, *er/sie/es*, *wir*, *ihr*, *Sie*. Verb items need forms beyond the current `present3sg`, which is a data model change.
2. **du vs Sie.** *du* for friends and family, *Sie* for polite first meetings. Both are taught early because the switch is a real social moment.
3. Word order: verb second, questions, *nicht* vs *kein*.
4. Accusative (*den Schuh*), then modal verbs (*können, wollen, möchten, müssen*).
5. **Spoken past** (Perfekt: *ich habe gemacht, ich bin gegangen*). Prioritised because conversation uses it constantly.
6. Dative (*mit dem Auto, in der Küche*), separable verbs (*anrufen*), *war* / *hatte*.
7. *weil*, *dass*, *wenn* with verb-final order.

**B1 and beyond**

8. Reflexive verbs, comparatives and superlatives, adjective endings in full.
9. Subjunctive for politeness and wishes (*würde, hätte, wäre, könnte*).
10. Narrative past (Präteritum) in full, relative clauses.
11. Passive, genitive, more connectors (*obwohl, trotzdem, deshalb*), indirect speech.

## Principle 7: level size and pacing

- **Levels of 25–35 items.** The WaniKani-style structure stays: the next level unlocks when 90% of the current one reaches the known stage (stage 5), which takes at least about 3.5 days. In code the review stages are numbered 1–9 and grouped 1–5; each theme gives the groups its own names, so the curriculum never uses WaniKani's names.
- At 20–40 minutes a day that is a sustainable pace of a level roughly every 5–8 days.
- Each level mixes new words (mostly), phrases, and one grammar point at most.
- Compounds unlock when their parts reach the known stage, as now. Use compounds freely: they are cheap to learn once the parts are known.
- Item ids are permanent because progress is keyed on them. Never rename or reuse an id.
- **There is no final level.** Content is added in stages (below) for as long as the learner keeps going.

## Principle 8: graded stories

Stories live in `content/stories/`, one JSON file each, and are listed in `src/content/stories.ts`. Words are matched to items automatically; annotate only what can't be matched: `Wort{item-id}` for an ambiguous form, `Wort{?gloss}` for a word not taught yet, `Name{-}` for a name (or list names in `names`). `npm run validate-content` reports every word that doesn't resolve and each story's coverage.


- **Coverage.** At least 95% of the running words in a story must be known (item at the known stage or higher); aim for 98%. Everything else is glossed, tap to reveal.
- **Readiness is computed, not hand-assigned.** A story unlocks when the learner's known words cover at least 95% of it, and shows its coverage percentage.
- **Every word is annotated** with its item id when the story is written, so coverage is exact and no language processing is needed.
- **Mostly everyday scenes and dialogues:** meeting someone, a dinner with friends, a phone call, weekend plans, shopping, the doctor, work. They model the lines the learner will actually say.
- **Folk tales are an occasional treat:** simplified retellings of public-domain tales from any language (Grimm, Aesop, Andersen, folk stories such as *Die Rübe* or *Steinsuppe*). Modern simplified versions are usually copyrighted, so adapt from the originals.
- **Tense follows the grammar order:** present tense until the Perfekt is taught, narrative past only later.
- **Length grows:** about 50–100 words at first, 200–400 by A2, 500–1,500 at B1, and short chapter-style stories after that.
- **Every story is read aloud** (speech synthesis now, recorded audio later if possible), so reading also trains listening and rhythm.
- **A recurring cast** (the Bear, the Diva and the Box from the gender mnemonics) is welcome for early original stories.
- Roughly one story per level from Level 2 on.
- Open question: whether tapping a gloss can add that word to the lesson queue.

## Stages and vocabulary targets

Coverage research gives rough targets. In everyday spoken language, around 2,000–3,000 word families cover about 95% of what is said, and around 5,000–7,000 cover about 98%. Most of this research is on English; German is broadly similar, with compounds making some words cheaper and inflection making each word more work. Treat the numbers as signposts, not promises.

| Stage | Roughly | What the learner can do | Content focus |
| --- | --- | --- | --- |
| 1. Foundations (A1) | First ~500 items | Simple exchanges, introduce yourself, follow slow simple speech | Most frequent words, function words, survival phrases, present tense |
| **Speaking milestone** | ~400–500 items known | Start simple real conversations | (see below) |
| 2. Everyday (A2) | ~500–1,500 | Talk about your life, plans and past, handle routine situations | Perfekt, dative, everyday scenes, more phrases |
| 3. Conversational (B1) | ~1,500–3,000 | Hold a conversation on familiar topics, follow most everyday speech with effort | Subordinate clauses, opinions, storytelling, collocations |
| 4. Fluent everyday (B2) | ~3,000–5,000+ | Follow natural speech, talk comfortably on most topics | Less frequent words, idioms, register, longer stories |
| 5. Beyond | 5,000+ | Native content becomes the main input | Words met in real books, shows and conversation |

Pacing: at about 30 items per level and a level every 5–8 days, 1,000 items takes roughly 5–9 months and 3,000 items roughly 1.5–2.5 years. That is the honest speed of this method; the other three strands make that vocabulary usable.

Later stages change the balance rather than the method:

- Graded stories give way to lightly adapted and then real texts (news in simple German, podcasts, TV with subtitles).
- Words met in real input matter more than frequency lists. A possible feature: let the learner add words they meet to their own queue.
- At B2 and beyond, the SRS becomes a maintenance and top-up tool alongside a mostly input- and conversation-based routine.

## The speaking milestone

When the learner has about 400–500 items at the known stage, the present tense, *du*/*Sie*, and a core set of phrases (greetings, introducing yourself, asking for repetition, likes and dislikes), the app says they are ready for simple real conversations. From then on, speaking practice is part of the daily routine, and the stories rehearse those conversations. At 20–40 minutes a day this is expected around two to three months in.

The milestone is a checkpoint, not a finish line. Levels continue as before.

## Quality

- Claude writes the German. It is accurate but not native, so a native speaker (a tutor for an hour) should review stories and phrases every few levels, and everything before any public release.
- `npm run validate-content` must pass for every level.

## Authoring checklist for a new level

1. Take the next most frequent words and phrases not yet taught.
2. Pick one or two scenes and choose items that fit them, with at most two from any tight category.
3. Add at most one grammar point.
4. Write the level's story, annotate every word, and check coverage against all items up to and including this level (95% minimum, 98% target).
5. If the story needs a useful word, add it to this level or the next; if it needs a rare word, gloss it.
6. Write mnemonics and examples. Examples use only known words where possible.
7. Validate and run the tests.

## Research behind this

- Nation, I.S.P. (2007). *The four strands.* Innovation in Language Learning and Teaching, 1(1), 2–13.
- Nation, I.S.P. (2006). How large a vocabulary is needed for reading and listening? *Canadian Modern Language Review*, 63(1), 59–82.
- Nation, I.S.P. (2013). *Learning Vocabulary in Another Language* (2nd ed.). Cambridge University Press.
- Adolphs, S. & Schmitt, N. (2003). Lexical coverage of spoken discourse. *Applied Linguistics*, 24(4), 425–438.
- Kim, S.K. & Webb, S. (2022). The effects of spaced practice on second language learning: a meta-analysis. *Language Learning*, 72(1), 269–319.
- Nakata, T. (2013). *Optimising second language vocabulary learning from flashcards.* PhD thesis, Victoria University of Wellington.
- Hu, M. & Nation, I.S.P. (2000). Unknown vocabulary density and reading comprehension. *Reading in a Foreign Language*, 13(1).
- Schmitt, N., Jiang, X. & Grabe, W. (2011). The percentage of words known in a text and reading comprehension. *Modern Language Journal*, 95(1).
- Tinkham, T. (1993, 1997). Semantic and thematic clustering in second language vocabulary learning. *System* 21; *Second Language Research* 13.
- François, J. & Albakry, M. (2021). Effect of formulaic sequences on fluency of English learners in standardized speaking tests. *Language Learning & Technology*, 25(2), 26–41.
