<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# การออกแบบระบบแจ้งเตือนผ่าน Telegram Bot ด้วย Vercel Cron Jobs

ด้านล่างคือ **PRD ฉบับเต็ม** สำหรับระบบ **SubVault** พร้อมรายละเอียดการออกแบบระบบแจ้งเตือนผ่าน Telegram Bot ด้วย Vercel Cron Jobs โดยออกแบบให้เหมาะกับการใช้คนเดียว, เก็บข้อมูล credential และ subscription อย่างปลอดภัย, และ deploy บน GitHub + Vercel + Supabase

## Product Brief

**ชื่อระบบ:** SubVault
**ประเภท:** Personal Subscription Tracker + Encrypted Credential Vault
**ผู้ใช้หลัก:** ผู้ใช้คนเดียว (Single-user)
**เป้าหมาย:** บันทึกและติดตามบริการออนไลน์ เช่น AI providers, VPN, Streaming, SaaS และบริการรายเดือน/รายปี พร้อมเก็บบัญชี รหัสผ่าน ค่าใช้จ่าย วันหมดอายุ และแจ้งเตือนผ่าน Telegram

ระบบจะรองรับทั้งรายชื่อ provider ที่กำหนดไว้ล่วงหน้า เช่น OpenAI, Google, Netflix, YouTube Premium, NordVPN และการเพิ่ม provider แบบ custom ได้เอง

## Problem Statement

ผู้ใช้มักมีหลาย subscription กระจายอยู่ในหลายหมวด เช่น AI tools, VPN, streaming และ productivity SaaS ทำให้เกิดปัญหาหลักดังนี้

- ลืมวันต่ออายุหรือวันหมดอายุ
- ถูกตัดเงินอัตโนมัติโดยไม่ทันตรวจสอบ
- จำไม่ได้ว่าบัญชีใดใช้ email หรือ password ใด
- ไม่เห็นภาพรวมค่าใช้จ่ายรายเดือนและรายปี
- เก็บข้อมูล credential ไว้ในโน้ตหรือ spreadsheet ซึ่งมีความเสี่ยงด้านความปลอดภัย
- ต้องกรอกข้อมูลจากใบเสร็จ, screenshot หรือข้อความซ้ำด้วยมือ

SubVault จะแก้ปัญหานี้ด้วย vault ที่เข้ารหัส, dashboard ค่าใช้จ่าย, subscription reminders และ Telegram Bot ที่รับภาพหรือข้อความเพื่อสร้างรายการแบบกึ่งอัตโนมัติ

## Goals

### Primary Goals

- เก็บข้อมูล subscription และ credential ไว้ในระบบเดียว
- แสดงค่าใช้จ่ายรายเดือน/รายปีแยกตามหมวดหมู่
- แจ้งเตือนผ่าน Telegram ก่อนวันต่ออายุหรือวันหมดอายุ
- รองรับการกรอกข้อมูลเองและการนำเข้าผ่าน Telegram Bot
- เข้ารหัสข้อมูลสำคัญ เช่น account, password และ secure notes
- ใช้งานสะดวกบน PC, Android browser และ mobile browser
- ใช้ stack ที่ deploy และดูแลง่าย: Next.js, Supabase, Vercel และ GitHub


### Non-Goals (MVP)

สิ่งต่อไปนี้ไม่ควรอยู่ในรุ่นแรก เพื่อลดความซับซ้อน

- Browser extension สำหรับ autofill password
- Shared/family/team vault
- Bank account linking และ auto-detect transaction
- Payment processing ภายในระบบ
- Password breach monitoring แบบ real-time
- Native Android/iOS application
- Multi-user role/permission system


## User Profile

| Persona | ความต้องการหลัก |
| :-- | :-- |
| Single-user power user | ต้องการบันทึก AI, VPN, streaming, cloud และ SaaS หลายรายการ |
| Privacy-conscious user | ต้องการเก็บ credential แบบเข้ารหัสและควบคุมข้อมูลเอง |
| Cost-conscious user | ต้องการเห็นว่าเสียรายเดือน/รายปีเท่าไร และรายการใดใกล้ renew |
| Telegram-heavy user | ต้องการส่งรูปใบเสร็จหรือ copy ข้อความเข้าบอท แล้วให้ระบบสร้าง draft อัตโนมัติ |

## Functional Requirements

### Authentication

ระบบใช้ Supabase Auth แบบ email/password ในทางเทคนิค แต่ UX สามารถเรียกว่า “Username / Password” ได้ โดยระบบจะสร้าง internal email format เช่น `username@subvault.local` เพื่อให้ผู้ใช้ไม่จำเป็นต้องกรอก email จริง

Supabase รองรับการปิด Confirm Email ได้ และเมื่อปิดแล้วผู้ใช้จะได้รับ session หลังสมัครทันทีโดยไม่ต้อง verify email[^1]


