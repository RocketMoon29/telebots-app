import {NextRequest, NextResponse} from "next/server";
import woo from "@/lib/woo";
import bot from "@/lib/bot";

export async function POST(request: NextRequest) {

    const body = await request.json();

    //request.body telegram_chat_id (or user_id)

    //TODO: register order
    const wooOrderId = "123456789";
    //TODO: create lib/invoice 
    //https://core.telegram.org/bots/api#createinvoicelink
    const invoice = {
        provider_token: '1877036958:TEST:a06a637816e2c91246ad38b1eac33815ebd1c408',//process.env.TELEGRAM_PAYMENT_PROVIDER_TOKEN,
        title: "Working Time Machine",
        description:
            "Want to visit your great-great-great-grandparents? Make a fortune at the races? Shake hands with Hammurabi and take a stroll in the Hanging Gardens? Order our Working Time Machine today!",
        currency: "usd", //process.env.TELEGRAM_PAYMENT_CURRENCY, //https://core.telegram.org/bots/payments#supported-currencies
        photo_url:
            "https://img.clipartfest.com/5a7f4b14461d1ab2caaa656bcee42aeb_future-me-fredo-and-pidjin-the-webcomic-time-travel-cartoon_390-240.png",
        is_flexible: true,
        prices: [
            { label: "Working Time Machine", amount: 4200 },
            { label: "Gift wrapping", amount: 1000 },
        ], //TODO: retrieve prices from woocommerce by ids
        payload: JSON.stringify(body),
        need_name: true,
        need_phone_number: true,
        need_shipping_address: true
    };

    const invoiceLink = await bot.telegram.createInvoiceLink(invoice);

    return NextResponse.json({"invoice_link": invoiceLink, "order_id": wooOrderId});
}