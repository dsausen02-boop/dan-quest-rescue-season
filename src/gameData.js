export const GAME_TITLE = "DAN QUEST: Rescue Season";

export const CHARACTERS = [
  { id: "mendel", name: "Mendel", initials: "ME", color: "#ee6656", hp: 126, attack: 16, speed: 258, cooldown: 350, range: 570, passive: "Monkey Friend", basic: "Banana Throw", ultimate: "MONKEY ARMY", description: "Kidnapped into the Bedouin Desert. Monkey-themed chaos and banana pressure.", style: "banana", voice: "Monkey time.", visual: "banana attacks, monkey companion shapes, desert jungle dust" },
  { id: "goodman", name: "Goodman", initials: "GO", color: "#6f8ea8", hp: 138, attack: 16, speed: 232, cooldown: 470, range: 540, passive: "Aggressive Accounting", basic: "Spreadsheet Blast", ultimate: "Hold My Beer", description: "Argument-heavy bruiser pulled into the Debate Republic.", style: "spreadsheet", voice: "Check the numbers.", visual: "paperwork storms, angry finance stamps, aggressive animations" },
  { id: "giat", name: "Giat", initials: "GI", color: "#58c7a6", hp: 120, attack: 14, speed: 250, cooldown: 360, range: 530, passive: "Low Cost Confusion", basic: "Budget Shot", ultimate: "Low Cost Apocalypse", description: "Confuses enemies with impossible discounts.", style: "budget", voice: "Low cost.", visual: "confused animations, price tags, discount bursts" },
  { id: "farber", name: "Farber", initials: "FA", color: "#c97848", hp: 166, attack: 20, speed: 224, cooldown: 520, range: 430, passive: "Tactical Mechanic", basic: "Tactical Strike", ultimate: "Garage King", description: "Dragged toward the Other Friend Group, but the garage still calls.", style: "tactical", voice: "Move out.", visual: "wrenches, tactical pings, barrage markers" },
  { id: "aviad", name: "Aviad", initials: "AV", color: "#55b8dc", hp: 142, attack: 15, speed: 242, cooldown: 410, range: 440, passive: "Eternal Rookie", basic: "Charge", ultimate: "Return To Service", description: "Rookie military visuals, reserve soldiers, and brave charges.", style: "charge", voice: "Back to the army.", visual: "helmet, reserve soldiers, training smoke" },
  { id: "david", name: "David", initials: "DA", color: "#85d6ff", hp: 132, attack: 18, speed: 238, cooldown: 450, range: 520, passive: "AI Addiction", basic: "AI Tool", ultimate: "Drone Swarm", description: "Lost inside the AI Nexus and still optimizing the prompt.", style: "ice", voice: "Winter is here.", visual: "AI tools, drone arcs, frozen-blue model bursts" },
  { id: "amichai", name: "Amichai", initials: "AM", color: "#4fb46f", hp: 150, attack: 20, speed: 246, cooldown: 430, range: 210, passive: "Sleeping Beast", basic: "Punch Combo", ultimate: "Soccer Tournament Mode", description: "Pulled into Casino Kingdom until soccer wakes him up.", style: "punch", voice: "Let's go!", visual: "sleep bubble, soccer bursts, beast mode transformation" },
  { id: "halel", name: "Halel", initials: "HA", color: "#9b78de", hp: 126, attack: 18, speed: 286, cooldown: 430, range: 610, passive: "Precision", basic: "Focused Shot", ultimate: "VIP Entrance", description: "Precise ranged hero with royal confidence in the Party Dimension.", style: "precision", voice: "Focus.", visual: "sharp reticles, purple beams, VIP entrance sigils" },
  { id: "hadar", name: "Hadar", initials: "HD", color: "#ff9fc0", hp: 144, attack: 16, speed: 240, cooldown: 450, range: 500, passive: "Everybody Loves Hadar", basic: "YouTube Tutorial", ultimate: "Window Cleaning Frenzy", description: "Trapped in Mom's Kingdom between chores, windows and errands.", style: "confusion", voice: "I don't know.", visual: "window cleaning effects, question pulses, washing machine sparks" },
  { id: "tal", name: "Tal", initials: "TA", color: "#ff8f52", hp: 170, attack: 21, speed: 234, cooldown: 550, range: 560, passive: "Argument Mode", basic: "Argument Shot", ultimate: "Debate Overload", description: "Always debating. Fires books, slides, and paper beams.", style: "debate", voice: "I disagree.", visual: "books, presentations, paper effects, debate beam" },
  { id: "amit", name: "Amit", initials: "AT", color: "#8ba3ff", hp: 166, attack: 14, speed: 230, cooldown: 500, range: 470, passive: "Rabbi Aura", basic: "Torah Scroll", ultimate: "RABBI MODE", description: "Transforms into giant Rabbi mode to heal and buff the team.", style: "rabbi", voice: "Children, calm down.", visual: "scrolls, calm aura, giant rabbi silhouette" },
  { id: "gelman", name: "Gelman", initials: "GE", color: "#f5c451", hp: 142, attack: 17, speed: 234, cooldown: 560, range: 540, passive: "Business Class", basic: "Work Orders", ultimate: "Thailand Spending Spree", description: "Luxury Kingdom keeps asking him to spend more money.", style: "business", voice: "Book it.", visual: "money effects, business orders, Thailand recovery shine" },
  { id: "kuzar", name: "Kuzar", initials: "KU", color: "#68c58a", hp: 132, attack: 20, speed: 250, cooldown: 390, range: 470, passive: "Chaos", basic: "Agig Strike", ultimate: "AGIG", description: "Chaos specialist. AGIG is both the plan and the explosion.", style: "agig", voice: "AGIG!", visual: "coupon scraps, unstable green sparks, massive AGIG blast" },
  { id: "bruiner", name: "Bruiner", initials: "BR", color: "#b78cff", hp: 118, attack: 13, speed: 210, cooldown: 650, range: 450, passive: "Sleeping Everywhere", basic: "Sleep Toss", ultimate: "Power Nap", description: "Comfort Kingdom promised one more minute of relaxing.", style: "sleep", voice: "Five more minutes.", visual: "sleeping animations, pillow shockwaves, dream bubbles" },
  { id: "dan", name: "Dan", initials: "DN", color: "#fff1a8", hp: 240, attack: 32, speed: 270, cooldown: 300, range: 680, passive: "The Chosen One", basic: "Energy Slash", ultimate: "Weekend Miracle", description: "Final legendary rescue. Dan was pulled away by family life.", style: "blessing", voice: "I returned.", visual: "white and gold aura, family kingdom light, heroic slash" }
];

