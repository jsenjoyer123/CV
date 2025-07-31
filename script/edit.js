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
      element.style.outline = 'none';
      element.style.cursor = 'text';
      
      // Добавляем визуальную подсказку при наведении
      element.addEventListener('mouseenter', function() {
        this.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
        this.style.borderRadius = '3px';
      });
      
      element.addEventListener('mouseleave', function() {
        if (document.activeElement !== this) {
          this.style.backgroundColor = '';
        }
      });
      
      // Добавляем стили при фокусе
      element.addEventListener('focus', function() {
        this.style.backgroundColor = 'rgba(0, 123, 255, 0.15)';
        this.style.borderRadius = '3px';
        this.style.border = '1px solid rgba(0, 123, 255, 0.3)';
      });
      
      element.addEventListener('blur', function() {
        this.style.backgroundColor = '';
        this.style.border = '';
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
  controlPanel.style.cssText = `
    position: fixed;
    top: 20px;
    right: -280px;
    width: 300px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 15px 0 0 15px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    transition: right 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  `;

  // Создаем кнопку-стрелку для открытия/закрытия
  const toggleButton = document.createElement('button');
  toggleButton.innerHTML = '◀';
  toggleButton.style.cssText = `
    position: absolute;
    left: -40px;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 15px 0 0 15px;
    cursor: pointer;
    font-size: 18px;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
  `;

  // Создаем заголовок панели
  const panelHeader = document.createElement('div');
  panelHeader.innerHTML = '⚙️ Управление CV';
  panelHeader.style.cssText = `
    color: white;
    font-size: 16px;
    font-weight: 600;
    padding: 20px 20px 15px 20px;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    margin-bottom: 15px;
  `;

  // Создаем контейнер для кнопок
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = `
    padding: 0 20px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;

  // Кнопка сохранения
  const saveButton = document.createElement('button');
  saveButton.innerHTML = '💾 Сохранить';
  saveButton.className = 'panel-button save-button';
  saveButton.style.cssText = `
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  `;

  // Кнопка сброса
  const resetButton = document.createElement('button');
  resetButton.innerHTML = '🔄 Сбросить изменения';
  resetButton.className = 'panel-button reset-button';
  resetButton.style.cssText = `
    background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  `;

  // Кнопка PDF
  const pdfButton = document.createElement('button');
  pdfButton.innerHTML = '📄 Скачать PDF';
  pdfButton.className = 'panel-button pdf-button';
  pdfButton.style.cssText = `
    background: linear-gradient(135deg, #6f42c1 0%, #8e44ad 100%);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(111, 66, 193, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  `;

  // Добавляем эффекты наведения для всех кнопок
  [saveButton, resetButton, pdfButton].forEach(button => {
    button.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.filter = 'brightness(1.1)';
    });

    button.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.filter = 'brightness(1)';
    });

    button.addEventListener('mousedown', function() {
      this.style.transform = 'translateY(0) scale(0.98)';
    });

    button.addEventListener('mouseup', function() {
      this.style.transform = 'translateY(-2px) scale(1)';
    });
  });

  // Логика открытия/закрытия панели
  let isOpen = false;
  toggleButton.addEventListener('click', function() {
    isOpen = !isOpen;
    if (isOpen) {
      controlPanel.style.right = '0px';
      toggleButton.innerHTML = '▶';
      toggleButton.style.transform = 'translateY(-50%) rotate(180deg)';
    } else {
      controlPanel.style.right = '-280px';
      toggleButton.innerHTML = '◀';
      toggleButton.style.transform = 'translateY(-50%) rotate(0deg)';
    }
  });

  // Эффект для кнопки-стрелки
  toggleButton.addEventListener('mouseenter', function() {
    this.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    this.style.transform += ' scale(1.05)';
  });

  toggleButton.addEventListener('mouseleave', function() {
    this.style.backgroundColor = 'transparent';
    if (isOpen) {
      this.style.transform = 'translateY(-50%) rotate(180deg)';
    } else {
      this.style.transform = 'translateY(-50%) rotate(0deg)';
    }
  });

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
    showNotification('📄 Функция PDF скоро будет доступна', '#6f42c1');
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
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(-100px);
    background: ${color};
    color: white;
    padding: 15px 25px;
    border-radius: 10px;
    z-index: 1002;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;
  
  document.body.appendChild(notification);
  
  // Анимация появления
  setTimeout(() => {
    notification.style.transform = 'translateX(-50%) translateY(0)';
  }, 100);
  
  // Анимация исчезновения
  setTimeout(() => {
    notification.style.transform = 'translateX(-50%) translateY(-100px)';
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