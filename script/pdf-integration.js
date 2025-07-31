// Интеграция с PDF генератором
// Этот скрипт добавляет кнопку "Скачать PDF" к существующему функционалу

(function() {
  'use strict';

  // Функция для создания кнопки PDF
  function addPDFButton() {
    // Проверяем, есть ли уже кнопка
    if (document.querySelector('.pdf-button')) {
      return;
    }

    const pdfButton = document.createElement('button');
    pdfButton.className = 'pdf-button control-button';
    pdfButton.innerHTML = '📄 Скачать PDF';
    pdfButton.title = 'Сохранить CV как PDF файл';

    // Стили для кнопки
    pdfButton.style.cssText = `
      position: fixed;
      top: 120px;
      right: 20px;
      z-index: 1000;
      padding: 12px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Эффекты при наведении
    pdfButton.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
    });

    pdfButton.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
    });

    // Обработчик клика
    pdfButton.addEventListener('click', async function() {
      await generatePDF();
    });

    document.body.appendChild(pdfButton);
  }

  // Функция генерации PDF
  async function generatePDF() {
    const button = document.querySelector('.pdf-button');
    const originalText = button.innerHTML;
    
    try {
      // Показываем индикатор загрузки
      button.innerHTML = '⏳ Генерация PDF...';
      button.disabled = true;
      button.style.opacity = '0.7';

      // Сохраняем текущие данные перед генерацией PDF
      if (typeof saveToLocalStorage === 'function') {
        saveToLocalStorage();
        showNotification('Данные сохранены перед генерацией PDF', 'success');
      }

      // Экспортируем данные в JSON файл для Node.js скрипта
      await exportDataForPDF();

      // Показываем уведомление о том, что нужно запустить Node.js скрипт
      showPDFInstructions();

    } catch (error) {
      console.error('Ошибка при подготовке к генерации PDF:', error);
      showNotification('Ошибка при подготовке PDF', 'error');
    } finally {
      // Восстанавливаем кнопку
      button.innerHTML = originalText;
      button.disabled = false;
      button.style.opacity = '1';
    }
  }

  // Экспорт данных для PDF генератора
  async function exportDataForPDF() {
    const cvData = localStorage.getItem('cvData');
    
    if (cvData) {
      // Создаём blob с данными
      const dataBlob = new Blob([cvData], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      // Создаём ссылку для скачивания
      const link = document.createElement('a');
      link.href = url;
      link.download = 'saved-cv-data.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('📤 Данные экспортированы в saved-cv-data.json');
    }
  }

  // Показ инструкций для генерации PDF
  function showPDFInstructions() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      max-width: 500px;
      margin: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

    content.innerHTML = `
      <h3 style="margin-top: 0; color: #333;">📄 Генерация PDF</h3>
      <p style="color: #666; line-height: 1.6;">
        Данные сохранены! Теперь выполните следующие шаги для генерации PDF:
      </p>
      <ol style="color: #555; line-height: 1.8; padding-left: 20px;">
        <li>Откройте терминал в папке проекта</li>
        <li>Установите зависимости: <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px;">npm install</code></li>
        <li>Запустите генератор: <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px;">npm start</code></li>
      </ol>
      <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
        PDF файл будет сохранён в папке проекта с именем <strong>cv-YYYY-MM-DD.pdf</strong>
      </p>
      <button id="closeModal" style="
        background: #667eea;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      ">Понятно</button>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Закрытие модального окна
    const closeBtn = content.querySelector('#closeModal');
    const closeModal = () => {
      document.body.removeChild(modal);
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Закрытие по Escape
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  // Функция для показа уведомлений (если не существует)
  function showNotification(message, type = 'info') {
    // Проверяем, есть ли уже функция showNotification
    if (window.showNotification && typeof window.showNotification === 'function') {
      window.showNotification(message, type);
      return;
    }

    // Создаём простое уведомление
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;

    // Цвета в зависимости от типа
    const colors = {
      success: '#4CAF50',
      error: '#f44336',
      info: '#2196F3'
    };

    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Анимация появления
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Автоматическое скрытие
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Инициализация при загрузке страницы
  document.addEventListener('DOMContentLoaded', function() {
    // Добавляем кнопку PDF после небольшой задержки
    setTimeout(addPDFButton, 500);
  });

  // Экспорт функций для глобального использования
  window.generatePDF = generatePDF;
  window.exportDataForPDF = exportDataForPDF;

})();