export const HERO_ART = {
  mendel: "/assets/heroes/mendel.png",
  goodman: "/assets/heroes/goodman.png",
  giat: "/assets/heroes/giat.png",
  farber: "/assets/heroes/farber.png",
  aviad: "/assets/heroes/aviad.png",
  david: "/assets/heroes/david.png",
  amichai: "/assets/heroes/amichai.png",
  halel: "/assets/heroes/halel.png",
  hadar: "/assets/heroes/hadar.png",
  tal: "/assets/heroes/tal.png",
  amit: "/assets/heroes/amit.png",
  gelman: "/assets/heroes/gelman.png",
  kuzar: "/assets/heroes/kuzar.png",
  bruiner: "/assets/heroes/bruiner.svg",
  dan: "/assets/heroes/dan.png"
};

export const KASHI_ART = "/assets/heroes/kashi.png";

CHARACTERS.forEach((hero) => {
  hero.image = HERO_ART[hero.id];
});

export const CHARACTER_BY_ID = Object.fromEntries(CHARACTERS.map((hero) => [hero.id, hero]));

export const COMBOS = [
  { id: "hadar-halel", name: "Royal Reunion", heroes: ["hadar", "halel"], bonus: { attack: 0.12, speed: 0.04 }, line: "Hadar + Halel: royal confusion finally points forward.", color: "#d8a5ff", projectile: "proj-confusion" },
  { id: "tal-amit", name: "Rabbi Presentation", heroes: ["tal", "amit"], bonus: { attack: 0.09, health: 0.12 }, line: "Tal has a plan. Amit asks him not to.", color: "#ffcf8a", projectile: "proj-scroll" },
  { id: "mendel-goodman", name: "Bedouin Operation", heroes: ["mendel", "goodman"], bonus: { attack: 0.14 }, line: "Goodman asks if this is legal. Mendel says probably not.", color: "#ffd45c", projectile: "proj-banana" },
  { id: "aviad-farber", name: "Garage Protocol", heroes: ["aviad", "farber"], bonus: { health: 0.1, attack: 0.08 }, line: "Aviad + Farber: rookie drills meet garage tools.", color: "#9fd8ff", projectile: "proj-wrench" },
  { id: "gelman-kuzar", name: "Market Crash", heroes: ["gelman", "kuzar"], bonus: { attack: 0.16 }, line: "Gelman buys it. Kuzar absolutely does not.", color: "#d8f56f", projectile: "proj-money" },
  { id: "david-amichai", name: "AI Sports Betting", heroes: ["david", "amichai"], bonus: { speed: 0.08, attack: 0.1 }, line: "David models the odds. Amichai wakes up for the match.", color: "#b6f0ff", projectile: "proj-ball" },
  { id: "giat-bruiner", name: "Low Cost Expedition", heroes: ["giat", "bruiner"], bonus: { health: 0.08, speed: 0.06 }, line: "Giat asks if this is Low Cost. Bruiner was sleeping.", color: "#b8f7c8", projectile: "proj-coupon" }
];

export function activeCombos(party) {
  const ids = new Set(party);
  return COMBOS.filter((combo) => combo.heroes.every((id) => ids.has(id)));
}

export function comboBonusForParty(party) {
  return activeCombos(party).reduce((bonus, combo) => {
    bonus.attack += combo.bonus.attack || 0;
    bonus.health += combo.bonus.health || 0;
    bonus.speed += combo.bonus.speed || 0;
    return bonus;
  }, { attack: 0, health: 0, speed: 0 });
}

