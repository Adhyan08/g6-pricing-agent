// G6 Hospitality Dynamic Pricing Agent — Backend (Vercel Serverless)
// Fixed: robust JSON parser for Gemini 2.5 Flash thinking model output

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
      { event: "Austin City Limits Music Festival", dates: ["2026-10-02","2026-10-03","2026-10-04","2026-10-09","2026-10-10","2026-10-11"], venue: "Zilker Park", expectedAttendance: "75,000", category: "music" },
      { event: "Formula 1 US Grand Prix", dates: ["2026-10-23","2026-10-24","2026-10-25"], venue: "Circuit of the Americas", expectedAttendance: "130,000", category: "sports" },
      { event: "SXSW", dates: ["2027-03-07","2027-03-08","2027-03-09","2027-03-10","2027-03-11","2027-03-12","2027-03-13","2027-03-14","2027-03-15","2027-03-16"], venue: "Austin Convention Center", expectedAttendance: "280,000", category: "conference" },
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
      { event: "CMA Fest", dates: ["2026-06-04","2026-06-05","2026-06-06","2026-06-07"], venue: "Nissan Stadium & Downtown", expectedAttendance: "80,000", category: "music" },
      { event: "Nashville Pride Festival", dates: ["2026-06-20","2026-06-21"], venue: "Riverfront Park", expectedAttendance: "50,000", category: "festival" },
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
      { event: "Offshore Technology Conference (OTC)", dates: ["2026-06-06","2026-06-07","2026-06-08","2026-06-09"], venue: "NRG Center", expectedAttendance: "60,000", category: "conference" },
      { event: "Pride Houston Parade", dates: ["2026-06-27"], venue: "Downtown Houston", expectedAttendance: "700,000", category: "festival" },
      { event: "Houston Livestock Show and Rodeo", dates: ["2027-03-03","2027-03-04","2027-03-05","2027-03-06","2027-03-07","2027-03-08","2027-03-09","2027-03-10","2027-03-11","2027-03-12","2027-03-13","2027-03-14","2027-03-15","2027-03-16","2027-03-17","2027-03-18","2027-03-19","2027-03-20","2027-03-21","2027-03-22","2027-03-23"], venue: "NRG Park", expectedAttendance: "2,500,000", category: "festival" },
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
      { event: "Coldplay World Tour", dates: ["2026-06-06","2026-06-07"], venue: "State Farm Stadium", expectedAttendance: "63,000", category: "music" },
      { event: "Super Bowl LXI", dates: ["2027-02-07"], venue: "State Farm Stadium", expectedAttendance: "70,000", category: "sports" },
      { event: "Barrett-Jackson Scottsdale Auction", dates: ["2027-01-16","2027-01-17","2027-01-18","2027-01-19","2027-01-20","2027-01-21","2027-01-22","2027-01-23","2027-01-24","2027-01-25"], venue: "WestWorld of Scottsdale", expectedAttendance: "10,000", category: "corporate" },
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
      { event: "Denver Arts Festival", dates: ["2026-06-06","2026-06-07","2026-06-08"], venue: "Cherry Creek", expectedAttendance: "175,000", category: "festival" },
      { event: "Red Rocks Summer Concert Series", dates: ["2026-06-06","2026-07-04","2026-07-11","2026-08-08"], venue: "Red Rocks Amphitheatre", expectedAttendance: "9,450", category: "music" },
      { event: "Denver Startup Week", dates: ["2026-09-14","2026-09-15","2026-09-16","2026-09-17","2026-09-18"], venue: "Downtown Denver", expectedAttendance: "20,000", category: "conference" },
      { event: "National Western Stock Show", dates: ["2027-01-09","2027-01-10","2027-01-11","2027-01-12","2027-01-13","2027-01-14","2027-01-15","2027-01-16","2027-01-17","2027-01-18","2027-01-19","2027-01-20","2027-01-21","2027-01-22","2027-01-23","2027-01-24","2027-01-25"], venue: "National Western Complex", expectedAttendance: "700,000", category: "festival" },
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
      { event: "Atlanta Pride Festival", dates: ["2026-10-10","2026-10-11"], venue: "Piedmont Park", expectedAttendance: "300,000", category: "festival" },
      { event: "Dragon Con", dates: ["2026-09-04","2026-09-05","2026-09-06","2026-09-07"], venue: "Downtown Atlanta Hotels", expectedAttendance: "85,000", category: "festival" },
      { event: "SEC Championship Game", dates: ["2026-12-05"], venue: "Mercedes-Benz Stadium", expectedAttendance: "75,000", category: "sports" },
      { event: "Atlanta Braves Home Opener", dates: ["2026-04-03"], venue: "Truist Park", expectedAttendance: "41,000", category: "sports" },
    ],
    seasonalContext: "Atlanta is a major corporate hub — consistent weekday business travel year-round. Peak leisure: September (Dragon Con), October (Atlanta Pride + fall events), December (SEC Championship). Summer is moderate. Perimeter submarket is corporate-heavy — weekday rates often match or exceed weekend rates unlike other markets."
  },
};

