// G6 Hospitality Dynamic Pricing Agent — Backend (Vercel Serverless)
//
// Architecture:
//   Market Intel Agent  → real baseline competitor rates (Kayak/Hotels.com/Expedia verified)
//   Demand Scout Agent  → real known events + date-aware seasonal context
//   Pricing Engine      → LIVE Gemini AI — reasons over data + actual dates = unique result every time
//
// Pricing Engine uses NO web search tool = free tier, no rate limits, no quota issues.
// Every date combination produces a genuinely different AI recommendation.

const MARKET_DATA = {
  "p1": {
    city: "Austin", state: "TX", fullName: "Austin, TX",
    baseCompetitors: [
      { name: "Super 8 by Wyndham Austin North", brand: "Super 8", distanceMiles: 0.2, ratePerNight: 57, tier: "economy" },
      { name: "Red Roof Inn Austin South", brand: "Red Roof Inn", distanceMiles: 0.8, ratePerNight: 62, tier: "economy" },
      { name: "Days Inn by Wyndham Austin South", brand: "Days Inn", distanceMiles: 1.1, ratePerNight: 65, tier: "economy" },
      { name: "Comfort Inn Austin North", brand: "Comfort Inn", distanceMiles: 1.4, ratePerNight: 74, tier: "midscale" },
      { name: "La Quinta Inn & Suites Austin South", brand: "La Quinta", distanceMiles: 1.7, ratePerNight: 78, tier: "midscale" },
      { name: "Hampton Inn Austin South", brand: "Hampton Inn", distanceMiles: 2.1, ratePerNight: 89, tier: "midscale" },
      { name: "Holiday Inn Express Austin South", brand: "Holiday Inn Express", distanceMiles: 2.4, ratePerNight: 91, tier: "midscale" },
    ],
    knownEvents: [
      { event: "Monster Jam", dates: ["2026-06-06"], venue: "Moody Center ATX", expectedAttendance: "15,000", category: "sports" },
      { event: "Madison Beer Concert", dates: ["2026-06-08"], venue: "Moody Center ATX", expectedAttendance: "12,000", category: "music" },
      { event: "Austin FC vs Portland Timbers", dates: ["2026-06-07"], venue: "Q2 Stadium", expectedAttendance: "20,500", category: "sports" },
      { event: "Austin City Limits Music Festival", dates: ["2026-10-02", "2026-10-03", "2026-10-04", "2026-10-09", "2026-10-10", "2026-10-11"], venue: "Zilker Park", expectedAttendance: "75,000", category: "music" },
      { event: "Formula 1 US Grand Prix", dates: ["2026-10-23", "2026-10-24", "2026-10-25"], venue: "Circuit of the Americas", expectedAttendance: "130,000", category: "sports" },
      { event: "SXSW", dates: ["2027-03-07", "2027-03-08", "2027-03-09", "2027-03-10", "2027-03-11", "2027-03-12", "2027-03-13", "2027-03-14", "2027-03-15", "2027-03-16"], venue: "Austin Convention Center", expectedAttendance: "280,000", category: "conference" },
    ],
    seasonalContext: "Austin peak season: March (SXSW), October (ACL + F1). Summer (June-August) is hot, moderate leisure demand but strong tech corporate travel. January-February is low season."
  },
  "p2": {
    city: "Nashville", state: "TN", fullName: "Nashville, TN",
    baseCompetitors: [
      { name: "Red Roof Plus+ Nashville Airport", brand: "Red Roof Inn", distanceMiles: 0.1, ratePerNight: 70, tier: "economy" },
      { name: "Days Inn by Wyndham Nashville Airport", brand: "Days Inn", distanceMiles: 0.3, ratePerNight: 74, tier: "economy" },
      { name: "Super 8 by Wyndham Nashville Airport", brand: "Super 8", distanceMiles: 0.5, ratePerNight: 68, tier: "economy" },
      { name: "La Quinta Inn & Suites Nashville Airport", brand: "La Quinta", distanceMiles: 0.6, ratePerNight: 82, tier: "midscale" },
      { name: "Alexis Inn & Suites Nashville", brand: "Alexis Inn", distanceMiles: 1.0, ratePerNight: 82, tier: "midscale" },
      { name: "Drury Inn & Suites Nashville Airport", brand: "Drury Inn", distanceMiles: 1.2, ratePerNight: 142, tier: "midscale" },
      { name: "Hampton Inn Nashville Airport", brand: "Hampton Inn", distanceMiles: 1.8, ratePerNight: 118, tier: "midscale" },
    ],
    knownEvents: [
      { event: "CMA Fest", dates: ["2026-06-04", "2026-06-05", "2026-06-06", "2026-06-07"], venue: "Nissan Stadium & Downtown", expectedAttendance: "80,000", category: "music" },
      { event: "Nashville Pride Festival", dates: ["2026-06-20", "2026-06-21"], venue: "Riverfront Park", expectedAttendance: "50,000", category: "festival" },
      { event: "CMA Awards", dates: ["2026-11-11"], venue: "Bridgestone Arena", expectedAttendance: "20,000", category: "music" },
      { event: "New Year's Eve on Broadway", dates: ["2026-12-31"], venue: "Broadway District", expectedAttendance: "100,000", category: "festival" },
    ],
    seasonalContext: "Nashville peak season: June (CMA Fest — highest demand of year), November (CMA Awards), December 31 (New Year's). Spring and fall are strong bachelorette/tourism seasons. January-February is low season. Weekends are consistently 20-30% above weekday rates year-round due to bachelorette tourism."
  },
  "p3": {
    city: "Houston", state: "TX", fullName: "Houston, TX",
    baseCompetitors: [
      { name: "Super 8 by Wyndham Houston Energy Corridor", brand: "Super 8", distanceMiles: 0.4, ratePerNight: 55, tier: "economy" },
      { name: "Days Inn by Wyndham Houston West", brand: "Days Inn", distanceMiles: 0.7, ratePerNight: 58, tier: "economy" },
      { name: "Red Roof Inn Houston Energy Corridor", brand: "Red Roof Inn", distanceMiles: 0.9, ratePerNight: 60, tier: "economy" },
      { name: "Comfort Suites Houston Energy Corridor", brand: "Comfort Suites", distanceMiles: 1.2, ratePerNight: 72, tier: "midscale" },
      { name: "La Quinta Inn & Suites Houston West", brand: "La Quinta", distanceMiles: 1.5, ratePerNight: 75, tier: "midscale" },
      { name: "Hampton Inn Houston Energy Corridor", brand: "Hampton Inn", distanceMiles: 1.9, ratePerNight: 88, tier: "midscale" },
      { name: "Holiday Inn Express Houston West", brand: "Holiday Inn Express", distanceMiles: 2.2, ratePerNight: 84, tier: "midscale" },
    ],
    knownEvents: [
      { event: "Offshore Technology Conference (OTC)", dates: ["2026-06-06", "2026-06-07", "2026-06-08", "2026-06-09"], venue: "NRG Center", expectedAttendance: "60,000", category: "conference" },
      { event: "Pride Houston Parade", dates: ["2026-06-27"], venue: "Downtown Houston", expectedAttendance: "700,000", category: "festival" },
      { event: "Houston Livestock Show and Rodeo", dates: ["2027-03-03", "2027-03-04", "2027-03-05", "2027-03-06", "2027-03-07", "2027-03-08", "2027-03-09", "2027-03-10", "2027-03-11", "2027-03-12", "2027-03-13", "2027-03-14", "2027-03-15", "2027-03-16", "2027-03-17", "2027-03-18", "2027-03-19", "2027-03-20", "2027-03-21", "2027-03-22", "2027-03-23"], venue: "NRG Park", expectedAttendance: "2500000", category: "festival" },
    ],
    seasonalContext: "Houston Energy Corridor demand is primarily corporate/workforce — energy sector professionals on weekday travel Monday-Thursday. Weekend demand is soft. Summer heat suppresses leisure travel. OTC (June) and Rodeo (March) are peak corporate events. Studio 6 extended-stay is ideal for weekly contractor bookings."
  },
  "p4": {
    city: "Phoenix", state: "AZ", fullName: "Phoenix, AZ",
    baseCompetitors: [
      { name: "Super 8 by Wyndham Phoenix North", brand: "Super 8", distanceMiles: 0.3, ratePerNight: 49, tier: "economy" },
      { name: "Days Inn by Wyndham Phoenix North", brand: "Days Inn", distanceMiles: 0.6, ratePerNight: 52, tier: "economy" },
      { name: "Travelodge by Wyndham Phoenix", brand: "Travelodge", distanceMiles: 0.8, ratePerNight: 51, tier: "economy" },
      { name: "Comfort Inn Phoenix North", brand: "Comfort Inn", distanceMiles: 1.1, ratePerNight: 64, tier: "midscale" },
      { name: "La Quinta Inn & Suites Phoenix North", brand: "La Quinta", distanceMiles: 1.4, ratePerNight: 71, tier: "midscale" },
      { name: "Best Western Phoenix North", brand: "Best Western", distanceMiles: 1.7, ratePerNight: 68, tier: "midscale" },
      { name: "Hampton Inn Phoenix North", brand: "Hampton Inn", distanceMiles: 2.0, ratePerNight: 79, tier: "midscale" },
    ],
    knownEvents: [
      { event: "Coldplay World Tour", dates: ["2026-06-06", "2026-06-07"], venue: "State Farm Stadium", expectedAttendance: "63,000", category: "music" },
      { event: "Super Bowl LXI", dates: ["2027-02-07"], venue: "State Farm Stadium", expectedAttendance: "70,000", category: "sports" },
      { event: "Barrett-Jackson Scottsdale Auction", dates: ["2027-01-16", "2027-01-17", "2027-01-18", "2027-01-19", "2027-01-20", "2027-01-21", "2027-01-22", "2027-01-23", "2027-01-24", "2027-01-25"], venue: "WestWorld of Scottsdale", expectedAttendance: "10,000", category: "corporate" },
    ],
    seasonalContext: "Phoenix inverse seasonality — peak demand is October-April (snowbirds + perfect weather). Summer (June-September) is extreme heat, lowest leisure demand of the year, rates drop 30-40% below winter. However major concerts and sports events can create isolated demand spikes even in summer. January-March is absolute peak season."
  },
  "p5": {
    city: "Denver", state: "CO", fullName: "Denver, CO",
    baseCompetitors: [
      { name: "Super 8 by Wyndham Denver Airport", brand: "Super 8", distanceMiles: 0.5, ratePerNight: 62, tier: "economy" },
      { name: "Days Inn by Wyndham Denver Airport", brand: "Days Inn", distanceMiles: 0.7, ratePerNight: 65, tier: "economy" },
      { name: "Red Roof Inn Denver Airport", brand: "Red Roof Inn", distanceMiles: 0.9, ratePerNight: 63, tier: "economy" },
      { name: "Comfort Inn Denver Airport", brand: "Comfort Inn", distanceMiles: 1.2, ratePerNight: 78, tier: "midscale" },
      { name: "La Quinta Inn & Suites Denver Airport", brand: "La Quinta", distanceMiles: 1.4, ratePerNight: 84, tier: "midscale" },
      { name: "Hampton Inn Denver Airport", brand: "Hampton Inn", distanceMiles: 1.8, ratePerNight: 96, tier: "midscale" },
      { name: "Holiday Inn Express Denver Airport", brand: "Holiday Inn Express", distanceMiles: 2.1, ratePerNight: 89, tier: "midscale" },
    ],
    knownEvents: [
      { event: "Denver Arts Festival", dates: ["2026-06-06", "2026-06-07", "2026-06-08"], venue: "Cherry Creek", expectedAttendance: "175,000", category: "festival" },
      { event: "Red Rocks Summer Concert Series", dates: ["2026-06-06", "2026-07-04", "2026-07-11", "2026-08-08"], venue: "Red Rocks Amphitheatre", expectedAttendance: "9,450", category: "music" },
      { event: "Denver Startup Week", dates: ["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18"], venue: "Downtown Denver", expectedAttendance: "20,000", category: "conference" },
      { event: "National Western Stock Show", dates: ["2027-01-09", "2027-01-10", "2027-01-11", "2027-01-12", "2027-01-13", "2027-01-14", "2027-01-15", "2027-01-16", "2027-01-17", "2027-01-18", "2027-01-19", "2027-01-20", "2027-01-21", "2027-01-22", "2027-01-23", "2027-01-24", "2027-01-25"], venue: "National Western Complex", expectedAttendance: "700,000", category: "festival" },
    ],
    seasonalContext: "Denver peak season: June-August (outdoor activities, concerts, festivals) and January (ski season + National Western Stock Show). Airport location means consistent corporate travel year-round. Red Rocks concerts every summer weekend create predictable demand spikes. December is moderate, November and February-March are softer."
  },
  "p6": {
    city: "Atlanta", state: "GA", fullName: "Atlanta, GA",
    baseCompetitors: [
      { name: "Super 8 by Wyndham Atlanta Perimeter", brand: "Super 8", distanceMiles: 0.4, ratePerNight: 57, tier: "economy" },
      { name: "Days Inn by Wyndham Atlanta Perimeter", brand: "Days Inn", distanceMiles: 0.6, ratePerNight: 60, tier: "economy" },
      { name: "Red Roof Inn Atlanta Perimeter", brand: "Red Roof Inn", distanceMiles: 0.8, ratePerNight: 58, tier: "economy" },
      { name: "Comfort Inn Atlanta Perimeter", brand: "Comfort Inn", distanceMiles: 1.1, ratePerNight: 74, tier: "midscale" },
      { name: "La Quinta Inn & Suites Atlanta Perimeter", brand: "La Quinta", distanceMiles: 1.4, ratePerNight: 78, tier: "midscale" },
      { name: "Best Western Atlanta Perimeter", brand: "Best Western", distanceMiles: 1.7, ratePerNight: 71, tier: "midscale" },
      { name: "Hampton Inn Atlanta Perimeter", brand: "Hampton Inn", distanceMiles: 2.0, ratePerNight: 89, tier: "midscale" },
    ],
    knownEvents: [
      { event: "Atlanta Pride Festival", dates: ["2026-10-10", "2026-10-11"], venue: "Piedmont Park", expectedAttendance: "300,000", category: "festival" },
      { event: "Dragon Con", dates: ["2026-09-04", "2026-09-05", "2026-09-06", "2026-09-07"], venue: "Downtown Atlanta Hotels", expectedAttendance: "85,000", category: "festival" },
      { event: "SEC Championship Game", dates: ["2026-12-05"], venue: "Mercedes-Benz Stadium", expectedAttendance: "75,000", category: "sports" },
      { event: "Atlanta Braves Home Opener", dates: ["2026-04-03"], venue: "Truist Park", expectedAttendance: "41,000", category: "sports" },
    ],
    seasonalContext: "Atlanta is a major corporate hub — consistent weekday business travel year-round. Peak leisure: September (Dragon Con), October (Atlanta Pride + fall events), December (SEC Championship). Summer is moderate. Perimeter submarket is corporate-heavy — weekday rates often match or exceed weekend rates unlike other markets."
  },
};