export const MISSIONS = [
  { level: 1, season: 1, focusHero: "tal", rescue: "tal", title: "Presentation Empire", subtitle: "Tal fights to keep the group together through endless slides, meetings and arguments.", map: "presentationEmpire", joke: "Tal survived the meeting and found the first thread back to the group.", enemyPool: ["presentationIntern", "meetingEnforcer", "slideBomber"], boss: { name: "Presentation Emperor", type: "presentationEmperor", hp: 520, color: "#ff8f52", eliteEnemy: "meetingEnforcer", phases: ["Intro Slides", "Meeting Spiral", "Argument Loop", "Final Slide"], summonLine: "More slides." }, unlock: "mendel", reward: 5 },
  { level: 2, season: 1, focusHero: "mendel", rescue: "mendel", title: "Bedouin Desert", subtitle: "Mendel was kidnapped by Bedouins, and the monkeys are making it everyone else's problem.", map: "bedouinDesert", joke: "MENDEL I FOUND YOU echoes across the dunes.", enemyPool: ["bedouinWarrior", "desertRaider", "monkey"], boss: { name: "Bedouin King", type: "bedouinKing", hp: 680, color: "#d9a45f", eliteEnemy: "bedouinWarrior", phases: ["Desert Call", "Monkey Confusion", "Dune Charge", "Royal Tent"], summonLine: "The desert answers." }, unlock: "amichai", reward: 6 },
  { level: 3, season: 1, focusHero: "amichai", rescue: "amichai", title: "Casino Kingdom", subtitle: "Amichai wakes up somewhere between poker tables, bad odds and soccer highlights.", map: "casinoKingdom", joke: "The Poker King folded when soccer appeared on screen.", enemyPool: ["cardDealer", "casinoGuard", "pokerPro"], boss: { name: "Poker King", type: "pokerKing", hp: 820, color: "#4fb46f", eliteEnemy: "pokerPro", phases: ["Opening Hand", "Bad Beat", "All In", "Final Table"], summonLine: "Shuffle up." }, unlock: "hadar", reward: 8 },
  { level: 4, season: 1, focusHero: "hadar", rescue: "hadar", title: "Mom's Kingdom", subtitle: "Hadar faces chores, cleaning, errands and the eternal window tutorial.", map: "momsKingdom", joke: "The washing machine blinked first.", enemyPool: ["choreBot", "errandRunner", "cleaningInspector"], boss: { name: "Mom Supreme", type: "momSupreme", hp: 1040, color: "#ff9fc0", eliteEnemy: "cleaningInspector", phases: ["Chore List", "Errand Route", "Window Check", "Mom Voice"], summonLine: "Clean this too." }, unlock: "amit", reward: 9 },
  { level: 5, season: 1, focusHero: "amit", rescue: "amit", title: "Date Dimension", subtitle: "Amit gets pulled into endless dating loops and calendar reminders.", map: "dateDimension", joke: "Amit stayed calm through twelve awkward introductions.", enemyPool: ["matchmakerAgent", "dateReminder", "calendarSniper"], boss: { name: "Matchmaker Queen", type: "matchmakerQueen", hp: 1260, color: "#8ba3ff", eliteEnemy: "matchmakerAgent", phases: ["Small Talk", "Dinner Plans", "Family Questions", "Perfect Match"], summonLine: "Another option." }, unlock: "halel", reward: 10 },
  { level: 6, season: 1, focusHero: "halel", rescue: "halel", title: "Party Dimension", subtitle: "Halel is trapped in parties, girls, nightlife and one impossible guest list.", map: "partyDimension", joke: "The VIP rope moved aside out of respect.", enemyPool: ["partyBouncer", "nightlifeScout", "influencerDrone"], boss: { name: "Influencer Queen", type: "influencerQueen", hp: 1480, color: "#9b78de", eliteEnemy: "partyBouncer", phases: ["Guest List", "Story Post", "After Party", "VIP Entrance"], summonLine: "Bring the crowd." }, unlock: "david", reward: 12 },
  { level: 7, season: 1, focusHero: "david", rescue: "david", title: "AI Nexus", subtitle: "David disappeared into artificial intelligence and now the prompts are shooting back.", map: "aiNexus", joke: "The AI Core apologized, then generated three more problems.", enemyPool: ["aiBot", "promptSniper", "modelCore"], boss: { name: "AI Core", type: "aiCore", hp: 1720, color: "#85d6ff", eliteEnemy: "modelCore", phases: ["Prompt", "Fine Tune", "Recursive Loop", "Core Dump"], summonLine: "Generating backup." }, unlock: "farber", reward: 13 },
  { level: 8, season: 1, focusHero: "farber", rescue: "farber", title: "Other Friend Group", subtitle: "Farber is being pulled away by another friend group and too many invitations.", map: "otherFriendGroup", joke: "The Other Guys respected the wrench.", enemyPool: ["otherGuy", "groupPuller", "inviteBomber"], boss: { name: "The Other Guys", type: "otherGuys", hp: 1940, color: "#c97848", eliteEnemy: "groupPuller", phases: ["New Chat", "Second Invite", "Weekend Plan", "Group Photo"], summonLine: "Add him to the chat." }, unlock: "goodman", reward: 14 },
  { level: 9, season: 1, focusHero: "goodman", rescue: "goodman", title: "Debate Republic", subtitle: "Goodman gets trapped by politics, arguments and debates that refuse to end.", map: "debateRepublic", joke: "The debate ended because Goodman made it louder.", enemyPool: ["debateHost", "argumentAgent", "policySniper"], boss: { name: "Progressive Queen", type: "progressiveQueen", hp: 2160, color: "#6f8ea8", eliteEnemy: "debateHost", phases: ["Opening Statement", "Counterpoint", "Crossfire", "Final Word"], summonLine: "New talking point." }, unlock: "gelman", reward: 15 },
  { level: 10, season: 1, focusHero: "gelman", rescue: "gelman", title: "Luxury Kingdom", subtitle: "Gelman keeps spending money on his girlfriend while receipts become enemies.", map: "luxuryKingdom", joke: "The Shopping Queen asked for gift wrap. Gelman asked for business class.", enemyPool: ["shopperGuard", "luxuryClerk", "receiptBomber"], boss: { name: "Shopping Queen", type: "shoppingQueen", hp: 2380, color: "#f5c451", eliteEnemy: "luxuryClerk", phases: ["Window Shopping", "Cart Full", "Luxury Tax", "Checkout"], summonLine: "Add to cart." }, unlock: "giat", reward: 16 },
  { level: 11, season: 1, focusHero: "giat", rescue: "giat", title: "Dad Kingdom", subtitle: "Giat is trapped between family life, reserve duty, responsibility and Low Cost energy.", map: "dadKingdom", joke: "Nobody knows if Dad Kingdom includes baggage.", enemyPool: ["diaperTrooper", "babyBottleMage", "shoppingCartCharger", "lowCostCollector", "reserveSoldier"], boss: { name: "Dad Life", type: "dadLife", hp: 2600, color: "#58c7a6", eliteEnemy: "reserveCommander", eliteEnemies: ["couponKing", "strollerTitan", "reserveCommander"], phases: ["Family Responsibilities", "Military Duties", "Low Cost Chaos"], phaseLines: ["Family life spills toys, strollers and paperwork across the arena.", "Reserve duty takes over: checkpoints, crates and radio chatter close in.", "LOW COST energy erupts into coupons, shopping carts and chaos."], summonLine: "Another responsibility." }, unlock: "kuzar", reward: 17 },
  { level: 12, season: 1, focusHero: "kuzar", rescue: "kuzar", title: "Football Market Kingdom", subtitle: "Kuzar hunts jerseys, deals and bargains while the market fights back.", map: "footballMarket", joke: "AGIG echoed through the bargain bin.", enemyPool: ["fakeJersey", "reseller", "auctionBidder", "collector"], boss: { name: "Football Collector", type: "footballCollector", hp: 2840, color: "#68c58a", eliteEnemy: "collector", phases: ["Fake Jersey", "Reseller Rush", "Auction War", "Collector Vault"], summonLine: "Raise the bid." }, unlock: "bruiner", reward: 18 },
  { level: 13, season: 1, focusHero: "bruiner", rescue: "bruiner", title: "Comfort Kingdom", subtitle: "Bruiner was not kidnapped. He was extremely comfortable.", map: "comfortKingdom", joke: "The Comfort Queen almost won by offering a better pillow.", enemyPool: ["comfortGuard", "couchDefender", "napEnforcer"], boss: { name: "Comfort Queen", type: "comfortQueen", hp: 3060, color: "#b78cff", eliteEnemy: "napEnforcer", phases: ["Soft Landing", "Warm Blanket", "Five More Minutes", "Power Nap"], summonLine: "Stay comfortable." }, unlock: "dan", reward: 20 },
  { level: 14, season: 1, focusHero: "dan", rescue: "dan", title: "Family Kingdom", subtitle: "Everyone thought Dan was kidnapped. The truth is family life pulled him away.", map: "familyKingdom", joke: "Dan was never gone. He was just in Family Kingdom.", enemyPool: ["familyScheduler", "choreBot", "errandRunner", "calendarSniper"], boss: { name: "Mrs. Dan", type: "mrsDan", hp: 3600, color: "#fff1a8", eliteEnemy: "familyScheduler", phases: ["Family Plans", "Dinner Time", "Weekend Miracle", "The Reunion"], summonLine: "Family first." }, reward: 24, final: true }
];