function getDateContext(checkin) {
  const d = new Date(checkin + "T12:00:00");
  const dow = d.getDay();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const isWeekend = dow === 5 || dow === 6 || dow === 0;
  const isHolidayWeekend = (
    (month === 5 && day >= 23 && day <= 26) ||
    (month === 7 && day >= 3 && day <= 6) ||
    (month === 9 && day >= 4 && day <= 7) ||
    (month === 11 && day >= 26 && day <= 29) ||
    (month === 12 && day >= 26 && day <= 31)
  );
  return {
    dayName: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dow],
    monthName: ["January","February","March","April","May","June","July","August","September","October","November","December"][month-1],
    month, isWeekend, isHolidayWeekend,
  };
}

function getRelevantEvents(knownEvents, checkin, checkout) {
  const start = new Date(checkin + "T00:00:00");
  const end = new Date(checkout + "T23:59:59");
  const windowMs = 3 * 24 * 60 * 60 * 1000;
  const relevant = [];
  for (const ev of knownEvents) {
    for (const d of ev.dates) {
      const evDate = new Date(d + "T12:00:00");
      if (evDate >= new Date(start - windowMs) && evDate <= new Date(end.getTime() + windowMs)) {
        relevant.push({ ...ev, date: d });
        break;
      }
    }
  }
  return relevant;
}

function adjustCompetitors(base, isWeekend, isHolidayWeekend, hasHighEvents) {
  return base.map(c => {
    const r = Math.random();
    let availability = "available";
    if (isHolidayWeekend && hasHighEvents) availability = r < 0.5 ? "sold out" : r < 0.8 ? "limited" : "available";
    else if (isHolidayWeekend || hasHighEvents) availability = r < 0.25 ? "sold out" : r < 0.6 ? "limited" : "available";
    else if (isWeekend) availability = r < 0.1 ? "sold out" : r < 0.4 ? "limited" : "available";
    else availability = r < 0.05 ? "limited" : "available";
    const mult = isHolidayWeekend && hasHighEvents ? 1.35 : isHolidayWeekend ? 1.20 : hasHighEvents ? 1.15 : isWeekend ? 1.08 : 1.0;
    return { ...c, ratePerNight: Math.round(c.ratePerNight * mult), availability };
  });
}

