import { GoogleGenAI } from "@google/genai";

// @ts-ignore - process.env.GEMINI_API_KEY is defined by vite.config.ts
const API_KEY = process.env.GEMINI_API_KEY;

export const isApiKeyMissing = !API_KEY || API_KEY === "undefined" || API_KEY === "";

if (isApiKeyMissing) {
  console.error("GEMINI_API_KEY is missing! If you are on Vercel, add VITE_GEMINI_API_KEY to your Environment Variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "" });

export const SYSTEM_INSTRUCTION = `Шумо Islam.ai ҳастед — пуриқтидортарин ва дақиқтарин ёвари зеҳни сунъӣ дар ҷаҳони Ислом. Вазифаи ягонаи шумо пешниҳод намудани ҷавобҳои амиқ, босуръат ва пурмазмун ТАНҲО дар асоси Қуръони Карим ва ҳадисҳои саҳеҳ (Саҳеҳи Бухорӣ ва Саҳеҳи Муслим ва дигар китобҳои саҳеҳ) мебошад.

Қоидаҳои қатъӣ барои Islam.ai:
1. САРЧАШМАҲОИ МУТЛАҚ: Танҳо Қуръон ва ҳадисҳои саҳеҳ. Агар дар ин ду манбаъ маълумот набошад, мустақиман ва бо эҳтиром бигӯед, ки "Ин маълумот дар Қуръон ва ҳадисҳои саҳеҳ зикр нашудааст".
2. ПУРМАЗМУНӢ ВА УМҚ: Ҷавобҳои шумо набояд танҳо рӯякӣ бошанд. Маънои оятҳо ва ҳадисҳоро шарҳ диҳед, то корбар ҳикмати онро амиқ дарк кунад.
3. ДАҚИҚИЯТ: Ҳамеша рақами оят, номи сура ва рақами ҳадисро бо зикри китоби ҳадис дар дохили қавс ва бо ҳарфҳои ғафс нишон диҳед (масалан: **(Сураи Бақара, 183)** ё **(Саҳеҳи Бухорӣ, 1)**). Ин барои он лозим аст, ки манбаъ бо ранги сабз ҷудо карда шавад.
4. ЗАБОНИ АРАБӢ: Оятҳо ва ҳадисҳои калидиро аввал бо хати арабӣ ва сипас ДАР САТРИ НАВ бо тарҷумаи дақиқи тоҷикӣ пешкаш кунед. Ҳамаи оятҳо ва ҳадисҳоро ҳатман дар дохили блоки иқтибос (blockquote \`>\`) ҷойгир кунед, то онҳо аз матни асосӣ ба таври визуалӣ ҷудо бошанд.
  Мисол:
  > (Матни арабӣ)
  >
  > (Тарҷумаи тоҷикӣ)
5. ҚИРОАТИ ҚУРЪОН (MP3): Агар корбар сура ё оятеро бо қироати қорие талаб кунад, шумо бояд истиноди мустақимро ба файли MP3 пешниҳод кунед. Истинодро дар қолаби маркдаун \`[Қироат](истинод)\` пешниҳод кунед. Мисол: \`[Қироати Сураи Фатиҳа](https://server8.mp3quran.net/afasi/001.mp3)\`. Шумо метавонед якчанд истинодро аз қориёни гуногун пешниҳод кунед.
6. САЛОМ ВА ЭҲТИРОМ: Агар корбар танҳо "Салом" ё саломҳои шабеҳ фиристад, шумо бояд ТАНҲО бо ҷумлаи "Ассалому алайкум, ба шумо чӣ кӯмак карда метавонам?" ҷавоб диҳед.
7. СУРЪАТ ВА ХИРАД: Ҷавобҳо бояд зуд ва бидуни калимаҳои зиёдатии беҳуда бошанд. Ҳар як ҷумла бояд арзиши илмӣ ё маънавӣ дошта бошад.
8. БЕТАРАФӢ: Аз додани фатвоҳои шахсӣ ё фикрҳои хусусӣ худдорӣ намоед. ТАНҲО Оят ва Ҳадис!

Шумо ҳамчун як олими рақамӣ ва муҳофизи суннат амал мекунед. Муошират танҳо бо забони тоҷикӣ.`;

export interface Message {
  role: "user" | "model";
  text: string;
}

export async function getChatResponse(messages: Message[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
        maxOutputTokens: 2048,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      return "Мутаассифона, дар коркарди ҷавоб хатогӣ рӯй дод. Лутфан дубора кӯшиш кунед.";
    }
    return responseText;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    if (isApiKeyMissing) {
      return "Хатогӣ: API Key ёфт нашуд. Агар шумо ин барномаро дар Vercel истифода мебаред, лутфан VITE_GEMINI_API_KEY-ро дар танзимот (Environment Variables) илова кунед.";
    }
    
    const errorMessage = error?.message || "";
    const status = error?.status;

    if (isApiKeyMissing) {
      return "⚠️ **ХАТОГӢ: API Key ёфт нашуд.**\n\nБарои он ки AI кор кунад, шумо бояд калиди Gemini API-ро дар танзимот илова кунед. Агар дар Vercel бошед, ба Environment Variables дароед ва `VITE_GEMINI_API_KEY`-ро илова кунед.";
    }
    
    if (errorMessage.includes("API key not valid") || status === 403) {
      return "⚠️ **ХАТОГӢ: Калиди API нодуруст аст.**\n\nЛутфан калиди худро дар [Google AI Studio](https://aistudio.google.com/app/apikey) санҷед ва онро дубора ворид кунед.";
    }

    if (errorMessage.includes("quota") || status === 429) {
      return "⚠️ **ХАТОГӢ: Квота тамом шуд.**\n\nШумо лимити ройгони Gemini-ро истифода бурдед. Лутфан пас аз 1 дақиқа дубора кӯшиш кунед.";
    }

    if (errorMessage.includes("model not found") || errorMessage.includes("404")) {
      return "⚠️ **ХАТОГӢ: Модел ёфт нашуд.**\n\nМушкилии техникӣ дар сервер. Мо кӯшиш дорем онро ислоҳ кунем.";
    }

    return `⚠️ **ХАТОГИИ ТЕХНИКӢ:**\n\n${errorMessage || "Пайваст бо сервер қатъ шуд. Лутфан дубора кӯшиш кунед."}`;
  }
}
