 // Функция для сохранения данных в localStorage
function saveToLocalStorage() {
  const editableElements = document.querySelectorAll('[contenteditable="true"]');
  const data = {};
  
  editableElements.forEach((element, index) => {
    data[`element_${index}`] = element.innerHTML;
  });
  
  localStorage.setItem('cvData', JSON.stringify(data));
}

// Функция для загрузки данных из localStorage
function loadFromLocalStorage() {
  const savedData = localStorage.getItem('cvData');
  if (savedData) {
    const data = JSON.parse(savedData);
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    
    editableElements.forEach((element, index) => {
      if (data[`element_${index}`]) {
        element.innerHTML = data[`element_${index}`];
      }
    });
  }
}

// Функция для создания редактируемых элементов
function makeElementsEditable() {
  // Селекторы для всех текстовых элементов
  const textSelectors = [
    '.greeting-title',
    '.greeting-subtitle',
    '.language-name',
    '.languages-title',
    '.languages-list li',
    '.job-dates',
    '.job-title',
    '.job-type',
    '.job-duties li',
    '.experience-title',
    '.tools-title',
    '.education-title',
    '.edu-dates',
    '.education-item h4',
    '.edu-hashtags',
    '.edu-institution',
    '.interests-title',
    '.interests-list li',
    '.contact-text',
    '.contact-email'
  ];

  textSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      element.setAttribute('contenteditable', 'true');
      // Стили для редактируемых элементов теперь управляются через editStyle.css
      
      element.addEventListener('blur', function() {
        saveToLocalStorage();
      });
      
      // Сохраняем при нажатии Enter
      element.addEventListener('keydown', function(e) {
        const maxLength = this.getAttribute('data-max-length');
        // Разрешаем служебные клавиши
        if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)) {
          return;
        }

        if (maxLength && this.innerText.length >= maxLength && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
        }

        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.blur();
        }
      });

      // Предотвращаем вставку HTML, разрешаем только текст
      element.addEventListener('paste', function(e) {
        e.preventDefault();
        let text = (e.originalEvent || e).clipboardData.getData('text/plain');
        const maxLength = this.getAttribute('data-max-length');

        if (maxLength) {
          const selection = window.getSelection();
          const selectedText = selection.toString();
          const currentLength = this.innerText.length - selectedText.length;
          const remainingLength = maxLength - currentLength;

          if (remainingLength > 0) {
            text = text.substring(0, remainingLength);
          } else {
            text = '';
          }
        }

        if (text) {
          document.execCommand('insertText', false, text);
        }
      });
      
      // Сохраняем при изменении содержимого
      element.addEventListener('input', function() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
          saveToLocalStorage();
        }, 1000); // Автосохранение через 1 секунду после прекращения ввода
      });
    });
  });
}

// Добавляем выдвижную панель управления
function addControlPanel() {
  // Создаем контейнер панели
  const controlPanel = document.createElement('div');
  controlPanel.id = 'control-panel';

  // Создаем кнопку-стрелку для открытия/закрытия
  const toggleButton = document.createElement('button');
  toggleButton.innerHTML = '▶';
  toggleButton.className = 'control-panel-toggle';

  // Создаем заголовок панели
  const panelHeader = document.createElement('div');
  panelHeader.innerHTML = '⚙️ Управление CV';
  panelHeader.className = 'panel-header';

  // Создаем контейнер для кнопок
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'buttons-container';

  // Кнопка сохранения
  const saveButton = document.createElement('button');
  saveButton.innerHTML = '💾 Сохранить';
  saveButton.className = 'panel-button save-button';

  // Кнопка сброса
  const resetButton = document.createElement('button');
  resetButton.innerHTML = '🔄 Сбросить изменения';
  resetButton.className = 'panel-button reset-button';

  // Кнопка PDF
  const pdfButton = document.createElement('button');
  pdfButton.innerHTML = '📄 Скачать PDF';
  pdfButton.className = 'panel-button pdf-button';

  // Эффекты наведения для кнопок теперь в CSS (:hover, :active)

  // Логика открытия/закрытия панели
  let isOpen = false;
  toggleButton.addEventListener('click', function() {
    isOpen = !isOpen;
    controlPanel.classList.toggle('open');
    toggleButton.classList.toggle('open');
    toggleButton.innerHTML = isOpen ? '◀' : '▶';
  });

  // Эффект для кнопки-стрелки теперь в CSS

  // Обработчики событий для кнопок
  saveButton.addEventListener('click', function() {
    saveToLocalStorage();
    showNotification('💾 Данные сохранены!', '#28a745');
  });

  resetButton.addEventListener('click', function() {
    if (confirm('Вы уверены, что хотите сбросить все изменения?')) {
      skipSaveOnUnload = true;
      localStorage.removeItem('cvData');
      showNotification('🔄 Изменения сброшены!', '#dc3545');
      setTimeout(() => location.reload(), 1000);
    }
  });

  // Обработчик для PDF кнопки (будет переопределен в pdf-integration.js)
  pdfButton.addEventListener('click', function() {
    // Этот обработчик будет заменен в pdf-integration.js
    // showNotification('📄 Функция PDF скоро будет доступна', '#6f42c1');
  });

  // Собираем панель
  buttonsContainer.appendChild(saveButton);
  buttonsContainer.appendChild(resetButton);
  buttonsContainer.appendChild(pdfButton);
  
  controlPanel.appendChild(toggleButton);
  controlPanel.appendChild(panelHeader);
  controlPanel.appendChild(buttonsContainer);
  
  document.body.appendChild(controlPanel);

  // Сохраняем ссылки для использования в других скриптах
  window.controlPanel = {
    panel: controlPanel,
    saveButton: saveButton,
    resetButton: resetButton,
    pdfButton: pdfButton,
    isOpen: () => isOpen,
    toggle: () => toggleButton.click()
  };
}

// Функция для показа уведомлений
function showNotification(message, color = '#28a745') {
  const notification = document.createElement('div');
  notification.innerHTML = message;
  notification.className = 'notification-popup';
  notification.style.backgroundColor = color;

  document.body.appendChild(notification);
  
  // Анимация появления
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  // Анимация исчезновения
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 400);
  }, 3000);
}

// Глобальный флаг, чтобы избежать повторного сохранения при перезагрузке после сброса
let skipSaveOnUnload = false;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  makeElementsEditable();
  loadFromLocalStorage();
  addControlPanel();
  
  console.log('CV Editor загружен! Кликните на любой текст для редактирования.');
  console.log('Панель управления доступна справа - кликните на стрелку для открытия.');
});

// Сохраняем данные перед закрытием страницы
window.addEventListener('beforeunload', function() {
  // Если был инициирован сброс – пропускаем сохранение
  if (!skipSaveOnUnload) {
    saveToLocalStorage();
  }
});