| Requirement | รายละเอียด |
| :-- | :-- |
| Sign up | สมัครด้วย username และ password |
| Sign in | Login ด้วย username และ password |
| No email verification | ปิด Confirm Email ใน Supabase |
| Password reset | MVP ใช้ recovery code หรือ admin reset; ไม่ใช้ email reset |
| Session | ใช้ Supabase session + refresh token |
| Single-user mode | อนุญาตเฉพาะ account หลักหนึ่ง account ใน production |
| Logout | Logout ได้จากทุก device ใน Settings |
| Rate limit | จำกัดการ login ผิดซ้ำเพื่อลด brute-force attack |

### Provider Catalog

ผู้ใช้เลือก provider ได้จาก preset catalog หรือสร้าง custom provider


| หมวด | ตัวอย่าง Provider Preset |
| :-- | :-- |
| AI | ChatGPT, Claude, Gemini, Perplexity, Midjourney, Cursor |
| VPN | NordVPN, Surfshark, Proton VPN, ExpressVPN |
| Streaming | Netflix, YouTube Premium, Disney+, Spotify, Apple Music |
| Cloud/SaaS | Google One, iCloud+, Notion, Canva, GitHub, Vercel |
| Gaming | Steam, PlayStation Plus, Xbox Game Pass |
| Other | Custom provider |

ความสามารถที่ต้องมี

- Search provider จากชื่อ
- Filter ตาม category
- แสดง logo, website และ category
- เลือก “Custom Provider” เพื่อเพิ่มชื่อ, website, logo URL และ category เอง
- สามารถแก้ไข custom provider ได้
- preset provider เป็น read-only สำหรับข้อมูลกลาง แต่สามารถสร้าง subscription จาก provider นั้นได้


### Subscription Vault

แต่ละ subscription เป็น vault item หนึ่งรายการ และรองรับข้อมูลต่อไปนี้


| Field | Required | Sensitivity | คำอธิบาย |
| :-- | --: | :-- | :-- |
| Provider | Yes | Low | ชื่อบริการ เช่น Netflix |
| Category | Yes | Low | AI, VPN, Streaming, SaaS, Other |
| Plan name | No | Low | เช่น Premium, Pro, Family |
| Billing cycle | Yes | Low | Monthly, Quarterly, 6-month, Annual, Custom |
| Amount | Yes | Low | ราคาที่จ่ายจริงต่อรอบบิล |
| Currency | Yes | Low | THB default, รองรับ USD/EUR/JPY เป็นต้น |
| Start date | No | Low | วันที่เริ่มใช้งาน |
| Renewal/expiry date | Yes | Low | วันที่บริการจะหมดอายุหรือตัดรอบใหม่ |
| Auto-renew | Yes | Low | เปิด/ปิดการต่ออายุอัตโนมัติ |
| Account/email | No | High | เข้ารหัสก่อนเก็บ |
| Password | No | High | เข้ารหัสก่อนเก็บ |
| Support contact | No | Medium | URL, email หรือเบอร์ผู้ให้บริการ |
| Notes | No | High | ข้อมูลเพิ่มเติม เช่น recovery code หรือเงื่อนไข |
| Tags | No | Low | เช่น work, personal, shared, essential |
| Receipt image URL | No | Medium | ลิงก์ไฟล์ใบเสร็จใน Supabase Storage |
| Source | Yes | Low | Manual, Telegram Text, Telegram Image, Import |
| Created at / updated at | Yes | Low | audit metadata |

### Vault Operations

- เพิ่ม subscription แบบ manual
- แก้ไขข้อมูล subscription
- ดูรายละเอียด item แบบ mask password เป็นค่าเริ่มต้น
- ปุ่ม reveal password ที่ต้องยืนยันด้วย session หรือ PIN เพิ่มเติม
- Copy username/password โดยมี toast confirmation
- ลบรายการแบบ soft delete ก่อน
- Restore รายการที่ลบในช่วงเวลาที่กำหนด
- Search จาก provider, plan, tag, account หรือ note metadata
- Sort ตามวันหมดอายุ, ราคา, วันที่สร้าง หรือ provider
- Filter ตาม category, currency, status, auto-renew และ expiry range


## Dashboard Requirements

Dashboard ต้องตอบคำถามสำคัญได้ภายในหน้าเดียว

- เดือนนี้ต้องจ่ายเท่าไร
- ปีนี้มีค่าใช้จ่ายประมาณเท่าไร
- มีอะไรหมดอายุใน 7, 14 และ 30 วัน
- รายการใดเปิด auto-renew
- หมวดใดใช้เงินมากที่สุด
- มีรายการ expired แล้วหรือไม่


### Dashboard Widgets