export const ENEMIES = {
  grapeSoldier: { name: "Grape Soldier", hp: 50, speed: 2.1, damage: 10, radius: 0.45, color: "#8e44ad", mode: "ranged" },
  grapeBrute: { name: "Grape Brute", hp: 150, speed: 1.05, damage: 18, radius: 0.8, color: "#56307a", mode: "blocker" },
  grapeSniper: { name: "Grape Sniper", hp: 58, speed: 1.55, damage: 16, radius: 0.42, color: "#b68cff", mode: "sniper" },
  vineSoldier: { name: "Vine Soldier", hp: 78, speed: 1.55, damage: 12, radius: 0.52, color: "#6bbf6a", mode: "trapper" },
  grapeBomber: { name: "Grape Bomber", hp: 82, speed: 1.35, damage: 20, radius: 0.55, color: "#df7ca4", mode: "bomber" },
  grapeKing: { name: "Grape King", hp: 260, speed: 0.95, damage: 24, radius: 0.95, color: "#f5c451", mode: "miniBoss" },
  monkey: { name: "Actual Monkey", hp: 42, speed: 2.8, damage: 8, radius: 0.42, color: "#9b6a3f", mode: "skirmisher" },
  bedouinWarrior: { name: "Bedouin Warrior", hp: 86, speed: 2.35, damage: 14, radius: 0.5, color: "#d9a45f", mode: "skirmisher" },
  presentationIntern: { name: "Presentation Intern", hp: 50, speed: 1.9, damage: 9, radius: 0.44, color: "#ff8f52", mode: "ranged" },
  meetingEnforcer: { name: "Meeting Enforcer", hp: 125, speed: 1.2, damage: 16, radius: 0.68, color: "#e8d8ad", mode: "blocker" },
  slideBomber: { name: "Slide Bomber", hp: 74, speed: 1.35, damage: 18, radius: 0.52, color: "#f5c451", mode: "bomber" },
  desertRaider: { name: "Desert Raider", hp: 74, speed: 2.45, damage: 13, radius: 0.48, color: "#c97848", mode: "skirmisher" },
  cardDealer: { name: "Card Dealer", hp: 56, speed: 1.75, damage: 11, radius: 0.44, color: "#4fb46f", mode: "ranged" },
  casinoGuard: { name: "Casino Guard", hp: 142, speed: 1.05, damage: 18, radius: 0.72, color: "#305f46", mode: "blocker" },
  pokerPro: { name: "Poker Pro", hp: 72, speed: 1.5, damage: 16, radius: 0.46, color: "#f5c451", mode: "sniper" },
  choreBot: { name: "Chore Bot", hp: 84, speed: 1.55, damage: 12, radius: 0.52, color: "#ff9fc0", mode: "trapper" },
  errandRunner: { name: "Errand Runner", hp: 62, speed: 2.5, damage: 12, radius: 0.45, color: "#d8f3ff", mode: "skirmisher" },
  cleaningInspector: { name: "Cleaning Inspector", hp: 180, speed: 1, damage: 21, radius: 0.9, color: "#f5c451", mode: "miniBoss" },
  matchmakerAgent: { name: "Matchmaker Agent", hp: 76, speed: 1.7, damage: 14, radius: 0.48, color: "#8ba3ff", mode: "trapper" },
  dateReminder: { name: "Date Reminder", hp: 58, speed: 2, damage: 11, radius: 0.42, color: "#d8a5ff", mode: "ranged" },
  calendarSniper: { name: "Calendar Sniper", hp: 64, speed: 1.4, damage: 17, radius: 0.42, color: "#85d6ff", mode: "sniper" },
  partyBouncer: { name: "Party Bouncer", hp: 150, speed: 1.2, damage: 19, radius: 0.76, color: "#9b78de", mode: "blocker" },
  nightlifeScout: { name: "Nightlife Scout", hp: 66, speed: 2.6, damage: 13, radius: 0.45, color: "#ff9fc0", mode: "skirmisher" },
  influencerDrone: { name: "Influencer Drone", hp: 60, speed: 1.7, damage: 15, radius: 0.42, color: "#d8a5ff", mode: "ranged" },
  aiBot: { name: "AI Bot", hp: 72, speed: 1.8, damage: 13, radius: 0.46, color: "#85d6ff", mode: "ranged" },
  promptSniper: { name: "Prompt Sniper", hp: 62, speed: 1.45, damage: 18, radius: 0.42, color: "#ccefff", mode: "sniper" },
  modelCore: { name: "Model Core", hp: 230, speed: 0.95, damage: 23, radius: 0.95, color: "#55b8dc", mode: "miniBoss" },
  otherGuy: { name: "Other Guy", hp: 74, speed: 2.1, damage: 13, radius: 0.48, color: "#c97848", mode: "skirmisher" },
  groupPuller: { name: "Group Puller", hp: 132, speed: 1.25, damage: 17, radius: 0.72, color: "#e8d8ad", mode: "trapper" },
  inviteBomber: { name: "Invite Bomber", hp: 78, speed: 1.35, damage: 19, radius: 0.52, color: "#ee6656", mode: "bomber" },
  debateHost: { name: "Debate Host", hp: 220, speed: 0.95, damage: 22, radius: 0.95, color: "#6f8ea8", mode: "miniBoss" },
  argumentAgent: { name: "Argument Agent", hp: 66, speed: 1.8, damage: 13, radius: 0.46, color: "#ff8f52", mode: "ranged" },
  policySniper: { name: "Policy Sniper", hp: 64, speed: 1.45, damage: 18, radius: 0.42, color: "#d8f3ff", mode: "sniper" },
  shopperGuard: { name: "Shopper Guard", hp: 134, speed: 1.16, damage: 18, radius: 0.72, color: "#f5c451", mode: "blocker" },
  luxuryClerk: { name: "Luxury Clerk", hp: 78, speed: 1.6, damage: 15, radius: 0.48, color: "#fff1a8", mode: "ranged" },
  receiptBomber: { name: "Receipt Bomber", hp: 80, speed: 1.35, damage: 20, radius: 0.52, color: "#ee6656", mode: "bomber" },
  dadTaskmaster: { name: "Dad Taskmaster", hp: 160, speed: 1.18, damage: 20, radius: 0.78, color: "#58c7a6", mode: "blocker" },
  familyScheduler: { name: "Family Scheduler", hp: 78, speed: 1.65, damage: 15, radius: 0.48, color: "#8ba3ff", mode: "trapper" },
  armyReminder: { name: "Army Reminder", hp: 72, speed: 1.85, damage: 15, radius: 0.48, color: "#55b8dc", mode: "ranged" },
  diaperTrooper: { name: "Diaper Trooper", hp: 92, speed: 1.8, damage: 13, radius: 0.5, color: "#f8f3df", mode: "blocker" },
  babyBottleMage: { name: "Baby Bottle Mage", hp: 64, speed: 1.45, damage: 15, radius: 0.44, color: "#8bd6ff", mode: "ranged", projectileLabel: "Milk", projectileColor: "#d8f3ff" },
  shoppingCartCharger: { name: "Shopping Cart Charger", hp: 118, speed: 2.35, damage: 18, radius: 0.58, color: "#f5c451", mode: "charger" },
  lowCostCollector: { name: "Low Cost Collector", hp: 74, speed: 1.75, damage: 14, radius: 0.46, color: "#58c7a6", mode: "ranged", projectileLabel: "Coupon", projectileColor: "#d8f56f" },
  reserveSoldier: { name: "Reserve Soldier", hp: 88, speed: 1.7, damage: 16, radius: 0.5, color: "#55b8dc", mode: "ranged", projectileLabel: "Order", projectileColor: "#55b8dc" },
  couponKing: { name: "The Coupon King", hp: 260, speed: 0.95, damage: 23, radius: 0.95, color: "#d8f56f", mode: "miniBoss", projectileLabel: "SALE", projectileColor: "#d8f56f" },
  strollerTitan: { name: "The Stroller Titan", hp: 330, speed: 0.82, damage: 26, radius: 1.08, color: "#ff9fc0", mode: "miniBoss", projectileLabel: "Toy", projectileColor: "#ff9fc0" },
  reserveCommander: { name: "The Reserve Commander", hp: 285, speed: 0.98, damage: 24, radius: 0.98, color: "#55b8dc", mode: "miniBoss", projectileLabel: "Radio", projectileColor: "#85d6ff" },
  fakeJersey: { name: "Fake Jersey", hp: 68, speed: 2.05, damage: 12, radius: 0.46, color: "#68c58a", mode: "skirmisher" },
  reseller: { name: "Reseller", hp: 82, speed: 1.65, damage: 15, radius: 0.48, color: "#f5c451", mode: "ranged" },
  auctionBidder: { name: "Auction Bidder", hp: 74, speed: 1.45, damage: 17, radius: 0.46, color: "#d8f56f", mode: "sniper" },
  collector: { name: "Collector", hp: 240, speed: 0.9, damage: 24, radius: 0.95, color: "#fff1a8", mode: "miniBoss" },
  comfortGuard: { name: "Comfort Guard", hp: 138, speed: 0.95, damage: 17, radius: 0.74, color: "#b78cff", mode: "blocker" },
  couchDefender: { name: "Couch Defender", hp: 86, speed: 1.3, damage: 14, radius: 0.54, color: "#d8a5ff", mode: "trapper" },
  napEnforcer: { name: "Nap Enforcer", hp: 220, speed: 0.85, damage: 22, radius: 0.95, color: "#f8f3df", mode: "miniBoss" }
};