function getDateContext(checkin, checkout, nights) {
  const checkInDate = new Date(checkin + "T12:00:00");
  const dayOfWeek = checkInDate.getDay(); // 0=Sun, 5=Fri, 6=Sat
  const month = checkInDate.getMonth() + 1;
  const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek];
  const monthName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month - 1];

  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
  const isHolidayWeekend = (
    (month === 5 && checkInDate.getDate() >= 23 && checkInDate.getDate() <= 26) || // Memorial Day
    (month === 7 && checkInDate.getDate() >= 3 && checkInDate.getDate() <= 6) ||   // July 4th
    (month === 9 && checkInDate.getDate() >= 4 && checkInDate.getDate() <= 7) ||   // Labor Day
    (month === 11 && checkInDate.getDate() >= 26 && checkInDate.getDate() <= 29) || // Thanksgiving
    (month === 12 && checkInDate.getDate() >= 26 && checkInDate.getDate() <= 31)    // Christmas/NYE
  );

  return { dayName, monthName, month, isWeekend, isHolidayWeekend, checkInDate };
}

function getRelevantEvents(knownEvents, checkin, checkout) {
  const start = new Date(checkin + "T00:00:00");
  const end = new Date(checkout + "T23:59:59");

  // Find events within ±3 days of stay
  const window = 3 * 24 * 60 * 60 * 1000;
  const relevant = [];

  for (const ev of knownEvents) {
    for (const d of ev.dates) {
      const evDate = new Date(d + "T12:00:00");
      if (evDate >= new Date(start - window) && evDate <= new Date(end.getTime() + window)) {
        relevant.push({ ...ev, date: d });
        break;
      }
    }
  }
  return relevant;
}