| Widget | รายละเอียด |
| :-- | :-- |
| Total active subscriptions | จำนวน subscription ที่ active |
| Monthly normalized cost | ค่าใช้จ่ายต่อเดือนหลังแปลง annual/quarterly เป็น monthly equivalent |
| Annual forecast | ค่าใช้จ่ายคาดการณ์ต่อปี |
| Upcoming renewals | รายการใกล้หมดอายุ |
| Category breakdown | ค่าใช้จ่ายตามหมวด |
| Currency breakdown | แยกยอดตาม currency ก่อน conversion |
| Auto-renew risk list | รายการที่จะตัดบัตรอัตโนมัติเร็ว ๆ นี้ |
| Expired list | รายการที่หมดอายุแล้วแต่ยังไม่ archive |

แนวคิดจาก subscription tracker คือการมี renewal calendar, spending analytics และการแยกประเภทค่าใช้จ่าย เพื่อช่วยให้เห็น recurring commitments ได้ชัดเจนขึ้น[^2]

## Telegram Bot Requirements

Telegram Bot เป็นช่องทางเสริม ไม่ใช่ระบบหลัก และต้องไม่เก็บ secret ไว้ใน message history โดยไม่จำเป็น

### Bot Commands

| Command | หน้าที่ |
| :-- | :-- |
| `/start` | เริ่มต้นและแสดงวิธีเชื่อม bot |
| `/link <code>` | เชื่อม Telegram chat กับบัญชี SubVault |
| `/add` | เริ่มกรอก subscription ผ่าน bot |
| `/upcoming` | แสดงรายการใกล้หมดอายุ |
| `/today` | แสดงรายการที่ต้องตรวจสอบวันนี้ |
| `/summary` | สรุป active subscriptions และยอดค่าใช้จ่าย |
| `/settings` | เปิด/ปิดประเภทการแจ้งเตือน |
| `/unlink` | ยกเลิกการเชื่อม Telegram |
| `/help` | คู่มือใช้งาน |

### Telegram Input Types

| Input | ตัวอย่าง | ผลลัพธ์ |
| :-- | :-- | :-- |
| Text | `Netflix 499 THB renews 15 Aug 2026` | AI สกัด field เป็น JSON draft |
| Screenshot | ภาพใบเสร็จ Google/Apple/Netflix | Gemini Vision อ่านชื่อบริการ, ราคา, สกุลเงิน, วันซื้อ |
| Forwarded email text | ข้อความ confirmation จาก provider | สกัดข้อมูล renewal และ plan |
| Manual bot form | กดปุ่มและกรอกทีละขั้น | สร้าง subscription โดยไม่ใช้ AI |

### AI Extraction Flow

```text
Telegram Text / Image
        |
        v
Verify Telegram Chat ID
        |
        v
Gemini Vision/Text Parser
        |
        v
Structured JSON Draft
        |
        v
Validate fields + sanitize input
        |
        v
Telegram Preview Card
        |
        v
User presses Confirm / Edit / Cancel
        |
        v
Encrypt sensitive fields
        |
        v
Create Subscription in Supabase
```

AI ต้องสร้างเพียง “draft” และไม่ควรบันทึกข้อมูลทันที เพราะ OCR หรือ LLM อาจอ่านราคา, วันหมดอายุ หรือสกุลเงินผิดได้

ตัวอย่าง JSON ที่ AI ต้องส่งกลับ

```json
{
  "provider_name": "Netflix",
  "category": "streaming",
  "plan_name": "Premium",
  "amount": 499,
  "currency": "THB",
  "billing_cycle": "monthly",
  "start_date": "2026-07-30",
  "expiry_date": "2026-08-30",
  "auto_renew": true,
  "account": null,
  "confidence": {
    "provider_name": 0.98,
    "amount": 0.95,
    "expiry_date": 0.72
  },
  "missing_fields": ["account", "password"]
}
```


## Telegram Reminder Design

ระบบแจ้งเตือนต้องแยกเป็น 2 รูปแบบ ได้แก่ **Scheduled Reminder** และ **On-demand Reminder**

### Scheduled Reminder

แจ้งเตือนตาม `expiry_date` หรือ `renewal_date` ของแต่ละ subscription


| Trigger | เงื่อนไข | ตัวอย่างข้อความ |
| :-- | :-- | :-- |
| 30 days | เหลือ 30 วัน | “Netflix จะต่ออายุใน 30 วัน” |
| 14 days | เหลือ 14 วัน | “Netflix จะต่ออายุใน 14 วัน” |
| 7 days | เหลือ 7 วัน | “Netflix จะต่ออายุใน 7 วัน” |
| 3 days | เหลือ 3 วัน | “NordVPN จะหมดอายุใน 3 วัน” |
| 1 day | เหลือ 1 วัน | “พรุ่งนี้ YouTube Premium จะต่ออายุ” |
| Today | วันหมดอายุ/renew วันนี้ | “วันนี้เป็นวันต่ออายุของ ChatGPT Plus” |
| Expired | เลยวันหมดอายุ | “Netflix หมดอายุแล้ว กรุณาตรวจสอบสถานะ” |