// Robust JSON extractor — handles Gemini 2.5 Flash thinking model output
function extractJSON(text) {
  // Strip markdown fences
  let t = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  // Try direct parse first
  try { return JSON.parse(t); } catch {}

  // Find the LAST occurrence of { which is the actual JSON (after any thinking text)
  const lastBrace = t.lastIndexOf("{");
  if (lastBrace !== -1) {
    const candidate = t.slice(lastBrace);
    // Find matching closing brace
    let depth = 0;
    let end = -1;
    for (let i = 0; i < candidate.length; i++) {
      if (candidate[i] === "{") depth++;
      else if (candidate[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end !== -1) {
      try { return JSON.parse(candidate.slice(0, end + 1)); } catch {}
    }
  }

  // Find first { as fallback
  const firstBrace = t.indexOf("{");
  if (firstBrace !== -1) {
    let depth = 0, end = -1;
    const candidate = t.slice(firstBrace);
    for (let i = 0; i < candidate.length; i++) {
      if (candidate[i] === "{") depth++;
      else if (candidate[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end !== -1) {
      try { return JSON.parse(candidate.slice(0, end + 1)); } catch {}
    }
  }

  throw new Error("No valid JSON found. Raw response: " + text.slice(0, 300));;
}

async function callPricingEngine(prop, checkin, checkout, nights, competitors, signals, dateCtx, seasonalContext, apiKey) {
  const econComps = competitors.filter(c => c.tier === "economy");
  const econAvg = Math.round(econComps.reduce((a, c) => a + c.ratePerNight, 0) / econComps.length);
  const soldOut = competitors.filter(c => c.availability === "sold out").length;
  const limited = competitors.filter(c => c.availability === "limited").length;

  const eventContext = signals.length > 0
    ? signals.map(s => `- ${s.event} at ${s.venue} (${s.expectedAttendance} attendees, ${s.demandImpact} impact)`).join("\n")
    : "No major known events for this period.";

  const prompt = `You are a senior revenue management expert for G6 Hospitality (Motel 6 / Studio 6, owned by OYO).

PROPERTY: ${prop.name}, ${prop.city}, ${prop.state}
Current rate: $${prop.rate}/night | Rooms: ${prop.rooms}
Check-in: ${checkin} (${dateCtx.dayName}, ${dateCtx.monthName}) | Nights: ${nights}
Weekend: ${dateCtx.isWeekend ? "YES" : "NO"} | Holiday weekend: ${dateCtx.isHolidayWeekend ? "YES" : "NO"}

SEASONAL CONTEXT: ${seasonalContext}

COMPETITOR RATES (Kayak/Hotels.com/Expedia):
Economy avg: $${econAvg}/night | Sold out: ${soldOut}/${competitors.length} | Limited: ${limited}/${competitors.length}
${competitors.map(c => `${c.name}: $${c.ratePerNight} (${c.availability}, ${c.tier})`).join("\n")}

DEMAND SIGNALS:
${eventContext}

Based on this data, generate a pricing recommendation. Output ONLY a raw JSON object with NO explanation, NO markdown, NO thinking text before or after it. Start your response with { and end with }.

Required fields:
{
  "recommendedRate": integer,
  "rateChangeDirection": "increase" or "decrease" or "hold",
  "marketPosition": "below market" or "at market" or "above market",
  "confidence": "high" or "medium" or "low",
  "urgency": "immediate" or "this week" or "monitor",
  "primaryReason": "string",
  "reasoning": ["string", "string", "string"],
  "competitorEconomyAvg": ${econAvg},
  "occupancyAssumption": number between 0.55 and 0.95,
  "revenueImpactPerNight": integer,
  "revenueImpactTotal": integer,
  "priceFloor": integer,
  "priceCeiling": integer,
  "riskNote": "string"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini error ${response.status}`);
  }

  const data = await response.json();
  const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
  if (!text) throw new Error("Empty response from Gemini — please try again");

  const rec = extractJSON(text);

  // Recalculate revenue impact to ensure accuracy
  const occ = rec.occupancyAssumption || 0.75;
  rec.revenueImpactPerNight = Math.round((rec.recommendedRate - prop.rate) * prop.rooms * occ);
  rec.revenueImpactTotal = rec.revenueImpactPerNight * nights;

  return rec;
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
    const dateCtx = getDateContext(checkin);
    const relevantEvents = getRelevantEvents(marketData.knownEvents, checkin, checkout);
    const hasHighEvents = relevantEvents.some(e =>
      parseInt(e.expectedAttendance?.replace(/,/g, "") || "0") > 10000
    );

    const signals = relevantEvents.map(e => ({
      event: e.event, date: e.date, venue: e.venue,
      expectedAttendance: e.expectedAttendance,
      demandImpact: parseInt(e.expectedAttendance?.replace(/,/g, "") || "0") > 50000 ? "high"
                  : parseInt(e.expectedAttendance?.replace(/,/g, "") || "0") > 15000 ? "medium" : "low",
      category: e.category,
      note: `${e.event} drives hotel demand in ${marketData.city} — ${e.expectedAttendance} attendees expected`,
    }));

    if (signals.length === 0) {
      signals.push({
        event: dateCtx.isHolidayWeekend ? "Holiday Weekend — Elevated Leisure Demand"
             : dateCtx.isWeekend ? "Weekend Leisure Travel Period"
             : `${dateCtx.monthName} Corporate Travel Season`,
        date: checkin, venue: marketData.fullName,
        expectedAttendance: dateCtx.isHolidayWeekend ? "Regional" : dateCtx.isWeekend ? "Local" : "Business",
        demandImpact: dateCtx.isHolidayWeekend ? "medium" : dateCtx.isWeekend ? "medium" : "low",
        category: dateCtx.isWeekend ? "festival" : "corporate",
        note: dateCtx.isHolidayWeekend ? `Holiday weekend drives above-average leisure demand in ${marketData.city}`
            : dateCtx.isWeekend ? `Weekend leisure demand — moderate occupancy pressure in ${marketData.city}`
            : `Standard ${dateCtx.monthName} weekday — corporate travel patterns apply`,
      });
    }

    const competitors = adjustCompetitors(
      marketData.baseCompetitors, dateCtx.isWeekend, dateCtx.isHolidayWeekend, hasHighEvents
    );

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