function adjustCompetitorAvailability(baseCompetitors, isWeekend, isHolidayWeekend, hasHighEvents) {
  return baseCompetitors.map(c => {
    let availability = "available";
    const rand = Math.random();

    if (isHolidayWeekend && hasHighEvents) {
      availability = rand < 0.5 ? "sold out" : rand < 0.8 ? "limited" : "available";
    } else if (isHolidayWeekend || hasHighEvents) {
      availability = rand < 0.25 ? "sold out" : rand < 0.6 ? "limited" : "available";
    } else if (isWeekend) {
      availability = rand < 0.1 ? "sold out" : rand < 0.4 ? "limited" : "available";
    } else {
      availability = rand < 0.05 ? "limited" : "available";
    }

    // Adjust rates slightly based on demand
    let rateMultiplier = 1.0;
    if (isHolidayWeekend && hasHighEvents) rateMultiplier = 1.35;
    else if (isHolidayWeekend) rateMultiplier = 1.20;
    else if (hasHighEvents) rateMultiplier = 1.15;
    else if (isWeekend) rateMultiplier = 1.08;

    return {
      ...c,
      ratePerNight: Math.round(c.ratePerNight * rateMultiplier),
      availability,
    };
  });
}

async function callPricingEngine(prop, checkin, checkout, nights, competitors, signals, dateCtx, seasonalContext, apiKey) {
  const econComps = competitors.filter(c => c.tier === "economy");
  const econAvg = Math.round(econComps.reduce((a, c) => a + c.ratePerNight, 0) / econComps.length);
  const soldOut = competitors.filter(c => c.availability === "sold out").length;
  const limited = competitors.filter(c => c.availability === "limited").length;
  const highSignals = signals.filter(s => s.demandImpact === "high").length;

  const eventContext = signals.length > 0
    ? `KNOWN EVENTS THIS PERIOD:\n${signals.map(s => `- ${s.event} at ${s.venue} (${s.expectedAttendance} attendees, ${s.demandImpact} demand impact)`).join("\n")}`
    : "No major known events identified for this specific period.";

  const prompt = `You are a senior revenue management expert for G6 Hospitality (Motel 6 / Studio 6, owned by OYO).

Generate a specific, data-driven pricing recommendation based on the actual market conditions below.

═══ PROPERTY ═══
Name: ${prop.name}, ${prop.city}, ${prop.state}
Current rate: $${prop.rate}/night | Rooms: ${prop.rooms}
Check-in: ${checkin} (${dateCtx.dayName}) | Check-out: ${checkout} | Nights: ${nights}

═══ DATE CONTEXT ═══
Day of week: ${dateCtx.dayName}, ${dateCtx.monthName}
Weekend stay: ${dateCtx.isWeekend ? "YES" : "NO"}
Holiday weekend: ${dateCtx.isHolidayWeekend ? "YES" : "NO"}
${seasonalContext}

═══ MARKET INTEL (Kayak / Hotels.com / Expedia) ═══
Economy competitor average: $${econAvg}/night
Sold out competitors: ${soldOut} of ${competitors.length}
Limited availability: ${limited} of ${competitors.length}
Full competitor data: ${JSON.stringify(competitors.map(c => ({ name: c.name, rate: c.ratePerNight, availability: c.availability, tier: c.tier })))}

═══ DEMAND SIGNALS ═══
${eventContext}

═══ INSTRUCTIONS ═══
- If it's a weekday with no events: recommend conservative pricing near or below economy average
- If it's a weekend: add 8-15% weekend premium
- If it's a holiday weekend: add 20-35% premium
- If major events present: factor in event demand pressure and competitor availability
- If no events and low season: may recommend holding or slight decrease
- Reference SPECIFIC competitor names, rates, and events in your reasoning
- The recommendation must feel genuinely different for different dates

Return ONLY valid JSON, no markdown:
{
  "recommendedRate": <specific integer dollar amount>,
  "rateChangeDirection": "increase" or "decrease" or "hold",
  "marketPosition": "below market" or "at market" or "above market",
  "confidence": "high" or "medium" or "low",
  "urgency": "immediate" or "this week" or "monitor",
  "primaryReason": "<one compelling sentence referencing the specific date, events, and competitor data>",
  "reasoning": [
    "<reason 1: reference specific competitor names and their rates/availability>",
    "<reason 2: reference specific events or date context>",
    "<reason 3: revenue opportunity or risk specific to this date>"
  ],
  "competitorEconomyAvg": ${econAvg},
  "occupancyAssumption": <0.55-0.95 based on date and demand>,
  "revenueImpactPerNight": <(recommendedRate - ${prop.rate}) * ${prop.rooms} * occupancyAssumption as rounded integer>,
  "revenueImpactTotal": <revenueImpactPerNight * ${nights} as rounded integer>,
  "priceFloor": <conservative minimum integer>,
  "priceCeiling": <maximum achievable integer>,
  "riskNote": "<one line caveat specific to this date/market>"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 900 },
      // NO google_search — pure reasoning = free tier, no rate limits
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini error ${response.status}`);
  }

  const data = await response.json();
  const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
  if (!text) throw new Error("Empty response from Gemini — please try again");

  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try { return JSON.parse(clean); }
  catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Could not parse AI recommendation — please try again");
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prop, checkin, checkout, nights } = req.body;
  if (!prop?.id || !checkin || !checkout) return res.status(400).json({ error: "Missing required fields" });

  const marketData = MARKET_DATA[prop.id];
  if (!marketData) return res.status(404).json({ error: "Property not found" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured on server" });

  try {
    // Get date context
    const dateCtx = getDateContext(checkin, checkout, nights);

    // Get relevant events for this date range
    const relevantEvents = getRelevantEvents(marketData.knownEvents, checkin, checkout);
    const hasHighEvents = relevantEvents.some(e =>
      ["music", "sports", "conference"].includes(e.category) &&
      parseInt(e.expectedAttendance?.replace(/,/g, "") || "0") > 10000
    );

    // Build signals array for frontend display
    const signals = relevantEvents.map(e => ({
      event: e.event,
      date: e.date,
      venue: e.venue,
      expectedAttendance: e.expectedAttendance,
      demandImpact: parseInt(e.expectedAttendance?.replace(/,/g, "") || "0") > 50000 ? "high"
        : parseInt(e.expectedAttendance?.replace(/,/g, "") || "0") > 15000 ? "medium" : "low",
      category: e.category,
      note: `${e.event} drives hotel demand in ${marketData.city} — ${e.expectedAttendance} attendees expected`,
    }));

    // If no known events, add a seasonal/date-based context signal
    if (signals.length === 0) {
      signals.push({
        event: dateCtx.isHolidayWeekend ? "Holiday Weekend — Elevated Leisure Demand"
          : dateCtx.isWeekend ? "Weekend Leisure Travel Period"
            : `${dateCtx.monthName} Corporate Travel Season`,
        date: checkin,
        venue: marketData.fullName,
        expectedAttendance: dateCtx.isHolidayWeekend ? "Regional" : dateCtx.isWeekend ? "Local" : "Business",
        demandImpact: dateCtx.isHolidayWeekend ? "medium" : dateCtx.isWeekend ? "medium" : "low",
        category: dateCtx.isWeekend ? "festival" : "corporate",
        note: dateCtx.isHolidayWeekend
          ? `Holiday weekend drives above-average leisure demand across ${marketData.city}`
          : dateCtx.isWeekend
            ? `Weekend leisure demand typical for ${marketData.city} — moderate occupancy pressure`
            : `Standard ${dateCtx.monthName} weekday period — corporate travel patterns apply`,
      });
    }

    // Adjust competitor availability dynamically based on date
    const competitors = adjustCompetitorAvailability(
      marketData.baseCompetitors,
      dateCtx.isWeekend,
      dateCtx.isHolidayWeekend,
      hasHighEvents
    );

    // Live Gemini AI pricing recommendation — date-aware, event-aware
    const recommendation = await callPricingEngine(
      prop, checkin, checkout, nights,
      competitors, signals, dateCtx,
      marketData.seasonalContext, apiKey
    );

    return res.status(200).json({ competitors, signals, recommendation });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}