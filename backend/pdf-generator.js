const puppeteer = require('puppeteer');
const express = require('express');
const path = require('path');
const fs = require('fs');

class CVPDFGenerator {
  constructor() {
    this.app = express();
    this.port = 3000;
    this.browser = null;
    this.page = null;
    // Путь к установленному Chrome
    this.chromePath = '/home/user/.cache/puppeteer/chrome/linux-121.0.6167.85/chrome-linux64/chrome';
  }

  // Настройка Express сервера для статических файлов
  setupServer() {
    // Обслуживаем статические файлы из текущей директории
    this.app.use(express.static(__dirname));
    
    // Основной маршрут для CV
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'index.html'));
    });

    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 Сервер запущен на http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  // Инициализация Puppeteer
  async initPuppeteer() {
    console.log('📖 Запуск Puppeteer...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      executablePath: this.chromePath, // Используем установленный Chrome
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Устанавливаем размер страницы A4
    await this.page.setViewport({
      width: 595,  // Ширина 595 пикселей
      height: 842, // Высота соответствует формату A4 (842 пикселя)
      deviceScaleFactor: 2 // Высокое разрешение
    });
  }

  // Загрузка сохранённых данных из localStorage (если есть)
  async loadSavedData() {
    console.log('💾 Загрузка сохранённых данных...');
    
    // Проверяем, есть ли сохранённые данные в браузере пользователя
    // Для этого можем прочитать данные из файла или передать их как параметр
    const savedDataPath = path.join(__dirname, 'saved-cv-data.json');
    
    if (fs.existsSync(savedDataPath)) {
      const savedData = JSON.parse(fs.readFileSync(savedDataPath, 'utf8'));
      
      // Устанавливаем данные в localStorage страницы
      await this.page.evaluateOnNewDocument((data) => {
        localStorage.setItem('cvData', JSON.stringify(data));
      }, savedData);
      
      console.log('✅ Сохранённые данные загружены');
    } else {
      console.log('ℹ️ Сохранённые данные не найдены, используем данные по умолчанию');
    }
  }

  // Экспорт текущих данных из localStorage браузера
  async exportCurrentData() {
    console.log('📤 Экспорт текущих данных...');
    
    await this.page.goto(`http://localhost:${this.port}`, {
      waitUntil: 'networkidle2'
    });

    // Ждём загрузки скриптов
    await this.page.waitForTimeout(2000);

    // Получаем данные из localStorage
    const currentData = await this.page.evaluate(() => {
      const savedData = localStorage.getItem('cvData');
      return savedData ? JSON.parse(savedData) : null;
    });

    if (currentData) {
      const savedDataPath = path.join(__dirname, 'saved-cv-data.json');
      fs.writeFileSync(savedDataPath, JSON.stringify(currentData, null, 2));
      console.log('✅ Данные экспортированы в saved-cv-data.json');
    }

    return currentData;
  }

  // Генерация PDF
  async generatePDF(outputPath = 'cv-output.pdf') {
    console.log('🔄 Генерация PDF...');
    
    // Загружаем страницу
    await this.page.goto(`http://localhost:${this.port}`, {
      waitUntil: 'networkidle2'
    });

    // Ждём полной загрузки и инициализации скриптов
    await this.page.waitForTimeout(3000);

    // Добавляем CSS для скрытия кнопок управления
    await this.page.addStyleTag({
      content: `
        .controls, #pdfButton { 
          display: none !important; 
        }
      `
    });

    // Генерируем PDF
    const pdf = await this.page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      preferCSSPageSize: true
    });

    console.log(`✅ PDF сохранён как: ${outputPath}`);
    return pdf;
  }

  // Закрытие браузера и сервера
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    if (this.server) {
      this.server.close();
    }
    console.log('🧹 Очистка завершена');
  }

  // Основной метод для генерации PDF
  async generate(options = {}) {
    const {
      outputPath = `cv-${new Date().toISOString().split('T')[0]}.pdf`,
      exportData = true,
      loadData = true
    } = options;

    try {
      // 1. Запускаем сервер
      await this.setupServer();

      // 2. Инициализируем Puppeteer
      await this.initPuppeteer();

      // 3. Загружаем сохранённые данные (если нужно)
      if (loadData) {
        await this.loadSavedData();
      }

      // 4. Экспортируем текущие данные (если нужно)
      if (exportData) {
        await this.exportCurrentData();
      }

      // 5. Генерируем PDF
      await this.generatePDF(outputPath);

      console.log('🎉 Генерация PDF завершена успешно!');
      
    } catch (error) {
      console.error('❌ Ошибка при генерации PDF:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Утилита для сохранения данных из браузера
async function saveDataFromBrowser() {
  console.log('🔄 Сохранение данных из браузера...');
  
  const generator = new CVPDFGenerator();
  
  try {
    await generator.setupServer();
    await generator.initPuppeteer();
    await generator.exportCurrentData();
    console.log('✅ Данные сохранены!');
  } catch (error) {
    console.error('❌ Ошибка при сохранении данных:', error);
  } finally {
    await generator.cleanup();
  }
}

// Основная функция
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--save-data')) {
    // Только сохранение данных
    await saveDataFromBrowser();
  } else if (args.includes('--pdf-only')) {
    // Только генерация PDF без экспорта данных
    const generator = new CVPDFGenerator();
    await generator.generate({ exportData: false });
  } else {
    // Полный цикл: сохранение данных + генерация PDF
    const generator = new CVPDFGenerator();
    await generator.generate();
  }
}

// Экспорт для использования как модуль
module.exports = { CVPDFGenerator, saveDataFromBrowser };

// Запуск если файл вызван напрямую
if (require.main === module) {
  main().catch(console.error);
}