Object.assign(ENEMIES, {
  spreadsheetAuditor: { name: "Spreadsheet Auditor", hp: 82, speed: 1.45, damage: 15, radius: 0.48, color: "#e8d8ad", mode: "sniper", projectileLabel: "Sheet", projectileColor: "#e8d8ad" },
  keynoteKnight: { name: "Keynote Knight", hp: 118, speed: 1.28, damage: 17, radius: 0.64, color: "#ff8f52", mode: "blocker", projectileLabel: "Slide", projectileColor: "#ff8f52" },
  slideOverlord: { name: "Slide Overlord", hp: 250, speed: 0.9, damage: 24, radius: 0.95, color: "#ff8f52", mode: "miniBoss", projectileLabel: "Deck", projectileColor: "#ff8f52" },
  meetingMarathoner: { name: "Meeting Marathoner", hp: 260, speed: 0.86, damage: 23, radius: 0.96, color: "#e8d8ad", mode: "miniBoss", projectileLabel: "Agenda", projectileColor: "#e8d8ad" },

  bedouinArcher: { name: "Bedouin Archer", hp: 72, speed: 1.55, damage: 16, radius: 0.46, color: "#d9a45f", mode: "sniper", projectileLabel: "Spear", projectileColor: "#d9a45f" },
  camelRider: { name: "Camel Rider", hp: 124, speed: 2.15, damage: 17, radius: 0.7, color: "#c97848", mode: "charger", projectileLabel: "Rock", projectileColor: "#8a6638" },
  desertScout: { name: "Desert Scout", hp: 66, speed: 2.7, damage: 12, radius: 0.44, color: "#f5c451", mode: "skirmisher", projectileLabel: "Rock", projectileColor: "#8a6638" },
  royalTentGuard: { name: "Royal Tent Guard", hp: 245, speed: 0.95, damage: 24, radius: 0.95, color: "#8b5a36", mode: "miniBoss", projectileLabel: "Spear", projectileColor: "#d9a45f" },
  duneChieftain: { name: "Dune Chieftain", hp: 255, speed: 0.92, damage: 24, radius: 0.96, color: "#c97848", mode: "miniBoss", projectileLabel: "Blade", projectileColor: "#f5c451" },

  diceThrower: { name: "Dice Thrower", hp: 74, speed: 1.55, damage: 16, radius: 0.46, color: "#f8f3df", mode: "ranged", projectileLabel: "Dice", projectileColor: "#f8f3df" },
  chipGambler: { name: "Chip Gambler", hp: 86, speed: 1.75, damage: 15, radius: 0.48, color: "#f5c451", mode: "ranged", projectileLabel: "Chip", projectileColor: "#f5c451" },
  jackpotBruiser: { name: "Jackpot Bruiser", hp: 255, speed: 0.9, damage: 25, radius: 0.95, color: "#4fb46f", mode: "miniBoss", projectileLabel: "Chip", projectileColor: "#f5c451" },

  laundryBasketGuard: { name: "Laundry Basket Guard", hp: 104, speed: 1.18, damage: 17, radius: 0.62, color: "#d8f3ff", mode: "blocker", projectileLabel: "Laundry", projectileColor: "#d8f3ff" },
  groceryBagger: { name: "Grocery Bagger", hp: 78, speed: 1.9, damage: 14, radius: 0.48, color: "#f1d08c", mode: "ranged", projectileLabel: "Bag", projectileColor: "#f1d08c" },
  washingMachineWarden: { name: "Washing Machine Warden", hp: 260, speed: 0.86, damage: 24, radius: 0.95, color: "#ff9fc0", mode: "miniBoss", projectileLabel: "Spray", projectileColor: "#8bd6ff" },

  flowerThrower: { name: "Flower Thrower", hp: 68, speed: 1.8, damage: 13, radius: 0.44, color: "#ff9fc0", mode: "ranged", projectileLabel: "Flower", projectileColor: "#ff9fc0" },
  loveLetterCourier: { name: "Love Letter Courier", hp: 74, speed: 2.25, damage: 13, radius: 0.46, color: "#f8f3df", mode: "skirmisher", projectileLabel: "Letter", projectileColor: "#f8f3df" },
  awkwardDinnerHost: { name: "Awkward Dinner Host", hp: 250, speed: 0.92, damage: 23, radius: 0.95, color: "#d8a5ff", mode: "miniBoss", projectileLabel: "Heart", projectileColor: "#ff9fc0" },

  selfieSniper: { name: "Selfie Sniper", hp: 66, speed: 1.45, damage: 18, radius: 0.42, color: "#ff9fc0", mode: "sniper", projectileLabel: "Selfie", projectileColor: "#10151f" },
  glowstickRaver: { name: "Glowstick Raver", hp: 84, speed: 2.35, damage: 14, radius: 0.5, color: "#d8f56f", mode: "ranged", projectileLabel: "Glow", projectileColor: "#d8f56f" },
  vipGatekeeper: { name: "VIP Gatekeeper", hp: 270, speed: 0.88, damage: 25, radius: 0.98, color: "#9b78de", mode: "miniBoss", projectileLabel: "VIP", projectileColor: "#f5c451" },

  dataPacketCrawler: { name: "Data Packet Crawler", hp: 76, speed: 2.05, damage: 13, radius: 0.46, color: "#85d6ff", mode: "ranged", projectileLabel: "Data", projectileColor: "#85d6ff" },
  laserTurret: { name: "Laser Turret", hp: 96, speed: 0.75, damage: 19, radius: 0.54, color: "#55b8dc", mode: "sniper", projectileLabel: "Laser", projectileColor: "#d8f3ff" },
  droneSupervisor: { name: "Drone Supervisor", hp: 275, speed: 0.85, damage: 25, radius: 0.98, color: "#17445c", mode: "miniBoss", projectileLabel: "Drone", projectileColor: "#85d6ff" },

  chatSpammer: { name: "Chat Spammer", hp: 72, speed: 1.8, damage: 13, radius: 0.46, color: "#e8d8ad", mode: "ranged", projectileLabel: "Chat", projectileColor: "#f8f3df" },
  planCanceler: { name: "Plan Canceler", hp: 86, speed: 2.1, damage: 15, radius: 0.5, color: "#c97848", mode: "trapper", projectileLabel: "Plan", projectileColor: "#e8d8ad" },
  groupAdmin: { name: "Group Admin", hp: 260, speed: 0.9, damage: 24, radius: 0.95, color: "#c97848", mode: "miniBoss", projectileLabel: "Invite", projectileColor: "#f8f3df" },

  microphoneHeckler: { name: "Microphone Heckler", hp: 78, speed: 1.65, damage: 15, radius: 0.48, color: "#10151f", mode: "ranged", projectileLabel: "Mic", projectileColor: "#10151f" },
  podiumPusher: { name: "Podium Pusher", hp: 124, speed: 1.18, damage: 18, radius: 0.68, color: "#6f8ea8", mode: "blocker", projectileLabel: "Paper", projectileColor: "#e8d8ad" },
  debateModerator: { name: "Debate Moderator", hp: 270, speed: 0.86, damage: 25, radius: 0.98, color: "#ff8f52", mode: "miniBoss", projectileLabel: "Mic", projectileColor: "#10151f" },

  creditCardNinja: { name: "Credit Card Ninja", hp: 74, speed: 2.4, damage: 15, radius: 0.46, color: "#1b2433", mode: "skirmisher", projectileLabel: "Card", projectileColor: "#1b2433" },
  perfumeSprayer: { name: "Perfume Sprayer", hp: 82, speed: 1.55, damage: 16, radius: 0.48, color: "#fff1a8", mode: "ranged", projectileLabel: "Spray", projectileColor: "#d8f3ff" },
  boutiqueManager: { name: "Boutique Manager", hp: 270, speed: 0.88, damage: 25, radius: 0.98, color: "#f5c451", mode: "miniBoss", projectileLabel: "Card", projectileColor: "#1b2433" },

  alarmClockSoldier: { name: "Alarm Clock Soldier", hp: 78, speed: 2.15, damage: 15, radius: 0.48, color: "#fff1a8", mode: "ranged", projectileLabel: "Clock", projectileColor: "#fff1a8" },
  milkCartonTitan: { name: "Milk Carton Titan", hp: 315, speed: 0.78, damage: 26, radius: 1.05, color: "#d8f3ff", mode: "miniBoss", projectileLabel: "Milk", projectileColor: "#d8f3ff" },

  jerseyReseller: { name: "Jersey Reseller", hp: 80, speed: 1.75, damage: 15, radius: 0.48, color: "#68c58a", mode: "ranged", projectileLabel: "Jersey", projectileColor: "#68c58a" },
  dealHunter: { name: "Deal Hunter", hp: 86, speed: 2.3, damage: 14, radius: 0.5, color: "#d8f56f", mode: "skirmisher", projectileLabel: "Tag", projectileColor: "#d8f56f" },
  footballCollectorGuard: { name: "Collector Guard", hp: 275, speed: 0.88, damage: 25, radius: 0.98, color: "#68c58a", mode: "miniBoss", projectileLabel: "Football", projectileColor: "#f8f3df" },

  pillowThrower: { name: "Pillow Thrower", hp: 72, speed: 1.6, damage: 13, radius: 0.46, color: "#b78cff", mode: "ranged", projectileLabel: "Pillow", projectileColor: "#b78cff" },
  blanketBurrito: { name: "Blanket Burrito", hp: 118, speed: 0.95, damage: 17, radius: 0.7, color: "#d8a5ff", mode: "blocker", projectileLabel: "Sleep", projectileColor: "#d8a5ff" },
  sleepChampion: { name: "Sleep Champion", hp: 265, speed: 0.78, damage: 23, radius: 0.98, color: "#b78cff", mode: "miniBoss", projectileLabel: "Cloud", projectileColor: "#d8a5ff" },

  dinnerInviteCourier: { name: "Dinner Invite Courier", hp: 74, speed: 1.9, damage: 14, radius: 0.46, color: "#fff1a8", mode: "ranged", projectileLabel: "Invite", projectileColor: "#fff1a8" },
  choreListCaptain: { name: "Chore List Captain", hp: 116, speed: 1.15, damage: 18, radius: 0.66, color: "#8ba3ff", mode: "blocker", projectileLabel: "Chore", projectileColor: "#f8f3df" },
  weekendPlanner: { name: "Weekend Planner", hp: 280, speed: 0.84, damage: 25, radius: 0.98, color: "#fff1a8", mode: "miniBoss", projectileLabel: "Calendar", projectileColor: "#f8f3df" }
});

