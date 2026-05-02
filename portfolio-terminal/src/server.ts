import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import dotenv from 'dotenv';
import express from 'express';
import nodemailer from 'nodemailer';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

dotenv.config();

const browserDistFolder = join(import.meta.dirname, '../browser');
const dataFolder = join(process.cwd(), 'src/data');
const portfolioPath = join(dataFolder, 'portfolio.json');
const messagesPath = join(dataFolder, 'messages.json');

const app = express();
const angularApp = new AngularNodeAppEngine();

type ContactPayload = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

type StoredMessage = ContactPayload & {
  id: string;
  createdAt: string;
};

const mailHost = process.env['MAIL_HOST'];
const mailPort = Number(process.env['MAIL_PORT'] ?? 587);
const mailUser = process.env['MAIL_USER'];
const mailPass = process.env['MAIL_PASS'];
const mailTo = process.env['MAIL_TO'];

const mailTransport =
  mailHost && mailUser && mailPass
    ? nodemailer.createTransport({
        host: mailHost,
        port: mailPort,
        secure: mailPort === 465,
        auth: {
          user: mailUser,
          pass: mailPass,
        },
      })
    : null;

app.use(express.json());

app.get('/api/portfolio', async (_req, res) => {
  try {
    const file = await readFile(portfolioPath, 'utf-8');
    res.type('application/json').status(200).send(file);
  } catch {
    res.status(500).json({ ok: false, error: 'Unable to load portfolio data.' });
  }
});

app.post('/api/contact', async (req, res) => {
  const payload = req.body as Partial<ContactPayload>;
  const name = payload.name?.trim();
  const email = payload.email?.trim();
  const phone = payload.phone?.trim();
  const message = payload.message?.trim();

  const emailIsValid = typeof email === 'string' && /.+@.+\..+/.test(email);
  if (!name || !emailIsValid || !phone || !message) {
    res.status(400).json({
      ok: false,
      error: 'Fields name, email, phone and message are required.',
    });
    return;
  }

  const stored: StoredMessage = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    name,
    email,
    phone,
    message,
  };

  try {
    const existingRaw = await readFile(messagesPath, 'utf-8').catch(() => '[]');
    const existing = JSON.parse(existingRaw) as StoredMessage[];
    existing.push(stored);
    await writeFile(messagesPath, `${JSON.stringify(existing, null, 2)}\n`, 'utf-8');

    if (mailTransport && mailTo) {
      await mailTransport.sendMail({
        from: mailUser,
        to: mailTo,
        subject: `Portfolio contact from ${name}`,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone}`,
          '',
          'Message:',
          message,
        ].join('\n'),
      });
    }

    res.status(200).json({ ok: true, id: stored.id, createdAt: stored.createdAt });
  } catch {
    res.status(500).json({ ok: false, error: 'Unable to store message.' });
  }
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
