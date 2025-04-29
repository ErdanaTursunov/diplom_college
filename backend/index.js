require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./models");
const router = require("./routes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Настраиваем статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// API маршруты
app.use("/api", router);

const start = async () => { // обязательно async
  try {
    await db.sequelize.authenticate();
    console.log("Успешно соединен с базой данных");

    // Создаем директории для хранения файлов, если они не существуют
    const fs = require('fs');
    const newsImagesDir = path.join(__dirname, 'public', 'images', 'news');
    if (!fs.existsSync(newsImagesDir)) {
      fs.mkdirSync(newsImagesDir, { recursive: true });
    }

    // await db.sequelize.sync({ alter: true });
    // console.log("Успешно иницилизирован с базой данных");
    
    app.listen(PORT, () => {
      console.log(`Успешно запущен на порту ${PORT}`);
    });
  } catch (error) {
    console.error("Ошибка при старте сервера:", error);
  }
};

start();