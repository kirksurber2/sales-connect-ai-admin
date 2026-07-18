import mongoose, { Types } from "mongoose";
import Business from "/opt/nodejs/models/business.js";
import BusinessLead from "/opt/nodejs/models/businessLead.js";
import Users from "/opt/nodejs/models/users.js";

/* ---------------- CORS ---------------- */
const ALLOWED_ORIGINS = ["https://app.salesconnectai.com", "https://admin.salesconnectai.com"];

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

/* ---------------- DB ---------------- */
let cachedConnection = null;

async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) return;
  await mongoose.connect(`${process.env.MONGODB_PRIV_ENDPOINT}/sales-connect-ai`, {
    dbName: "sales-connect-ai",
    connectTimeoutMS: 5000,
    socketTimeoutMS: 5000,
    maxPoolSize: 1,
  });
  cachedConnection = mongoose.connection;
}

/* ---------------- Helpers ---------------- */
function send(statusCode, body, origin) {
  return {
    statusCode,
    headers: corsHeaders(origin),
    body: body === "" ? "" : JSON.stringify(body),
  };
}

function cleanString(value) {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  return v ? v : null;
}

function cleanEmail(value) {
  const v = cleanString(value);
  return v ? v.toLowerCase() : null;
}

function cleanNumber(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function cleanZip(value) {
  const v = cleanString(value);
  if (!v) return undefined;
  const digits = v.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  const zipNum = Number(digits);
  return Number.isFinite(zipNum) ? zipNum : undefined;
}

function normalizeE164(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (s.startsWith("+")) {
    const digits = "+" + s.slice(1).replace(/\D/g, "");
    return /^\+[1-9]\d{1,14}$/.test(digits) ? digits : null;
  }
  const digits = s.replace(/\D/g, "");
  if (!digits) return null;
  const assumed = digits.length === 10 ? `+1${digits}` : `+${digits}`;
  return /^\+[1-9]\d{1,14}$/.test(assumed) ? assumed : null;
}

function normalizePreferredChannels(input = []) {
  if (!Array.isArray(input)) return [];
  const map = { sms: "sms", email: "email", voice: "voice", call: "voice" };
  return [
    ...new Set(
      input
        .map((x) => cleanString(x))
        .filter(Boolean)
        .map((x) => map[x.toLowerCase()] || x.toLowerCase())
    ),
  ];
}

function normalizeNotes(notes, userName = "System") {
  if (!Array.isArray(notes)) return [];
  return notes
    .map((note) => cleanString(note))
    .filter(Boolean)
    .map((content) => ({ content, createdAt: new Date(), createdBy: userName }));
}

function buildMarketing(marketing = {}, now = new Date()) {
  const pageUrl = cleanString(marketing.pageUrl);
  const referrer = cleanString(marketing.referrer);
  const landingPage = cleanString(marketing.landingPage);
  const source = cleanString(marketing.utm_source);
  const medium = cleanString(marketing.utm_medium);
  const campaign = cleanString(marketing.utm_campaign);
  const utmTerm = cleanString(marketing.utm_term);
  const utmContent = cleanString(marketing.utm_content);

  const hasAny = source || medium || campaign || utmTerm || utmContent || pageUrl || referrer || landingPage;
  if (!hasAny) return undefined;

  return {
    firstTouch: { source, medium, campaign, pageUrl, referrer, landingPage, at: now },
    lastTouch: { source, medium, campaign, pageUrl, referrer, landingPage, at: now },
    events: [{
      at: now,
      source,
      medium,
      action: "manual_lead_created",
      pageUrl,
      referrer,
      landingPage,
      meta: { utm_term: utmTerm, utm_content: utmContent },
    }],
    stats: { totalSubmissions: 1, lastAttributionSource: source, lastCampaignId: null },
  };
}

function validateStatus(status) {
  const allowed = new Set(["new", "working", "qualified", "disqualified", "converted"]);
  return allowed.has(status) ? status : "new";
}

function validateStage(stage) {
  const allowed = new Set([
    "Uncontacted",
    "Contacted",
    "Demo Scheduled",
    "Proposal Sent",
    "Negotiating",
    "Closed Won",
    "Closed Lost",
  ]);
  return allowed.has(stage) ? stage : "Uncontacted";
}

/* ---------------- Handler ---------------- */
export const handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || "";

  try {
    const method = event?.requestContext?.http?.method || event?.httpMethod;

    if (method === "OPTIONS") {
      return { statusCode: 204, headers: corsHeaders(origin), body: "" };
    }

    if (method !== "POST") {
      return send(405, { error: "Method Not Allowed" }, origin);
    }

    const claims = event?.requestContext?.authorizer?.claims || {};
    const businessId = claims["custom:businessId"];
    const userSub = claims.sub || null;

    if (!businessId) return send(401, { error: "Unauthorized: missing businessId claim" }, origin);

    await connectDB();

    const business = await Business.findById(businessId).lean();
    if (!business?._id) return send(403, { error: "Business not found or unauthorized" }, origin);

    let userName = "System";
    let userEmail = cleanEmail(claims.email) || null;
    let userId = null;

    if (userSub) {
      const user = await Users.findOne({ businessId: business._id, cognitoId: userSub })
        .select("_id firstName lastName email")
        .lean();

      if (user) {
        userId = user._id?.toString() || null;
        userEmail = cleanEmail(user.email) || userEmail;
        userName =
          [cleanString(user.firstName), cleanString(user.lastName)].filter(Boolean).join(" ") ||
          userEmail ||
          "System";
      }
    }

    let req = {};
    try {
      req = JSON.parse(event.body || "{}");
    } catch {
      return send(400, { error: "Invalid JSON body" }, origin);
    }

    const firstName = cleanString(req.firstName);
    const lastName = cleanString(req.lastName);
    const email = cleanEmail(req.email);
    const phoneE164 = normalizeE164(req.phone);

    if (!firstName) return send(400, { error: "First name is required." }, origin);
    if (!lastName) return send(400, { error: "Last name is required." }, origin);
    if (!phoneE164) return send(400, { error: "A valid phone number is required." }, origin);

    const now = new Date();

    const lookupFilter = { businessId: new Types.ObjectId(businessId) };
    if (email) lookupFilter.email = email;
    else lookupFilter.phoneE164 = phoneE164;

    const normalizedNotes = normalizeNotes(req.notes, userName);
    const textAreaMessage =
      cleanString(req.textAreaMessage) ||
      cleanString(req.message) ||
      (normalizedNotes[0]?.content ?? null);

    const payload = {
      businessId: new Types.ObjectId(businessId),
      businessSlug: business.businessSlug,
      firstName,
      lastName,
      email,
      phone: phoneE164,
      phoneE164,
      businessName: cleanString(req.businessName),
      textAreaMessage,
      address: {
        street: cleanString(req.address?.street),
        city: cleanString(req.address?.city),
        state: cleanString(req.address?.state),
        zip: cleanZip(req.address?.zip),
        country: cleanString(req.address?.country),
      },
      formId: cleanString(req.formId),
      sessionTypeSlug: cleanString(req.sessionTypeSlug),
      source: cleanString(req.source) || "manual-entry",
      primaryChannel: cleanString(req.primaryChannel) || "Voice",
      primaryCampaign: cleanString(req.primaryCampaign),
      preferences: {
        timezone: cleanString(req.preferences?.timezone) || "America/Chicago",
        language: cleanString(req.preferences?.language) || "en",
        preferredChannels: normalizePreferredChannels(req.preferences?.preferredChannels),
      },
      status: validateStatus(req.status),
      stage: validateStage(req.stage),
      queue: cleanString(req.queue) || "New",
      score: cleanNumber(req.score),
      leadScore: cleanNumber(req.score),
      estDealValue: cleanNumber(req.estDealValue),
      tags: Array.isArray(req.tags)
        ? [...new Set(req.tags.map((t) => cleanString(t)).filter(Boolean))]
        : [],
      lastTouchAt: now,
      lastAction: "Lead created manually",
      lastActionDate: now,
      createdByCognitoId: userSub || undefined,
    };

    const marketing = buildMarketing(req.marketing, now);
    if (marketing) payload.marketing = marketing;

    let lead = await BusinessLead.findOne(lookupFilter);
    const existed = !!lead;

    if (lead) {
      Object.assign(lead, {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        phoneE164: payload.phoneE164,
        businessName: payload.businessName,
        textAreaMessage: payload.textAreaMessage,
        address: payload.address,
        formId: payload.formId,
        sessionTypeSlug: payload.sessionTypeSlug,
        source: payload.source,
        primaryChannel: payload.primaryChannel,
        primaryCampaign: payload.primaryCampaign,
        preferences: payload.preferences,
        status: payload.status,
        stage: payload.stage,
        queue: payload.queue,
        tags: payload.tags,
        lastTouchAt: now,
        lastInboundAt: now,
        lastAction: payload.lastAction,
        lastActionDate: now,
      });

      if (payload.score !== undefined) lead.score = payload.score;
      if (payload.leadScore !== undefined) lead.leadScore = payload.leadScore;
      if (payload.estDealValue !== undefined) lead.estDealValue = payload.estDealValue;
      if (payload.createdByCognitoId) lead.createdByCognitoId = payload.createdByCognitoId;
      if (marketing) lead.marketing = marketing;
      if (!lead.firstInboundAt) lead.firstInboundAt = now;
      if (!lead.firstTouchAt) lead.firstTouchAt = now;
      if (normalizedNotes.length > 0) lead.notes = [...normalizedNotes, ...(lead.notes || [])];

      lead.interactions = [
        {
          kind: "note",
          direction: "n/a",
          channel: "System",
          bodySnippet: `Lead updated manually by ${userName}`,
          meta: { source: "manual-lead-entry", noteCountAdded: normalizedNotes.length },
          createdByUserId: userId || userSub || undefined,
          createdByName: userName || undefined,
          createdByEmail: userEmail || undefined,
          createdAt: now,
        },
        ...(lead.interactions || []),
      ];

      lead = await lead.save();
    } else {
      lead = await BusinessLead.create({
        ...payload,
        notes: normalizedNotes,
        interactions: [{
          kind: "note",
          direction: "n/a",
          channel: "System",
          bodySnippet: `Lead created manually by ${userName}`,
          meta: { source: "manual-lead-entry", noteCountAdded: normalizedNotes.length },
          createdByUserId: userId || userSub || undefined,
          createdByName: userName || undefined,
          createdByEmail: userEmail || undefined,
          createdAt: now,
        }],
        firstInboundAt: now,
        lastInboundAt: now,
        firstTouchAt: now,
      });
    }

    return send(200, {
      ok: true,
      wasExistingLead: existed,
      business: { _id: business._id, businessSlug: business.businessSlug, name: business.name },
      lead,
    }, origin);

  } catch (error) {
    console.error("create lead manual error", error);
    return send(500, { error: "Internal Server Error", message: error?.message || "Unknown error" }, origin);
  }
};
