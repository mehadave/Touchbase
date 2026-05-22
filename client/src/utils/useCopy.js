// src/utils/useCopy.js
// Touchbase tone-aware copy utility
// Usage: import { c } from './utils/useCopy'
//        c('greeting.allGood', userTone)

const copy = {

  greeting: {
    allGood: {
      genz:       { main: "ok you're actually doing it. 🔥", sub: "nobody's drifting. legendary behavior." },
      millennial: { main: "you're all caught up ✌️",          sub: "nobody's drifting. genuinely impressive." },
      genx:       { main: "network's in good shape.",         sub: "no action needed right now." },
      boomer:     { main: "Everything looks good today.",     sub: "Your network is in great shape. Well done." },
    },
    overdueMany: {
      genz:       { main: "ngl your network is screaming rn", sub: "people haven't heard from you in a minute. fix that." },
      millennial: { main: "okay, a few people need attention", sub: "it's been a while for some folks. time to check in." },
      genx:       { main: "several contacts overdue.",        sub: "worth addressing today." },
      boomer:     { main: "A few people are waiting to hear from you.", sub: "It would be good to reach out today." },
    },
    streakBroken: {
      genz:       { main: "ok so you fell off. it happens.", sub: "who's the easiest person to ping rn? start there." },
      millennial: { main: "streak's broken, but it's fine.", sub: "pick one person and start fresh." },
      genx:       { main: "streak ended. start a new one.", sub: "one message is all it takes." },
      boomer:     { main: "Your streak has ended — no worries.", sub: "A fresh start begins with one simple message." },
    },
    streakMilestone: {
      genz:       { main: "bestie is CONSISTENT 🎉",           sub: "your network can feel it. keep going." },
      millennial: { main: "okay, a streak milestone! 🙌",      sub: "your network is noticing. keep it up." },
      genx:       { main: "milestone hit. good work.",         sub: "keep the momentum going." },
      boomer:     { main: "Congratulations on your streak milestone!", sub: "Consistent effort makes all the difference." },
    },
    comingBack: {
      genz:       { main: "you're back. no judgment.",        sub: "let's ease back in. one person. that's it." },
      millennial: { main: "welcome back, no stress.",         sub: "just pick one person to start with." },
      genx:       { main: "back at it. good.",                sub: "start small. one contact." },
      boomer:     { main: "Welcome back. No need to catch up all at once.", sub: "Start with one person — that's plenty." },
    },
  },

  orbitState: {
    inOrbit: {
      genz:       { label: "in orbit 🌟",   sub: "you two are locked in" },
      millennial: { label: "in orbit 🌟",   sub: "staying connected nicely" },
      genx:       { label: "active",        sub: "in regular contact" },
      boomer:     { label: "Connected",     sub: "In regular contact" },
    },
    drifting: {
      genz:       { label: "drifting 🪐",   sub: "starting to drift a lil" },
      millennial: { label: "drifting 🪐",   sub: "been a couple weeks" },
      genx:       { label: "drifting",      sub: "2–3 weeks, no contact" },
      boomer:     { label: "Drifting",      sub: "It's been a couple of weeks" },
    },
    darkSide: {
      genz:       { label: "dark side 🌑",  sub: "ok this is getting awkward" },
      millennial: { label: "dark side 🌑",  sub: "been over a month — time to check in" },
      genx:       { label: "overdue",       sub: "over a month, no contact" },
      boomer:     { label: "Overdue",       sub: "It has been over a month" },
    },
    lostInSpace: {
      genz:       { label: "lost in space 💫", sub: "bro. where did you go." },
      millennial: { label: "lost in space 💫", sub: "it's been a while. still fixable." },
      genx:       { label: "inactive",         sub: "2+ months. needs attention." },
      boomer:     { label: "Inactive",         sub: "It has been quite some time. Worth reconnecting." },
    },
  },

  nudge: {
    contactJobChange: {
      genz:       { main: "{name} just switched jobs — that's literally a free opener", sub: "congrats messages have a 100% open rate. just saying." },
      millennial: { main: "{name} just switched jobs — perfect time to reach out", sub: "a quick congrats goes a long way." },
      genx:       { main: "{name} changed jobs. good opener.", sub: "congrats messages always land well." },
      boomer:     { main: "{name} has recently changed jobs.", sub: "This is a wonderful opportunity to reconnect and offer your congratulations." },
    },
    nothingLoggedToday: {
      genz:       { main: "your network said left on read today 👀", sub: "even one message counts. who's on your mind?" },
      millennial: { main: "haven't connected with anyone today yet", sub: "even a quick message counts." },
      genx:       { main: "no touchpoints today.", sub: "one message keeps the streak alive." },
      boomer:     { main: "You haven't connected with anyone today.", sub: "Even a brief message makes a difference." },
    },
    contactSilent: {
      genz:       { main: "{name} hasn't heard from you in a while", sub: "they're not gone, just quiet. your move." },
      millennial: { main: "{name}'s been quiet for {days} days", sub: "probably time to check in." },
      genx:       { main: "{name}: {days} days, no contact.", sub: "worth a message." },
      boomer:     { main: "It has been {days} days since you last spoke with {name}.", sub: "A short message would be warmly received." },
    },
    threeLoggedToday: {
      genz:       { main: "okay THREE messages today?? main character behavior", sub: "your network is eating good rn." },
      millennial: { main: "three touchpoints today — you're on a roll 🙌", sub: "your network is thriving." },
      genx:       { main: "3 touchpoints today. solid.",  sub: "keep it up." },
      boomer:     { main: "You've reached out to three people today — excellent work.", sub: "Your network will feel the difference." },
    },
  },

  logConfirm: {
    hadCoffee: {
      genz:       "love that for you two ☕",
      millennial: "love that. coffee always counts ☕",
      genx:       "logged. good use of time.",
      boomer:     "Wonderful. Personal meetings are invaluable.",
    },
    checkedIn: {
      genz:       "that's all it takes honestly 👋",
      millennial: "nice one. a check-in goes a long way 👋",
      genx:       "logged. that counts.",
      boomer:     "Noted. Staying in touch is always worthwhile.",
    },
    sentMessage: {
      genz:       "said something. respect 💬",
      millennial: "message sent. you're doing great 💬",
      genx:       "message logged.",
      boomer:     "Logged. A message is always appreciated.",
    },
    bigMoment: {
      genz:       "noted. be there for them fr 🎉",
      millennial: "noted! be there for them 🎉",
      genx:       "noted. show up for this one.",
      boomer:     "Noted. Moments like these strengthen relationships.",
    },
  },

  emptyState: {
    noContacts: {
      genz:       { main: "your people go here.", sub: "start with someone you already know. doesn't have to be profound." },
      millennial: { main: "your network starts here.", sub: "add someone you already know — that's the easiest first step." },
      genx:       { main: "no contacts yet.", sub: "add someone you're already in touch with." },
      boomer:     { main: "Your network is empty for now.", sub: "Begin by adding someone you already know well." },
    },
    noDue: {
      genz:       { main: "you're clear. enjoy it.", sub: "it won't last forever lol." },
      millennial: { main: "all clear! enjoy the moment.", sub: "it won't last forever, but that's okay." },
      genx:       { main: "nothing due.", sub: "good position to be in." },
      boomer:     { main: "Nothing is due today.", sub: "You're in excellent shape. Enjoy it." },
    },
    noTemplates: {
      genz:       { main: "no good openers yet?", sub: "add one thing you'd actually send to a real person." },
      millennial: { main: "no templates yet.", sub: "add a message you'd genuinely send to someone." },
      genx:       { main: "no templates.", sub: "add one you'd actually use." },
      boomer:     { main: "You have no message templates yet.", sub: "Add one you would genuinely send to a contact." },
    },
  },

};

/**
 * Get copy for a given key and tone.
 * @param {string} path - dot-notation key e.g. 'greeting.allGood'
 * @param {string} tone - 'genz' | 'millennial' | 'genx' | 'boomer'
 * @param {object} vars - optional replacements e.g. { name: 'Arjun', days: 14 }
 * @returns {object|string} the copy object or string for that key + tone
 */
export function c(path, tone = 'millennial', vars = {}) {
  const keys = path.split('.');
  let result = copy;
  for (const key of keys) {
    result = result?.[key];
    if (!result) return '';
  }
  const toneResult = result?.[tone] ?? result?.millennial ?? '';
  if (typeof toneResult === 'string') {
    return interpolate(toneResult, vars);
  }
  if (typeof toneResult === 'object') {
    return {
      main: interpolate(toneResult.main ?? '', vars),
      sub:  interpolate(toneResult.sub  ?? '', vars),
      label: interpolate(toneResult.label ?? '', vars),
    };
  }
  return toneResult;
}

function interpolate(str, vars) {
  return str.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

export default c;