const WORLD_ENEMY_ROSTERS = {
  presentationEmpire: { regular: ["presentationIntern", "meetingEnforcer", "slideBomber", "spreadsheetAuditor", "keynoteKnight"], mini: ["slideOverlord", "meetingMarathoner"] },
  bedouinDesert: { regular: ["bedouinWarrior", "bedouinArcher", "camelRider", "desertScout", "monkey"], mini: ["royalTentGuard", "duneChieftain"] },
  casinoKingdom: { regular: ["cardDealer", "casinoGuard", "pokerPro", "diceThrower", "chipGambler"], mini: ["jackpotBruiser"] },
  momsKingdom: { regular: ["choreBot", "errandRunner", "cleaningInspector", "laundryBasketGuard", "groceryBagger"], mini: ["washingMachineWarden"] },
  dateDimension: { regular: ["matchmakerAgent", "dateReminder", "calendarSniper", "flowerThrower", "loveLetterCourier"], mini: ["awkwardDinnerHost"] },
  partyDimension: { regular: ["partyBouncer", "nightlifeScout", "influencerDrone", "selfieSniper", "glowstickRaver"], mini: ["vipGatekeeper"] },
  aiNexus: { regular: ["aiBot", "promptSniper", "modelCore", "dataPacketCrawler", "laserTurret"], mini: ["droneSupervisor"] },
  otherFriendGroup: { regular: ["otherGuy", "groupPuller", "inviteBomber", "chatSpammer", "planCanceler"], mini: ["groupAdmin"] },
  debateRepublic: { regular: ["debateHost", "argumentAgent", "policySniper", "microphoneHeckler", "podiumPusher"], mini: ["debateModerator"] },
  luxuryKingdom: { regular: ["shopperGuard", "luxuryClerk", "receiptBomber", "creditCardNinja", "perfumeSprayer"], mini: ["boutiqueManager"] },
  dadKingdom: { regular: ["diaperTrooper", "babyBottleMage", "shoppingCartCharger", "alarmClockSoldier", "lowCostCollector", "reserveSoldier"], mini: ["couponKing", "strollerTitan", "reserveCommander", "milkCartonTitan"] },
  footballMarket: { regular: ["fakeJersey", "jerseyReseller", "auctionBidder", "dealHunter", "reseller"], mini: ["collector", "footballCollectorGuard"] },
  comfortKingdom: { regular: ["comfortGuard", "couchDefender", "napEnforcer", "pillowThrower", "blanketBurrito"], mini: ["sleepChampion"] },
  familyKingdom: { regular: ["familyScheduler", "choreBot", "calendarSniper", "dinnerInviteCourier", "choreListCaptain"], mini: ["weekendPlanner"] }
};

