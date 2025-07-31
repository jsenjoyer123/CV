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
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.blur();
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

// Добавляем кнопку для сброса данных
function addResetButton() {
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Сбросить изменения';
  resetButton.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc3545;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    z-index: 1000;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;
  
  resetButton.addEventListener('click', function() {
    if (confirm('Вы уверены, что хотите сбросить все изменения?')) {
      localStorage.removeItem('cvData');
      location.reload();
    }
  });
  
  document.body.appendChild(resetButton);
}

// Добавляем кнопку для сохранения
function addSaveButton() {
  const saveButton = document.createElement('button');
  saveButton.textContent = 'Сохранить';
  saveButton.style.cssText = `
    position: fixed;
    top: 20px;
    right: 180px;
    background: #28a745;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    z-index: 1000;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;
  
  saveButton.addEventListener('click', function() {
    saveToLocalStorage();
    
    // Показываем уведомление о сохранении
    const notification = document.createElement('div');
    notification.textContent = 'Сохранено!';
    notification.style.cssText = `
      position: fixed;
      top: 70px;
      right: 20px;
      background: #28a745;
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      z-index: 1001;
      font-size: 14px;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 2000);
  });
  
  document.body.appendChild(saveButton);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  makeElementsEditable();
  loadFromLocalStorage();
  addSaveButton();
  addResetButton();
  
  console.log('CV Editor загружен! Кликните на любой текст для редактирования.');
});

// Сохраняем данные перед закрытием страницы
window.addEventListener('beforeunload', function() {
  saveToLocalStorage();
});