import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

async function test() {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH || "";
  
  console.log("Testing with API ID:", apiId, "Hash:", apiHash);

  try {
    const session = new StringSession("");
    const client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 1,
    });
    console.log("Client created...");
    
    await client.connect();
    console.log("Client connected...");
    
    await client.sendCode(
      { apiId, apiHash },
      "+1234567890"
    );
    console.log("Code sent!");
  } catch (err) {
    console.log("CAUGHT ERROR:");
    console.log(typeof err, err instanceof Error);
    console.log(err);
  }
  process.exit(0);
}

test();
