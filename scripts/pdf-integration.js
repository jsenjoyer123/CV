/**
 * МОДУЛЬ ИНТЕГРАЦИИ С PDF ГЕНЕРАТОРОМ
 * 
 * Этот скрипт реализует клиентскую генерацию PDF из HTML-содержимого CV.
 * Основные возможности:
 * - Клиентская генерация PDF с помощью html2canvas и jsPDF
 * - Интеграция с панелью управления из edit.js
 * - Исключение панели управления из генерируемого PDF
 * - Поддержка CORS для изображений
 * - Автоматическое разбиение на страницы
 * - Экспорт данных в JSON формате
 * - Модальное окно с инструкциями
 * 
 * Зависимости:
 * - html2canvas: для преобразования HTML в canvas
 * - jsPDF: для создания PDF файлов
 * - edit.js: для доступа к панели управления и функциям сохранения
 */

// Используем IIFE (Immediately Invoked Function Expression) для инкапсуляции кода
// Это предотвращает загрязнение глобального пространства имен
(function() {
  'use strict'; // Включаем строгий режим для лучшей обработки ошибок

  // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

  /**
   * Асинхронно ожидает загрузки панели управления
   * Необходимо потому, что edit.js может загрузиться позже чем pdf-integration.js
   * @returns {Promise} Promise, который разрешается когда панель управления становится доступной
   */
  function waitForControlPanel() {
    return new Promise((resolve) => {
      // Рекурсивная функция проверки доступности панели
      const checkPanel = () => {
        // Проверяем существование глобального объекта controlPanel и кнопки PDF
        if (window.controlPanel && window.controlPanel.pdfButton) {
          resolve(); // Панель готова, разрешаем Promise
        } else {
          // Панель еще не готова, повторяем проверку через 100мс
          setTimeout(checkPanel, 100);
        }
      };
      checkPanel(); // Запускаем первую проверку
    });
  }

  /**
   * Основная функция генерации PDF из HTML содержимого страницы
   * Использует html2canvas для создания изображения страницы и jsPDF для создания PDF файла
   * Автоматически исключает панель управления из генерируемого PDF
   * Поддерживает автоматическое разбиение на страницы для длинного контента
   */
  async function generatePDF() {
    try {
      // Получаем объект jsPDF из глобального пространства имен
      const { jsPDF } = window.jspdf;
      
      // === ПОДГОТОВКА ИЗОБРАЖЕНИЙ ДЛЯ CORS ===
      // Устанавливаем атрибут crossOrigin для всех изображений на странице
      // Это необходимо для корректной работы html2canvas с изображениями из других доменов
      document.querySelectorAll('img').forEach(img => {
        img.setAttribute('crossOrigin', 'anonymous');
      });

      // === СОЗДАНИЕ CANVAS ИЗ HTML СОДЕРЖИМОГО ===
      // Используем html2canvas для преобразования всего body в canvas
      const canvas = await html2canvas(document.body, {
        useCORS: true, // Включаем поддержку CORS для изображений
        // Исключаем панель управления из захвата - она не должна попадать в PDF
        // Это ключевая особенность: панель остается видимой в интерфейсе, но не попадает в PDF
        ignoreElements: (element) => element.id === 'control-panel'
      });

      // === ПОДГОТОВКА ДАННЫХ ДЛЯ PDF ===
      // Преобразуем canvas в base64 изображение PNG
      const imgData = canvas.toDataURL('image/png');
      
      // Создаем новый PDF документ в портретной ориентации, размер A4, единицы измерения - миллиметры
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Получаем размеры страницы PDF
      const pdfWidth = pdf.internal.pageSize.getWidth();   // Ширина страницы A4 в мм
      const pageHeight = pdf.internal.pageSize.getHeight(); // Высота страницы A4 в мм
      
      // Вычисляем размеры изображения для размещения на PDF странице
      const imgWidth = pdfWidth; // Изображение занимает всю ширину страницы
      const imgHeight = (canvas.height * imgWidth) / canvas.width; // Пропорциональная высота

      // === ДОБАВЛЕНИЕ ПЕРВОЙ СТРАНИЦЫ ===
      let position = 0; // Начальная позиция изображения
      // Добавляем изображение на первую страницу PDF
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);

      // === АВТОМАТИЧЕСКОЕ РАЗБИЕНИЕ НА СТРАНИЦЫ ===
      // Вычисляем оставшуюся высоту контента, которая не поместилась на первой странице
      let heightLeft = imgHeight - pageHeight;
      
      // Если контент не помещается на одной странице, создаем дополнительные страницы
      while (heightLeft > 0) {
        // Смещаем позицию изображения вверх на высоту одной страницы
        position -= pageHeight;
        
        // Добавляем новую страницу в PDF
        pdf.addPage();
        
        // Добавляем то же изображение, но со смещением, чтобы показать следующую часть
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        
        // Уменьшаем оставшуюся высоту
        heightLeft -= pageHeight;
      }

      // === СОХРАНЕНИЕ PDF ФАЙЛА ===
      // Инициируем скачивание PDF файла с именем 'page.pdf'
      pdf.save('page.pdf');
      
    } catch (error) {
      // === ОБРАБОТКА ОШИБОК ===
      // Логируем подробную информацию об ошибке в консоль для отладки
      console.error('Ошибка при генерации PDF:', error);
      
      // Показываем пользователю уведомление об ошибке, если функция доступна
      if (typeof showNotification === 'function') {
        showNotification('❌ Ошибка при генерации PDF', '#dc3545'); // Красный цвет для ошибки
      }
    }
  }

  // Функция для интеграции с PDF
  async function integratePDFFunction() {
    await waitForControlPanel();
    
    const pdfButton = window.controlPanel.pdfButton;
    
    // Заменяем обработчик клика на PDF кнопке
    pdfButton.onclick = null; // Удаляем старый обработчик
    pdfButton.addEventListener('click', async function() {
      try {
        // Сохраняем данные перед генерацией PDF
        if (typeof saveToLocalStorage === 'function') {
          saveToLocalStorage();
        }

        // Создаем модальное окно с инструкциями
        generatePDF();
        
      } catch (error) {
        console.error('Ошибка при подготовке PDF:', error);
        if (typeof showNotification === 'function') {
          showNotification('❌ Ошибка при подготовке PDF', '#dc3545');
        }
      }
    });

    console.log('PDF интеграция загружена и подключена к панели управления');
  }

  // Функция показа модального окна с инструкциями
  function showPDFModal() {
    // Создаем оверлей
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(5px);
    `;

    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 15px;
      padding: 30px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
      position: relative;
    `;

    modal.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">📄</div>
      <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">Генерация PDF</h2>
      <div style="color: #666; line-height: 1.6; margin-bottom: 25px; text-align: left;">
        <p><strong>Для создания PDF файла:</strong></p>
        <ol style="padding-left: 20px;">
          <li>Откройте терминал в папке проекта</li>
          <li>Выполните команду: <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px;">npm install</code></li>
          <li>Запустите генератор: <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px;">npm start</code></li>
          <li>PDF файл будет сохранен в папку проекта</li>
        </ol>
        <p style="margin-top: 15px;"><strong>💡 Совет:</strong> Все ваши изменения уже сохранены и будут включены в PDF!</p>
      </div>
      <div style="display: flex; gap: 15px; justify-content: center;">
        <button id="export-data-btn" style="
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
        ">💾 Экспорт данных</button>
        <button id="close-modal-btn" style="
          background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
        ">Закрыть</button>
      </div>
    `;

    // Добавляем эффекты для кнопок
    const buttons = modal.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.filter = 'brightness(1.1)';
      });

      button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.filter = 'brightness(1)';
      });
    });

    // Обработчик экспорта данных
    modal.querySelector('#export-data-btn').addEventListener('click', function() {
      exportCVData();
      if (typeof showNotification === 'function') {
        showNotification('💾 Данные экспортированы в файл cv-data.json', '#28a745');
      }
    });

    // Обработчик закрытия
    modal.querySelector('#close-modal-btn').addEventListener('click', function() {
      document.body.removeChild(overlay);
    });

    // Закрытие по клику на оверлей
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Анимация появления
    overlay.style.opacity = '0';
    modal.style.transform = 'scale(0.8)';
    setTimeout(() => {
      overlay.style.transition = 'opacity 0.3s ease';
      modal.style.transition = 'transform 0.3s ease';
      overlay.style.opacity = '1';
      modal.style.transform = 'scale(1)';
    }, 10);
  }

  // Функция экспорта данных CV
  function exportCVData() {
    try {
      // Получаем данные из localStorage
      const cvData = localStorage.getItem('cvData');
      const dataToExport = {
        timestamp: new Date().toISOString(),
        data: cvData ? JSON.parse(cvData) : {},
        version: '1.0'
      };

      // Создаем и скачиваем файл
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cv-data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('CV данные экспортированы:', dataToExport);
    } catch (error) {
      console.error('Ошибка при экспорте данных:', error);
      if (typeof showNotification === 'function') {
        showNotification('❌ Ошибка при экспорте данных', '#dc3545');
      }
    }
  }

  // Инициализация при загрузке DOM
  document.addEventListener('DOMContentLoaded', function() {
    integratePDFFunction();
  });

})();
