import crypto from "node:crypto";
import nodemailer from "nodemailer";

export const config = { runtime: "nodejs" };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));
const cleanHeader = (value, fallback, max = 120) =>
  String(value || fallback).replace(/[\r\n\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) || fallback;

function json(res, status, payload) {
  res.status(status).setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.json(payload);
}

function authorized(req) {
  const secret = process.env.MAILER_API_KEY || "";
  const supplied = req.headers.authorization || "";
  const expected = `Bearer ${secret}`;
  if (!secret) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "method_not_allowed" });
  }
  if (!authorized(req)) return json(res, 401, { error: "unauthorized" });

  const body = req.body || {};
  const recipient = String(body.to || "").trim().toLowerCase();
  const token = String(body.inviteToken || "");
  const role = body.role === "viewer" ? "viewer" : body.role === "editor" ? "editor" : "";
  if (!emailPattern.test(recipient) || recipient.length > 254) return json(res, 422, { error: "invalid_recipient" });
  if (!/^[A-Za-z0-9_-]{30,100}$/.test(token)) return json(res, 422, { error: "invalid_invitation_token" });
  if (!role) return json(res, 422, { error: "invalid_role" });

  const smtpUser = process.env.SMTP_USER || "";
  const smtpPassword = process.env.SMTP_PASSWORD || "";
  const fromEmail = process.env.SMTP_FROM_EMAIL || smtpUser;
  if (!smtpUser || !smtpPassword || !fromEmail) return json(res, 503, { error: "mailer_not_configured" });

  try {
    const inviterName = cleanHeader(body.inviterName, "A teammate");
    const noteTitle = cleanHeader(body.noteTitle, "a note");
    const frontendUrl = (process.env.FRONTEND_URL || "https://noteos-frontend.onrender.com").replace(/\/$/, "");
    const inviteUrl = new URL(`/invite/${encodeURIComponent(token)}`, frontendUrl).toString();
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      requireTLS: Number(process.env.SMTP_PORT || 587) !== 465,
      auth: { user: smtpUser, pass: smtpPassword },
      tls: { minVersion: "TLSv1.2" },
      connectionTimeout: 12000,
      greetingTimeout: 12000,
      socketTimeout: 20000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    await transporter.sendMail({
      from: { name: "NOTE OS", address: fromEmail },
      to: recipient,
      subject: `${inviterName} invited you to collaborate on "${noteTitle}" in NOTE OS`,
      text: `${inviterName} invited you to collaborate on "${noteTitle}" in NOTE OS.\n\nYou have ${role} access.\n\nAccept your invitation: ${inviteUrl}\n\nSign in with Google using ${recipient} to continue.`,
      html: `<p>${escapeHtml(inviterName)} invited you to collaborate on <strong>${escapeHtml(noteTitle)}</strong> in NOTE OS.</p><p>You have <strong>${role}</strong> access.</p><p><a href="${escapeHtml(inviteUrl)}">Accept your invitation</a></p><p>Sign in with Google using ${escapeHtml(recipient)} to continue.</p><p>If you were not expecting this invitation, you can ignore this email.</p>`,
    });
    return json(res, 200, { success: true, message: "Invitation email sent" });
  } catch (error) {
    console.error("NOTE OS invitation email failed:", error?.message || "unknown error");
    return json(res, 502, { error: "email_delivery_failed" });
  }
}