MISSIONS.forEach((mission) => {
  const roster = WORLD_ENEMY_ROSTERS[mission.map];
  if (!roster) return;
  mission.enemyPool = roster.regular;
  mission.miniBossPool = roster.mini;
  mission.boss.eliteEnemies = roster.mini;
  mission.boss.eliteEnemy = roster.mini[0] || mission.boss.eliteEnemy;
});

export const MAP_THEMES = {
  grapeFields: { base: 0x285934, mid: 0x386f41, accent: 0x8e44ad, label: "Grape Fields" },
  jungle: { base: 0x1f5139, mid: 0x2d6948, accent: 0xf5c451, label: "Monkey Jungle" },
  workEmpire: { base: 0x29314a, mid: 0x3b4561, accent: 0xe8d8ad, label: "Work Empire" },
  military: { base: 0x384250, mid: 0x4f5d51, accent: 0xee6656, label: "Military Zone" },
  darkVineyard: { base: 0x221832, mid: 0x3f2450, accent: 0xdf7ca4, label: "Dark Vineyard" },
  castle: { base: 0x30223d, mid: 0x4b315c, accent: 0xff8f52, label: "Kashi Castle" },
  darkKashi: { base: 0x101018, mid: 0x262034, accent: 0x8e44ad, label: "Dark Kashi" },
  presentationEmpire: { base: 0x29314a, mid: 0x3b4561, accent: 0xff8f52, label: "Presentation Empire" },
  bedouinDesert: { base: 0x6a4b2a, mid: 0x8a6638, accent: 0xf5c451, label: "Bedouin Desert" },
  casinoKingdom: { base: 0x143d2a, mid: 0x265b3e, accent: 0xf5c451, label: "Casino Kingdom" },
  momsKingdom: { base: 0x4d3143, mid: 0x6a4058, accent: 0xff9fc0, label: "Mom's Kingdom" },
  dateDimension: { base: 0x29345c, mid: 0x3c4a7d, accent: 0xd8a5ff, label: "Date Dimension" },
  partyDimension: { base: 0x281b4d, mid: 0x40286f, accent: 0xff9fc0, label: "Party Dimension" },
  aiNexus: { base: 0x102b3d, mid: 0x17445c, accent: 0x85d6ff, label: "AI Nexus" },
  otherFriendGroup: { base: 0x3b3028, mid: 0x554235, accent: 0xc97848, label: "Other Friend Group" },
  debateRepublic: { base: 0x24303f, mid: 0x3a485a, accent: 0xe8d8ad, label: "Debate Republic" },
  luxuryKingdom: { base: 0x43361d, mid: 0x5c4a25, accent: 0xf5c451, label: "Luxury Kingdom" },
  dadKingdom: { base: 0x204038, mid: 0x305c50, accent: 0x58c7a6, label: "Dad Kingdom" },
  footballMarket: { base: 0x193f2a, mid: 0x2d6948, accent: 0x68c58a, label: "Football Market Kingdom" },
  comfortKingdom: { base: 0x2d2548, mid: 0x47396b, accent: 0xb78cff, label: "Comfort Kingdom" },
  familyKingdom: { base: 0x3f3520, mid: 0x61552e, accent: 0xfff1a8, label: "Family Kingdom" }
};

