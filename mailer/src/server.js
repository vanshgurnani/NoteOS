import http from "node:http";
import crypto from "node:crypto";
import nodemailer from "nodemailer";

const PORT = Number(process.env.PORT || 10000);
const API_KEY = process.env.MAILER_API_KEY || "";
const FRONTEND_URL = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || SMTP_USER;

const required = {
  MAILER_API_KEY: API_KEY,
  FRONTEND_URL,
  SMTP_USER,
  SMTP_PASSWORD,
  SMTP_FROM_EMAIL,
};
const missing = Object.entries(required).filter(([, value]) => !value).map(([key]) => key);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}
if (!FRONTEND_URL.startsWith("https://")) {
  console.error("FRONTEND_URL must be an HTTPS origin");
  process.exit(1);
}
if (!Number.isInteger(SMTP_PORT) || SMTP_PORT < 1 || SMTP_PORT > 65535) {
  console.error("SMTP_PORT is invalid");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  requireTLS: SMTP_PORT !== 465,
  auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  tls: { minVersion: "TLSv1.2" },
  connectionTimeout: 12000,
  greetingTimeout: 12000,
  socketTimeout: 20000,
  disableFileAccess: true,
  disableUrlAccess: true,
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));
const cleanHeader = (value, fallback, max = 120) =>
  String(value || fallback).replace(/[\r\n\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) || fallback;

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(JSON.stringify(payload));
}

function authorized(request) {
  const supplied = request.headers.authorization || "";
  const expected = `Bearer ${API_KEY}`;
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16 * 1024) {
      const error = new Error("Request body too large");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Request body must be valid JSON");
    error.statusCode = 400;
    throw error;
  }
}

const server = http.createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    return sendJson(response, 200, { ok: true, service: "noteos-mailer" });
  }

  if (request.method !== "POST" || request.url !== "/v1/email/invitations") {
    return sendJson(response, 404, { error: "not_found" });
  }
  if (!authorized(request)) {
    return sendJson(response, 401, { error: "unauthorized" });
  }
  if (!String(request.headers["content-type"] || "").includes("application/json")) {
    return sendJson(response, 415, { error: "application_json_required" });
  }

  try {
    const body = await readJson(request);
    const recipient = String(body.to || "").trim().toLowerCase();
    const token = String(body.inviteToken || "");
    const role = body.role === "viewer" ? "viewer" : body.role === "editor" ? "editor" : "";
    if (!emailPattern.test(recipient) || recipient.length > 254) {
      return sendJson(response, 422, { error: "invalid_recipient" });
    }
    if (!/^[A-Za-z0-9_-]{30,100}$/.test(token)) {
      return sendJson(response, 422, { error: "invalid_invitation_token" });
    }
    if (!role) {
      return sendJson(response, 422, { error: "invalid_role" });
    }

    const inviterName = cleanHeader(body.inviterName, "A teammate");
    const noteTitle = cleanHeader(body.noteTitle, "a note");
    const inviteUrl = new URL(`/invite/${encodeURIComponent(token)}`, FRONTEND_URL).toString();
    const safeInviter = escapeHtml(inviterName);
    const safeTitle = escapeHtml(noteTitle);
    const safeEmail = escapeHtml(recipient);
    const safeRole = escapeHtml(role);

    await transporter.sendMail({
      from: { name: "NOTE OS", address: SMTP_FROM_EMAIL },
      to: recipient,
      subject: `${inviterName} invited you to collaborate on "${noteTitle}" in NOTE OS`,
      text: `${inviterName} invited you to collaborate on "${noteTitle}" in NOTE OS.\n\nYou have ${role} access.\n\nAccept your invitation: ${inviteUrl}\n\nSign in with Google using ${recipient} to continue.`,
      html: `<p>${safeInviter} invited you to collaborate on <strong>${safeTitle}</strong> in NOTE OS.</p><p>You have <strong>${safeRole}</strong> access.</p><p><a href="${escapeHtml(inviteUrl)}">Accept your invitation</a></p><p>Sign in with Google using ${safeEmail} to continue.</p><p>If you were not expecting this invitation, you can ignore this email.</p>`,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    return sendJson(response, 200, { success: true, message: "Invitation email sent" });
  } catch (error) {
    console.error("Invitation email failed:", error?.message || "unknown error");
    return sendJson(response, error.statusCode || 502, {
      error: error.statusCode === 413 ? "request_too_large" : "email_delivery_failed",
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`NOTE OS mailer listening on port ${PORT}`);
});
