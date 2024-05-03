const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const app = express();
const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

const token = '5890804914:AAHCCe9qgmsRw7gaaC47GoTygLZODWLPk3E';
const bot = new TelegramBot(token, { polling: true });

let previousResult = null;
let previousExpression = null;

// Function to convert Indian numerals to Arabic numerals
function convertIndianNumeralsToArabic(number) {
  const arabicNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const indianNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  let convertedNumber = '';
  for (let i = 0; i < number.length; i++) {
    const index = indianNumerals.indexOf(number[i]);
    if (index !== -1) {
      convertedNumber += arabicNumerals[index];
    } else {
      convertedNumber += number[i];
    }
  }

  return convertedNumber;
}

app.get('/', (req, res) => {
  res.send('Hello World!');
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'مرحبًا بك أرسل لي عبارة رياضية لحسابها وحفظها.');
});

bot.onText(/^(?=.*[\d٠١٢٣٤٥٦٧٨٩])([\d+.*\-\/%×٠-٩ ]+)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  let expression = match[1];

  // Convert Indian numerals to Arabic numerals
  expression = convertIndianNumeralsToArabic(expression);

  // Replace "×" with "*" for the external service
  expression = expression.replace(/×/g, '*');

  try {
    const response = await axios.get(`http://api.mathjs.org/v4/?expr=${encodeURIComponent(expression)}`);
    const result = response.data;
    bot.sendMessage(chatId, `النتيجة: ${result}`);
    previousResult = parseFloat(result); // convert result to number
    previousExpression = expression; // store the original expression
  } catch (error) {
    bot.sendMessage(chatId, 'حدث خطأ في عملية الحساب. يرجى المحاولة مرة أخرى.');
  }
});

bot.onText(/^([+*/-])(\d+)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const operator = match[1];
  const operand = parseFloat(match[2]);

  if (previousResult === null || previousExpression === null) {
    bot.sendMessage(chatId, 'لا يوجد نتيجة سابقة للاستمرار.');
    return;
  }

  let newExpression = `${previousResult} ${operator} ${operand}`;
  try {
    const response = await axios.get(`http://api.mathjs.org/v4/?expr=${encodeURIComponent(newExpression)}`);
    const result = response.data;
    bot.sendMessage(chatId, `النتيجة: ${result}`);
    previousResult = parseFloat(result); // convert result to number
    previousExpression = newExpression; // update the original expression
  } catch (error) {
    bot.sendMessage(chatId, 'حدث خطأ في عملية الحساب. يرجى المحاولة مرة أخرى.');
  }
});

bot.onText(/^دولار (\d+)$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const amount = parseFloat(match[1]);

  try {
    const response = await axios.get('https://v6.exchangerate-api.com/v6/f7193dd50f5d7e0a975fd91a/latest/USD');
    const data = response.data;
    if (data.result === 'success') {
      const rate = data.conversion_rates['TRY'];
      const convertedAmount = amount * rate;
      bot.sendMessage(chatId, `المبلغ المحول: ${convertedAmount} ليرة تركية`);
    } else {
      bot.sendMessage(chatId, 'حدث خطأ في عملية التحويل. يرجى المحاولة مرة أخرى.');
    }
  } catch (error) {
    bot.sendMessage(chatId, 'حدث خطأ في عملية التحويل. يرجى المحاولة مرة أخرى.');
  }
});

bot.onText(/^ليرة (\d+)$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const amount = parseFloat(match[1]);

  try {
    const response = await axios.get('https://v6.exchangerate-api.com/v6/f7193dd50f5d7e0a975fd91a/latest/TRY');
    const data = response.data;
    if (data.result === 'success') {
      const rate = data.conversion_rates['USD'];
      const convertedAmount = amount * rate;
      bot.sendMessage(chatId, `المبلغ المحول: ${convertedAmount} دولار`);
    } else {
      bot.sendMessage(chatId, 'حدث خطأ في عملية التحويل. يرجى المحاولة مرة أخرى.');
    }
  } catch (error) {
    bot.sendMessage(chatId, 'حدث خطأ في عملية التحويل. يرجى المحاولة مرة أخرى.');
  }
});