export function upgradeCost(rank) {
  return [2, 3, 5, 7, 10][rank] || 999;
}

export function difficultyForLevel(level) {
  if (level <= 1) {
    return {
      label: "Training Wheels",
      bossHp: 0.58,
      enemyHp: 0.62,
      enemyDamage: 0.25,
      enemySpeed: 0.5,
      playerHealth: 2.5,
      spawnDelay: 3.4,
      maxEnemies: 5,
      summonCount: 0.35,
      ultCharge: 2.8,
      healChance: 0.55,
      healAmount: 0.12
    };
  }
  if (level <= 3) {
    return {
      label: "Easy",
      bossHp: 0.74,
      enemyHp: 0.74,
      enemyDamage: 0.48,
      enemySpeed: 0.68,
      playerHealth: 1.85,
      spawnDelay: 2.25,
      maxEnemies: 8,
      summonCount: 0.55,
      ultCharge: 2.05,
      healChance: 0.38,
      healAmount: 0.1
    };
  }
  if (level === 4) {
    return {
      label: "Normal",
      bossHp: 0.92,
      enemyHp: 0.92,
      enemyDamage: 0.78,
      enemySpeed: 0.88,
      playerHealth: 1.35,
      spawnDelay: 1.4,
      maxEnemies: 11,
      summonCount: 0.8,
      ultCharge: 1.45,
      healChance: 0.24,
      healAmount: 0.08
    };
  }
  return {
    label: "Empire",
    bossHp: 1 + (level - 5) * 0.08,
    enemyHp: 1 + (level - 5) * 0.08,
    enemyDamage: 0.9 + (level - 5) * 0.06,
    enemySpeed: 0.95 + (level - 5) * 0.04,
    playerHealth: 1.1,
    spawnDelay: 1,
    maxEnemies: 13 + Math.min(4, level - 5),
    summonCount: 1,
    ultCharge: 1.1,
    healChance: 0.18,
    healAmount: 0.07
  };
}

export function computeHeroStats(id, save, party = save.party || []) {
  const hero = CHARACTER_BY_ID[id];
  const up = save.upgrades[id] || { health: 0, attack: 0, ultimate: 0 };
  const combo = comboBonusForParty(party);
  return {
    maxHp: Math.round((hero.hp + up.health * 34) * (1 + combo.health)),
    attack: hero.attack * (1 + up.attack * 0.18 + combo.attack),
    speed: hero.speed * (1 + combo.speed) + up.health * 2,
    cooldown: Math.max(170, hero.cooldown * (1 - up.attack * 0.035)),
    ultimateCost: Math.max(54, 100 - up.ultimate * 9),
    ultimatePower: 1 + up.ultimate * 0.24,
    range: hero.range,
    combo
  };
}
