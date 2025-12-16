require('dotenv').config();
const mineflayer = require('mineflayer');

const rand = (a, b) => Math.random() * (b - a) + a;
const chance = p => Math.random() < p;

function startBot() {
  const bot = mineflayer.createBot({
    host: process.env.MC_HOST,
    port: Number(process.env.MC_PORT),
    username: process.env.MC_USERNAME,
    version: false
  });

  let busy = false;
  let home = null;

  bot.on('spawn', () => {
    console.log('🟢 NPC دخل السيرفر');

    home = bot.entity.position.clone();

    // ===== السلوك الرئيسي =====
    setInterval(() => {
      if (!bot.entity || busy) return;

      // تعب / شرود
      if (chance(0.5)) return;

      // اختيار فعل
      const mode = Math.random();

      // ===== حركة =====
      if (mode < 0.5) {
        const actions = ['forward', 'left', 'right'];
        const a = actions[Math.floor(Math.random() * actions.length)];

        bot.setControlState(a, true);
        setTimeout(() => {
          bot.setControlState(a, false);
        }, rand(600, 2000));

        // تردد
        if (chance(0.3)) {
          setTimeout(() => {
            bot.setControlState(a, true);
            setTimeout(() => bot.setControlState(a, false), rand(300, 900));
          }, rand(300, 700));
        }
      }

      // ===== مراقبة =====
      if (mode >= 0.5) {
        bot.look(
          bot.entity.yaw + rand(-0.5, 0.5),
          Math.max(-0.6, Math.min(0.6, bot.entity.pitch + rand(-0.2, 0.2))),
          true
        );
      }

      // رجوع للمنطقة
      if (home && bot.entity.position.distanceTo(home) > 15) {
        bot.lookAt(home, true);
        bot.setControlState('forward', true);
        setTimeout(() => bot.setControlState('forward', false), 1500);
      }

    }, rand(20000, 45000));

    // ===== قفزة غلطة =====
    setInterval(() => {
      if (chance(0.05)) {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 300);
      }
    }, 90000);

    // ===== أكل متأخر =====
    setInterval(() => {
      if (!bot.food || bot.food > 11 || busy) return;

      const food = bot.inventory.items().find(i =>
        ['bread', 'apple', 'cooked_beef', 'cooked_porkchop'].includes(i.name)
      );

      if (food && chance(0.7)) {
        busy = true;
        bot.equip(food, 'hand', () => {
          setTimeout(() => {
            bot.consume(() => (busy = false));
          }, rand(1500, 4000));
        });
      }
    }, 20000);

    // ===== تفاعل نادر مع البيئة =====
    setInterval(() => {
      if (busy || chance(0.9)) return;

      const block = bot.findBlock({
        matching: b => b.name === 'dirt' || b.name === 'sand',
        maxDistance: 3
      });

      if (block && chance(0.2)) {
        busy = true;
        bot.dig(block, () => {
          setTimeout(() => (busy = false), rand(800, 1500));
        });
      }
    }, 120000);
  });

  // ===== إعادة اتصال آمنة فقط لو انقطع =====
  bot.on('end', () => {
    console.log('🔄 انقطع الاتصال، إعادة المحاولة...');
    setTimeout(startBot, rand(8000, 15000));
  });

  bot.on('error', () => {});
}

startBot();