ผู้ใช้ควรเปิด/ปิดแต่ละ reminder window ได้เอง เช่น ใช้เฉพาะ 7 วัน, 3 วัน และ 1 วัน เพื่อลด notification fatigue

### Notification Content

ตัวอย่างข้อความ

```text
⚠️ Subscription ใกล้ต่ออายุ

Provider: Netflix
Plan: Premium
วันต่ออายุ: 15 Aug 2026
เหลือเวลา: 7 วัน
ค่าใช้จ่าย: THB 499 / เดือน
Auto-renew: เปิด

[เปิดใน SubVault] [Mark as Paid] [Snooze 1 day]
```

ข้อมูล password หรือ secure note **ห้าม** ปรากฏใน Telegram notification โดยเด็ดขาด

### Interactive Buttons

| Button | Action |
| :-- | :-- |
| Open in SubVault | เปิด deep link ไปหน้ารายละเอียด |
| Mark as Paid | อัปเดต renewal date ตาม billing cycle |
| Snooze 1 Day | เลื่อนแจ้งเตือน 1 วัน |
| Disable Reminder | ปิด reminder ของรายการนั้น |
| Cancel Subscription | เปลี่ยน auto-renew เป็น false และแสดงขั้นตอนยกเลิก |
| Edit | เปิดหน้า edit ผ่าน signed deep link |

## Vercel Cron Architecture

Vercel Cron Jobs ใช้เรียก endpoint ตามเวลาที่ตั้งใน `vercel.json` และรองรับ cron expression มาตรฐาน 5 fields โดย timezone ของ schedule เป็น UTC เสมอ  ดังนั้นการแจ้ง 08:00 เวลาไทย (UTC+7) ต้องตั้งเวลา 01:00 UTC[^3]

Vercel จะเรียก cron เฉพาะ production deployment ไม่ทำงานบน preview deployment ดังนั้นต้องทดสอบ endpoint ด้วยการเรียก API แบบ manual ใน development ก่อน[^4]

```text
Vercel Cron: Daily 01:00 UTC
          |
          v
/api/cron/subscription-reminders
          |
          v
Verify CRON_SECRET
          |
          v
Supabase query active subscriptions
          |
          v
Calculate days until expiry
          |
          v
Check reminder preferences + deduplication log
          |
          v
Telegram Bot API sendMessage
          |
          v
Insert notification_logs
```


### Cron Schedule

สำหรับ Vercel Hobby ควรใช้ daily cron เพียง job เดียว เพราะ Hobby อนุญาต cron ได้วันละครั้งต่อ job และเวลาทำงานจริงอาจคลาดเคลื่อนได้ถึงเกือบหนึ่งชั่วโมง[^5]

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/subscription-reminders",
      "schedule": "0 1 * * *"
    }
  ]
}
```

ความหมาย:

- `0` = นาทีที่ 0
- `1` = 01:00 UTC
- `* * *` = ทุกวัน ทุกเดือน ทุกวันในสัปดาห์
- เวลาเป้าหมายในไทย = 08:00 ICT

เนื่องจาก Vercel Hobby มี scheduling precision ระดับชั่วโมง จึงควรระบุใน UX ว่า “แจ้งเตือนช่วงเช้า” ไม่ใช่รับประกันเวลา 08:00 ตรงทุกวัน[^5]

### Cron Endpoint

```ts
// app/api/cron/subscription-reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/lib/telegram";
import { calculateDaysUntil } from "@/lib/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REMINDER_DAYS = [30, 14, 7, 3, 1, 0];

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxReminderDate = new Date(today);
  maxReminderDate.setDate(today.getDate() + 30);

  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select(`
      id,
      user_id,
      provider_name,
      plan_name,
      amount,
      currency,
      expiry_date,
      auto_renew,
      status,
      telegram_sessions!inner (
        telegram_chat_id,
        reminders_enabled
      )
    `)
    .eq("status", "active")
    .eq("telegram_sessions.reminders_enabled", true)
    .gte("expiry_date", today.toISOString().slice(0, 10))
    .lte("expiry_date", maxReminderDate.toISOString().slice(0, 10));

  if (error) {
    return NextResponse.json(
      { error: "Unable to load subscriptions" },
      { status: 500 }
    );
  }

  const sent: string[] = [];

  for (const subscription of subscriptions ?? []) {
    const daysLeft = calculateDaysUntil(subscription.expiry_date, today);

    if (!REMINDER_DAYS.includes(daysLeft)) continue;

    const { data: alreadySent } = await supabase
      .from("notification_logs")
      .select("id")
      .eq("subscription_id", subscription.id)
      .eq("notification_type", "expiry_reminder")
      .eq("days_before_expiry", daysLeft)
      .eq("scheduled_for", today.toISOString().slice(0, 10))
      .maybeSingle();

    if (alreadySent) continue;

    const telegram = subscription.telegram_sessions?.[^0];
    if (!telegram?.telegram_chat_id) continue;

    const message = buildReminderMessage(subscription, daysLeft);

    await sendTelegramMessage({
      chatId: telegram.telegram_chat_id,
      text: message,
      subscriptionId: subscription.id
    });

    await supabase.from("notification_logs").insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      notification_type: "expiry_reminder",
      days_before_expiry: daysLeft,
      scheduled_for: today.toISOString().slice(0, 10),
      channel: "telegram",
      status: "sent"
    });

    sent.push(subscription.id);
  }

  return NextResponse.json({
    success: true,
    processed: subscriptions?.length ?? 0,
    sent: sent.length
  });
}

