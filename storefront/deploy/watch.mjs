// Strażnik obok sklepu. Co minutę pyta publiczny adres zdrowia.
// Trzy razy z rzędu źle = mail. Wstanie sklepu = drugi mail, że już działa.
// Działa nawet gdy kontener sklepu jest wyłączony, bo to osobny proces.
// Hasło poczty bierze z integrations.json (tak jak panel), nie wypisuje go.

import { createDecipheriv, createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import tls from "node:tls";

const URL = process.env.WATCH_URL || "https://sonax.sklep.pl/api/zdrowie";
const DATA = process.env.DATA_DIR || "/data";
const STATE = path.join(DATA, "watch-state.json");
const EVERY = 60_000;
const NEED = 3;

function log(msg) {
  console.log(`[straznik] ${new Date().toISOString()} ${msg}`);
}

function decrypt(box, secret) {
  try {
    const [v, iv, tag, data] = String(box).split(":");
    if (v !== "v1" || !secret) return "";
    const key = createHash("sha256").update(`sonax-integrations:${secret}`).digest();
    const d = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
    d.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(data, "base64")), d.final()]).toString("utf8");
  } catch {
    return "";
  }
}

function mailAccount() {
  let file = {};
  try {
    file = JSON.parse(readFileSync(path.join(DATA, "integrations.json"), "utf8"));
  } catch { /* brak pliku */ }
  const values = file.values ?? {};
  const secret = process.env.PAYLOAD_SECRET || "";
  const host = values["mail.host"] || process.env.SMTP_HOST || "";
  const user = values["mail.user"] || process.env.SMTP_USER || "";
  const pass = decrypt(file.secrets?.["mail.password"], secret) || process.env.SMTP_PASSWORD || "";
  const from = values["mail.from"] || process.env.MAIL_FROM || user;
  const notify = (values["mail.notify"] || process.env.MAIL_NOTIFY || from).split(/[,;\s]+/).filter(Boolean);
  const starttls = values["mail.security"] === "starttls" || process.env.SMTP_SECURE === "0";
  const port = Number(values["mail.port"] || process.env.SMTP_PORT) || (starttls ? 587 : 465);
  if (!host || !user || !pass || !notify.length) return null;
  return { host, port, starttls, user, pass, from, to: notify };
}

function loadState() {
  try {
    return JSON.parse(readFileSync(STATE, "utf8"));
  } catch {
    return { fails: 0, alerted: false };
  }
}

function saveState(s) {
  try {
    writeFileSync(STATE, JSON.stringify(s), { mode: 0o600 });
  } catch (e) {
    log(`nie zapisano stanu: ${e.message}`);
  }
}

function readReply(socket, prior = "") {
  return new Promise((resolve, reject) => {
    let buf = prior;
    const done = () => {
      const lines = buf.split(/\r?\n/).filter(Boolean);
      const last = lines[lines.length - 1] ?? "";
      if (!/^\d{3} /.test(last)) return false;
      const code = Number(last.slice(0, 3));
      if (code >= 400) reject(new Error(`SMTP ${code}`));
      else resolve(buf);
      return true;
    };
    if (done()) return;
    const onData = (chunk) => {
      buf += chunk.toString("utf8");
      if (done()) socket.off("data", onData);
    };
    socket.on("data", onData);
    socket.once("error", reject);
  });
}

function command(socket, line) {
  socket.write(line + "\r\n");
  return readReply(socket);
}

function openSocket(account) {
  return new Promise((resolve, reject) => {
    let prior = "";
    const socket = account.starttls
      ? net.connect(account.port, account.host)
      : tls.connect({ host: account.host, port: account.port, servername: account.host });
    socket.on("data", (chunk) => { prior += chunk.toString("utf8"); });
    socket.once("error", reject);
    socket.once(account.starttls ? "connect" : "secureConnect", () => {
      socket.removeAllListeners("data");
      socket.removeAllListeners("error");
      resolve({ socket, prior });
    });
  });
}

async function connect(account) {
  const opened = await openSocket(account);
  await readReply(opened.socket, opened.prior);
  if (!account.starttls) return opened.socket;
  await command(opened.socket, "EHLO sonax.sklep.pl");
  await command(opened.socket, "STARTTLS");
  const secure = tls.connect({ socket: opened.socket, servername: account.host });
  await new Promise((ok, no) => {
    secure.once("secureConnect", ok);
    secure.once("error", no);
  });
  return secure;
}

async function send(account, subject, text) {
  const socket = await connect(account);
  const b64 = (s) => Buffer.from(s, "utf8").toString("base64");
  await command(socket, "EHLO sonax.sklep.pl");
  await command(socket, "AUTH LOGIN");
  await command(socket, b64(account.user));
  await command(socket, b64(account.pass));
  await command(socket, `MAIL FROM:<${account.from}>`);
  for (const to of account.to) await command(socket, `RCPT TO:<${to}>`);
  await command(socket, "DATA");
  const body = [
    `From: Sklep SONAX <${account.from}>`,
    `To: ${account.to.join(", ")}`,
    `Subject: =?UTF-8?B?${b64(subject)}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    text,
    ".",
  ].join("\r\n");
  await command(socket, body);
  await command(socket, "QUIT");
  socket.end();
}

async function check() {
  const res = await fetch(URL, { signal: AbortSignal.timeout(20_000), cache: "no-store" });
  let problems = [];
  try {
    const body = await res.json();
    if (Array.isArray(body.problems)) problems = body.problems.map(String);
  } catch { /* nie JSON */ }
  if (res.status === 200) return { ok: true, problems };
  return { ok: false, problems: problems.length ? problems : [`adres zdrowia odpowiedział kodem ${res.status}`] };
}

async function tick() {
  const state = loadState();
  let result;
  try {
    result = await check();
  } catch (e) {
    result = { ok: false, problems: [`strona nie odpowiada (${e.name === "TimeoutError" ? "brak odpowiedzi" : "brak połączenia"})`] };
  }
  if (result.ok) {
    if (state.alerted) {
      const account = mailAccount();
      if (account) {
        try {
          await send(account, "Sklep Sonax znowu działa", "Sprawdzanie strony wróciło do normy. Sklep odpowiada, a synchronizacja nie zgłasza błędu.");
          log("wysłano mail: sklep działa");
        } catch (e) {
          log(`nie wysłano maila o powrocie: ${e.message}`);
          return;
        }
      }
    }
    saveState({ fails: 0, alerted: false });
    return;
  }
  state.fails = (state.fails || 0) + 1;
  log(`problem ${state.fails}/${NEED}: ${result.problems.join("; ")}`);
  if (state.fails >= NEED && !state.alerted) {
    const account = mailAccount();
    if (!account) {
      log("brak konfiguracji poczty – alarm tylko w logu");
      saveState(state);
      return;
    }
    try {
      await send(
        account,
        "Sklep Sonax: coś nie działa",
        `Od kilku minut sklep albo synchronizacja zgłasza problem.\n\n${result.problems.map((p) => `- ${p}`).join("\n")}\n\nAdres sprawdzany: ${URL}\n`,
      );
      state.alerted = true;
      log("wysłano mail z alarmem");
    } catch (e) {
      log(`nie wysłano alarmu: ${e.message}`);
    }
  }
  saveState(state);
}

log(`pilnuję ${URL}`);
if (!existsSync(DATA)) log(`nie widzę katalogu ${DATA}`);
setTimeout(() => void tick(), 15_000);
setInterval(() => void tick(), EVERY);
