import {Markup, Telegraf} from "telegraf";
import {message} from "telegraf/filters"
import {LabeledPrice} from "@telegraf/types";
import woo from "@/lib/woo";

export const SECRET_HASH = process.env.TELEGRAM_BOT_SECRET!!
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || `https://${process.env.NEXT_PUBLIC_VERCEL_URL!!}`
const WEBHOOK_URL = `${BASE_PATH}/api/telegram-hook?secret_hash=${SECRET_HASH}`
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!!
const bot = new Telegraf(BOT_TOKEN)

bot.start((ctx) => {
    ctx.reply(
        "Скорее к покупкам! 👇 ",
        Markup.inlineKeyboard([Markup.button.webApp("🛍 Перейти в магазин", BASE_PATH)]),
    )
});
bot.help((ctx) => ctx.reply("Напишите команды /start или /menu!"))
bot.command('menu', (ctx) =>
    ctx.setChatMenuButton({
        text: "Магазин",
        type: "web_app",
        web_app: {url: BASE_PATH},
    }))
bot.on(message("text"), (ctx) => ctx.reply(`Привет, я @${ctx.botInfo.first_name}.\n Приятно познакомиться! 👋 /help`));

bot.on("shipping_query", async (ctx) => {
    const payload = JSON.parse(ctx.update.shipping_query.invoice_payload)
    const shippingOptions = await woo.getShippingOptions(payload.shippingZone)
    if (shippingOptions.length)
        ctx.answerShippingQuery(true, shippingOptions, undefined)
    else
        ctx.answerShippingQuery(false, undefined, "Нет доступных вариантов доставки в вашей зоне!")
});

bot.on("pre_checkout_query", async (ctx) => {
    const payload = JSON.parse(ctx.update.pre_checkout_query.invoice_payload)
    const orderInfo = ctx.update.pre_checkout_query.order_info!!
    const res = await woo.updateOrderInfo(payload.orderId, orderInfo)
    if (res.status === 200)
        await ctx.answerPreCheckoutQuery(true);
    else
        await ctx.answerPreCheckoutQuery(false, "Произошла ошибка при обновлении заказа, свяжитесь с поддержкой!");
});

bot.on(message("successful_payment"), async (ctx) => {
    const payload = JSON.parse(ctx.update.message.successful_payment.invoice_payload)
    const res = await woo.setOrderPaid(payload.orderId)
    if (res.status === 200) {
        ctx.reply("Заказ успешно зарегистрирован!")
    } else
        ctx.reply(`Ошибка регистрации платежа, свяжитесь с поддержкой!\n
        orderId:${payload.orderId}\n
        ${ctx.update.message.successful_payment.telegram_payment_charge_id}\n
        ${ctx.update.message.successful_payment.provider_payment_charge_id}
        `)
});

export function initWebhook() {
    return bot.telegram.setWebhook(WEBHOOK_URL)
}

export async function createInvoiceLink(
    orderId: number,
    orderKey: string,
    currency: string,
    prices: LabeledPrice[],
    shippingZone: number
) {
    const telegramInvoice = {
        provider_token: process.env.TELEGRAM_PAYMENT_PROVIDER_TOKEN!!,
        title: `Order Invoice ${orderId}`,
        description: `Payment invoice for ${orderKey}`,
        currency,
        photo_url: undefined, //TODO: env
        is_flexible: false, //TODO: env
        prices,
        payload: JSON.stringify({orderId, shippingZone}),
        need_name: true,
        need_email: true,
        need_phone_number: true,
        need_shipping_address: true
    };

    //https://core.telegram.org/bots/api#createinvoicelink
    return await bot.telegram.createInvoiceLink(telegramInvoice);
}

export default bot