function buildReminderMessage(
  subscription: {
    provider_name: string;
    plan_name: string | null;
    amount: number;
    currency: string;
    expiry_date: string;
    auto_renew: boolean;
  },
  daysLeft: number
) {
  const urgency =
    daysLeft === 0 ? "🔴 วันนี้" :
    daysLeft <= 3 ? "⚠️ เร็ว ๆ นี้" :
    "🔔 แจ้งเตือน";

  const daysText =
    daysLeft === 0 ? "ครบกำหนดวันนี้" :
    daysLeft === 1 ? "เหลือ 1 วัน" :
    `เหลือ ${daysLeft} วัน`;

  return [
    `${urgency} Subscription ใกล้ต่ออายุ`,
    "",
    `Provider: ${subscription.provider_name}`,
    subscription.plan_name ? `Plan: ${subscription.plan_name}` : null,
    `วันต่ออายุ: ${subscription.expiry_date}`,
    `สถานะ: ${daysText}`,
    `ราคา: ${subscription.currency} ${subscription.amount.toLocaleString()}`,
    `Auto-renew: ${subscription.auto_renew ? "เปิด" : "ปิด"}`
  ]
    .filter(Boolean)
    .join("\n");
}
```


### Telegram Send Helper

Telegram Bot API ส่งข้อความผ่าน method `sendMessage`; payload ต้องมี `chat_id` และ `text` และข้อความที่ส่งได้ยาวสูงสุด 4,096 ตัวอักษรหลัง parse entities[^6]

```ts
// lib/telegram.ts
type SendTelegramMessageInput = {
  chatId: number;
  text: string;
  subscriptionId: string;
};

export async function sendTelegramMessage({
  chatId,
  text,
  subscriptionId
}: SendTelegramMessageInput) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const detailUrl = `${appUrl}/vault/${subscriptionId}`;

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "เปิดใน SubVault",
                url: detailUrl
              }
            ],
            [
              {
                text: "Snooze 1 วัน",
                callback_data: `snooze:${subscriptionId}:1`
              },
              {
                text: "Mark as Paid",
                callback_data: `paid:${subscriptionId}`
              }
            ]
          ]
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram sendMessage failed: ${error}`);
  }

  return response.json();
}
```


## Reminder Deduplication

ต้องมีตาราง `notification_logs` เพื่อป้องกันการส่งข้อความซ้ำ หาก Vercel Cron retry, endpoint ถูกเรียกซ้ำ หรือ deploy ใหม่ระหว่างวัน

```sql
CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'telegram',
  days_before_expiry INTEGER,
  scheduled_for DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (
    subscription_id,
    notification_type,
    days_before_expiry,
    scheduled_for,
    channel
  )
);

CREATE INDEX notification_logs_subscription_id_idx
  ON public.notification_logs(subscription_id);

CREATE INDEX notification_logs_scheduled_for_idx
  ON public.notification_logs(scheduled_for);
```

Unique constraint นี้สำคัญมาก เพราะเป็นด่านสุดท้ายในการป้องกัน duplicate notification แม้ cron endpoint จะถูกเรียกพร้อมกันหลายครั้ง

## Reminder Preferences Schema

