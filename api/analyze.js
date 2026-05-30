export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prop, checkin, checkout, nights } = req.body;

  if (!prop || !checkin || !checkout || !nights) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  const prompt = `You are a hotel revenue management AI for G6 Hospitality (Motel 6 / Studio 6 brands, owned by OYO).
Use Google Search to find REAL current data. Complete all three tasks and return a single JSON object.

PROPERTY: ${prop.name}, ${prop.city}, ${prop.state}
CURRENT RATE: $${prop.rate}/night | ROOMS: ${prop.rooms} | DATES: ${checkin} to ${checkout} (${nights} nights)

TASK 1 — Market Intel Agent
Search Booking.com and Expedia for real competitor hotel rates near ${prop.city}, ${prop.state} for ${checkin}.
Target economy and midscale brands: Super 8, Days Inn, La Quinta, Hampton Inn, Best Western, Comfort Inn, Red Roof Inn, Holiday Inn Express, Travelodge.
Find exactly 7 competitors.

TASK 2 — Demand Scout Agent
Search for real upcoming events in ${prop.city} around ${checkin} driving hotel demand: concerts, sports games, conferences, festivals, conventions.
Find exactly 5 events.

TASK 3 — Pricing Engine
Based on competitor rates and events found, generate a specific actionable pricing recommendation.
revenueImpactPerNight = (recommendedRate - ${prop.rate}) × ${prop.rooms} × 0.75
revenueImpactTotal = revenueImpactPerNight × ${nights}

Return ONLY valid JSON, zero markdown, zero explanation:
{
  "competitors": [
    {"name":"Hotel Name","brand":"Brand","distanceMiles":1.5,"ratePerNight":75,"availability":"available","tier":"economy"}
  ],
  "signals": [
    {"event":"Event Name","date":"${checkin}","venue":"Venue Name","expectedAttendance":"12,000","demandImpact":"high","category":"music","note":"one sentence why this drives hotel demand"}
  ],
  "recommendation": {
    "recommendedRate": 79,
    "rateChangeDirection": "increase",
    "marketPosition": "below market",
    "confidence": "high",
    "urgency": "immediate",
    "primaryReason": "One compelling data-backed sentence explaining the recommendation",
    "reasoning": ["specific reason 1", "specific reason 2", "specific reason 3"],
    "competitorEconomyAvg": 72,
    "occupancyAssumption": 0.75,
    "revenueImpactPerNight": 1140,
    "revenueImpactTotal": 2280,
    "priceFloor": 59,
    "priceCeiling": 89,
    "riskNote": "one line caveat or risk"
  }
}

Rules:
- competitors: exactly 7 | availability: available / limited / sold out | tier: economy / midscale
- signals: exactly 5 | demandImpact: high / medium / low | category: music / sports / conference / festival / corporate
- all number fields must be integers, no nulls, no missing fields
- revenueImpactPerNight and revenueImpactTotal must be calculated correctly`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2000 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(() => ({}));
      return res.status(500).json({
        error: errData?.error?.message || `Gemini API error ${geminiRes.status}`,
      });
    }

    const geminiData = await geminiRes.json();
    const text = (geminiData.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || "")
      .join("");

    if (!text) {
      return res.status(500).json({ error: "Empty response from Gemini — please try again" });
    }

    // Parse JSON from response
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); }
        catch { return res.status(500).json({ error: "Could not parse AI response — try again" }); }
      } else {
        return res.status(500).json({ error: "Could not parse AI response — try again" });
      }
    }

    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: e.message || "Server error" });
  }
}