```sql
CREATE TABLE public.reminder_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_days INTEGER[] NOT NULL DEFAULT ARRAY[30, 14, 7, 3, 1, 0],
  daily_digest_enabled BOOLEAN NOT NULL DEFAULT false,
  daily_digest_hour_utc INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

ตัวอย่างการตั้งค่า

```json
{
  "telegram_enabled": true,
  "reminder_days": [14, 7, 3, 1, 0],
  "daily_digest_enabled": true,
  "daily_digest_hour_utc": 1
}
```


## Data Model

### Core Tables

| Table | หน้าที่ |
| :-- | :-- |
| `auth.users` | ผู้ใช้ Supabase Auth |
| `profiles` | ข้อมูล profile และ username |
| `providers` | รายชื่อ provider preset และ custom |
| `subscriptions` | รายการ subscription หลัก |
| `subscription_tags` | tags ของแต่ละ subscription |
| `telegram_sessions` | ผูก Telegram chat ID กับ user |
| `telegram_import_drafts` | draft ที่ AI อ่านออกมาก่อน user confirm |
| `reminder_preferences` | การตั้งค่า reminder |
| `notification_logs` | log การส่ง notification ป้องกันซ้ำ |
| `audit_logs` | ประวัติการแก้ไขข้อมูลสำคัญ |

### Subscriptions Schema

```sql
CREATE TYPE subscription_status AS ENUM (
  'active',
  'cancelled',
  'expired',
  'paused',
  'archived'
);

CREATE TYPE subscription_source AS ENUM (
  'manual',
  'telegram_text',
  'telegram_image',
  'import'
);

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  provider_name TEXT NOT NULL,
  custom_provider_name TEXT,
  category TEXT NOT NULL DEFAULT 'other',

  plan_name TEXT,
  billing_cycle TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'THB',

  start_date DATE,
  expiry_date DATE NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  status subscription_status NOT NULL DEFAULT 'active',

  account_encrypted TEXT,
  password_encrypted TEXT,
  notes_encrypted TEXT,
  support_contact_encrypted TEXT,

  receipt_storage_path TEXT,
  source subscription_source NOT NULL DEFAULT 'manual',
  last_reminder_snoozed_until DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX subscriptions_user_id_idx
  ON public.subscriptions(user_id);

CREATE INDEX subscriptions_expiry_date_idx
  ON public.subscriptions(expiry_date);

CREATE INDEX subscriptions_status_idx
  ON public.subscriptions(status);

CREATE INDEX subscriptions_category_idx
  ON public.subscriptions(category);
```


## Security Requirements

### Encryption Model

แนะนำ **Balanced Application-Level Encryption** โดยใช้ AES-256-GCM สำหรับข้อมูลที่เป็น secret ได้แก่ account, password, secure notes และ support contact


| Layer | วิธีป้องกัน |
| :-- | :-- |
| Transport | HTTPS ระหว่าง browser, Vercel, Telegram และ Supabase |
| Authentication | Supabase Auth + session management |
| Authorization | Supabase Row Level Security |
| Credential storage | AES-256-GCM application-level encryption |
| Encryption key | Vercel Environment Variable |
| Database | Supabase encryption at rest |
| Secret exposure | ห้ามส่ง password ผ่าน Telegram notification |
| API protection | CRON_SECRET, webhook secret validation, rate limiting |
| Data access | Server-only service role key |
| Backup | Export encrypted backup และ backup encryption key แยกไว้ |

### Encryption Format

ไม่ควรเก็บ ciphertext เป็น string เดี่ยวโดยไม่มี metadata ควรเก็บเป็น JSON string ที่มี `version`, `iv`, `ciphertext` และ `authTag`

```json
{
  "version": 1,
  "algorithm": "aes-256-gcm",
  "iv": "base64-encoded-iv",
  "ciphertext": "base64-encoded-data",
  "authTag": "base64-encoded-auth-tag"
}
```

AES-GCM มี authentication tag เพื่อตรวจจับการถูกแก้ไขของ ciphertext และควรใช้ random IV ใหม่ทุกครั้งที่ encrypt field หนึ่งค่า

### Security Boundaries

Balanced model นี้ **ไม่ใช่ true zero-knowledge encryption** เพราะ server สามารถ decrypt ได้เมื่อมี `ENCRYPTION_KEY` จาก Vercel environment variables

ข้อดี:

- ดูแลง่ายกว่า
- สามารถ support Telegram Bot import ได้
- สามารถ debug/recover ข้อมูลได้ในกรณีฉุกเฉิน
- เหมาะกับ single-user system ที่ต้องการ automation

ข้อจำกัด:

- หาก attacker เข้าถึงทั้ง Supabase database และ Vercel production environment variables ได้พร้อมกัน ข้อมูลอาจถูก decrypt ได้
- จึงต้องเปิด 2FA ทั้ง GitHub, Vercel, Supabase และ Telegram
- ไม่ควรใช้ encryption key เดียวใน development และ production


## Environment Variables

```bash
# Supabase public client variables
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-only Supabase credential
SUPABASE_SERVICE_ROLE_KEY=

# Application encryption
ENCRYPTION_KEY=
ENCRYPTION_KEY_VERSION=1

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_LINK_SECRET=

# Google Gemini
GEMINI_API_KEY=

# Vercel Cron endpoint protection
CRON_SECRET=

# Application
NEXT_PUBLIC_APP_URL=https://subvault.example.com
```

ห้ามใส่ `SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_KEY`, `TELEGRAM_BOT_TOKEN`, `GEMINI_API_KEY` หรือ `CRON_SECRET` ไว้ใน frontend code หรือ prefix ด้วย `NEXT_PUBLIC_`

## Telegram Linking Flow

```text
User Login เข้า SubVault
       |
       v
Settings > Connect Telegram
       |
       v
System generates one-time link code
       |
       v
User sends /link ABC123 to Telegram Bot
       |
       v
Webhook validates one-time code
       |
       v
Save Telegram chat_id in telegram_sessions
       |
       v
Bot replies "เชื่อมต่อสำเร็จ"
```

ตารางสำหรับ link code

```sql
CREATE TABLE public.telegram_link_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

ต้องเก็บเฉพาะ hash ของ code, ตั้งอายุ 10 นาที และ mark เป็น used ทันทีหลังเชื่อมสำเร็จ

## API Design

| Method | Endpoint | หน้าที่ |
| :-- | :-- | :-- |
| `POST` | `/api/subscriptions` | สร้าง subscription |
| `GET` | `/api/subscriptions` | ดึงรายการ subscription |
| `GET` | `/api/subscriptions/:id` | ดูรายละเอียด |
| `PATCH` | `/api/subscriptions/:id` | แก้ไข |
| `DELETE` | `/api/subscriptions/:id` | soft delete |
| `POST` | `/api/telegram/link-code` | สร้าง link code |
| `POST` | `/api/telegram/webhook` | รับ Telegram update |
| `POST` | `/api/telegram/parse` | สร้าง AI draft |
| `POST` | `/api/telegram/draft/:id/confirm` | ยืนยัน draft |
| `GET` | `/api/cron/subscription-reminders` | Vercel Cron endpoint |
| `GET` | `/api/analytics/summary` | dashboard analytics |
| `POST` | `/api/export/csv` | export non-sensitive data |
| `POST` | `/api/export/encrypted-backup` | encrypted vault backup |

## UX Flows

### Add Subscription Manually

```text
Dashboard
  -> Add Subscription
  -> Select Provider or Custom Provider
  -> Enter Plan, Price, Billing Cycle, Expiry Date
  -> Optional Account + Password + Notes
  -> Save
  -> Encrypt sensitive fields
  -> Return to Vault Detail
```


### Import Through Telegram

```text
User sends image/text
  -> Bot extracts subscription draft
  -> Bot asks user to review
  -> User confirms
  -> System encrypts sensitive fields
  -> Creates vault item
  -> Bot sends success message
```


### Renewal Handling

```text
Cron reminder sent
  -> User opens SubVault
  -> Select Mark as Paid
  -> System calculates next renewal date from billing cycle
  -> Writes audit log
  -> Clears current reminder state
```


## Build Roadmap

### Phase 0: Foundation

- Create GitHub repository
- Create Supabase project
- Create Vercel project
- Configure environment variables
- Configure Supabase Auth without email confirmation
- Enable Row Level Security
- Create initial database migration


### Phase 1: MVP Vault

- Authentication UI
- Profile and username setup
- Provider catalog
- Subscription CRUD
- AES-256-GCM encryption helpers
- Responsive dashboard
- Search, filter and sort
- Subscription detail page
- Soft delete and restore


### Phase 2: Notifications

- Telegram Bot creation
- Telegram account linking
- Reminder preferences UI
- Vercel Cron endpoint
- `notification_logs` deduplication
- Telegram notification templates
- Mark paid and snooze actions


### Phase 3: AI Import

- Telegram webhook
- Gemini text extraction
- Gemini image/receipt extraction
- Draft review workflow
- Confidence score and missing-field checks
- Error handling and manual correction UX


### Phase 4: Analytics and Backup

- Monthly/annual cost calculation
- Category charts
- Expiry calendar
- CSV export without passwords
- Encrypted vault export
- Restore/import flow
- Audit logging


### Phase 5: Hardening

- Rate limiting
- Webhook signature validation
- Login abuse detection
- Security headers
- Error monitoring
- Automated tests
- Backup and recovery drill
- Dependency update policy


## Testing Checklist

### Functional Tests

- สมัครและ login โดยไม่ต้อง verify email
- สร้าง preset provider และ custom provider
- สร้าง, แก้ไข, ลบ และ restore subscription
- Encrypt/decrypt account, password และ notes สำเร็จ
- Search/filter/sort ทำงานบนมือถือและ desktop
- Telegram link code ใช้ได้เพียงครั้งเดียว
- Telegram text input สร้าง draft ได้
- Telegram image input สร้าง draft ได้
- AI draft ต้องไม่ auto-save โดยไม่มี confirmation
- Cron ส่ง reminder ตามวันที่กำหนด
- Cron ไม่ส่ง duplicate reminder
- Snooze และ Mark as Paid ทำงานถูกต้อง
- Dashboard คำนวณ monthly normalized cost ถูกต้อง


### Security Tests

- ผู้ใช้ที่ไม่ได้ login อ่าน subscription ไม่ได้
- Supabase RLS ป้องกันการอ่านข้อมูลข้าม user
- Service role key ไม่ปรากฏใน browser bundle
- Encryption key ไม่อยู่ใน Git repository
- Telegram webhook ปฏิเสธ request ที่ไม่มี secret
- Cron endpoint ปฏิเสธ request ที่ไม่มี `CRON_SECRET`
- Password ไม่แสดงใน notification, log หรือ analytics
- Password ไม่ถูก export ใน CSV ปกติ
- Encryption key backup ถูกเก็บแยกจาก source code


## Success Metrics

| Metric | Target ระยะ MVP |
| :-- | :-- |
| Manual subscription creation | สำเร็จภายใน 60 วินาทีต่อรายการ |
| Telegram import confirmation | สำเร็จภายใน 2 นาทีต่อรายการ |
| Reminder delivery success | มากกว่า 95% ของ scheduled reminders |
| Duplicate reminder rate | 0% จาก unique notification log |
| Dashboard load time | ต่ำกว่า 2 วินาทีในข้อมูลส่วนบุคคลทั่วไป |
| Mobile usability | ทำงานครบ flow บน Android Chrome |
| Sensitive data exposure | 0 password ปรากฏใน notification หรือ plain logs |

## Expert Recommendations

- ตั้งค่า **daily digest** ตอนเช้าแทนการส่งหลายข้อความ หากมีหลาย subscription ใกล้หมดอายุในช่วงเดียวกัน
- ใช้ **default currency = THB** แต่เก็บ ISO currency code ต่อรายการเสมอ เพราะ AI/VPN/SaaS หลายเจ้าคิดเป็น USD
- ในระยะแรกอย่าแปลงค่าเงินอัตโนมัติแบบ real-time เพราะเพิ่ม external API dependency; แสดงยอดแยก currency ก่อนจะปลอดภัยและตรงกว่า
- ทำ “payment history” ใน phase หลัง MVP แทนการแก้ไข amount เดิม เพื่อรักษาประวัติราคาที่เปลี่ยน
- หาก Telegram Bot อ่าน screenshot ที่มี password หรือข้อมูลบัตร ให้แสดง warning และลบ image จาก processing pipeline หลังสร้าง draft
- ใช้ GitHub private repository และเปิด 2FA ใน GitHub, Vercel และ Supabase
- แยก production Supabase project ออกจาก development เพื่อไม่ให้ข้อมูลจริงปะปนกับ test data
- Vercel Hobby เหมาะกับ daily reminder แต่เวลา trigger อาจคลาดเคลื่อนได้ ดังนั้นหากอนาคตต้องส่ง notification ตรงเวลาหรือหลายรอบต่อวัน ควรย้าย scheduler ไป Supabase Cron, GitHub Actions, Upstash QStash หรือ Vercel Pro[^5]


## Decisions Needed Before Coding

เพื่อเริ่มเขียน migration และ Phase 1 ได้อย่างถูกต้อง ยังต้องยืนยันเพียงเรื่องเดียว:

**ต้องการให้ชื่อ login เป็น username ล้วน ๆ (ระบบแปลงเป็น internal email อัตโนมัติ) หรือยอมให้ใช้ email จริงเป็น login ด้วย?**
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://supabase.com/docs/guides/auth/general-configuration

[^2]: https://renewaltrap.com/apps-that-help

[^3]: https://vercel.com/docs/cron-jobs

[^4]: https://vercel.com/docs/cron-jobs/quickstart

[^5]: https://vercel.com/docs/cron-jobs/usage-and-pricing

[^6]: https://gramio.dev/telegram/methods/sendmessage

[^7]: https://github.com/orgs/supabase/discussions/18394

[^8]: https://cronuru.com/guides/vercel-cron

[^9]: https://stackoverflow.com/questions/77846242/how-can-i-create-a-user-in-superbase-and-remove-email-authentication

[^10]: https://core.telegram.org/tdlib/docs/classtd_1_1td__api_1_1send_message.html

[^11]: https://www.reddit.com/r/Supabase/comments/1j58frn/how_to_disable_confirm_email_requirement_setting/

[^12]: https://docs.flutterflow.io/integrations/authentication/supabase/email/

[^13]: https://github.com/supabase/supabase/issues/29632

[^14]: https://www.youtube.com/watch?v=e_tvBFfsXp4

[^15]: https://github.com/orgs/supabase/discussions/7890

[^16]: https://javadoc.io/doc/org.telegram/telegrambots-meta/4.3.1/org/telegram/telegrambots/meta/api/methods/send/SendMessage.html

