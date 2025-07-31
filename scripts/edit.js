 /**
 * Функция для сохранения данных в localStorage
 * Сохраняет содержимое всех редактируемых элементов в локальное хранилище браузера
 * Данные сохраняются в формате JSON с ключами element_0, element_1 и т.д.
 */
function saveToLocalStorage() {
  // Находим все элементы с атрибутом data-src
  const editableElements = document.querySelectorAll('[data-src]');
  const data = {};
  
  // Проходим по каждому редактируемому элементу и сохраняем его содержимое
  editableElements.forEach(element => {
    const key = element.getAttribute('data-src');
    if (key) {
      // Сохраняем HTML содержимое элемента с ключом из data-src
      data[key] = element.innerHTML;
    }
  });
  
  // Сохраняем данные в localStorage в формате JSON
  localStorage.setItem('cvData', JSON.stringify(data));
}

/**
 * Функция для загрузки данных из localStorage
 * Восстанавливает содержимое редактируемых элементов из локального хранилища
 * Вызывается при загрузке страницы для восстановления пользовательских изменений
 */
function loadFromLocalStorage() {
  // Получаем сохраненные данные из localStorage
  const savedData = localStorage.getItem('cvData');
  
  if (savedData) {
    // Парсим JSON данные
    const data = JSON.parse(savedData);
    
    // Проходим по всем ключам в сохраненных данных
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        // Находим элемент по атрибуту data-src
        const element = document.querySelector(`[data-src="${key}"]`);
        if (element) {
          // Восстанавливаем HTML содержимое элемента
          element.innerHTML = data[key];
        }
      }
    }
  }
}

/**
 * Функция для создания редактируемых элементов
 * Делает указанные элементы на странице редактируемыми и добавляет к ним обработчики событий
 * Включает валидацию, автосохранение и ограничения по длине текста
 */
function makeElementsEditable() {
  // Находим все элементы с атрибутом data-src, чтобы сделать их редактируемыми
  const editableElements = document.querySelectorAll('[data-src]');
    
  editableElements.forEach(element => {
    // Делаем элемент редактируемым
    element.setAttribute('contenteditable', 'true');
    // Примечание: Стили для редактируемых элементов управляются через editStyle.css
    
    // Обработчик события потери фокуса - сохраняем данные когда пользователь закончил редактирование
    element.addEventListener('blur', function() {
      saveToLocalStorage();
    });
    
    // Обработчик нажатий клавиш для валидации и управления вводом
    element.addEventListener('keydown', function(e) {
      // Получаем максимальную длину текста из атрибута data-max-length
      const maxLength = this.getAttribute('data-max-length');
      
      // Проверяем, что maxLength задан и является числом
      if (maxLength && !isNaN(parseInt(maxLength, 10))) {
        const currentLength = this.innerText.length;
        const allowedKeys = [
          'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'
        ];

        // Если длина текста достигла лимита и нажата не разрешенная клавиша
        if (currentLength >= parseInt(maxLength, 10) && !allowedKeys.includes(e.key)) {
          e.preventDefault(); // Отменяем ввод символа
          // Показываем уведомление, что лимит достигнут
          showNotification(`Достигнут лимит в ${maxLength} символов`, '#f44336');
        }
      }

      // Обработчик вставки текста из буфера обмена
      // Предотвращаем вставку HTML-кода, разрешаем только чистый текст
      element.addEventListener('paste', function(e) {
        e.preventDefault(); // Отменяем стандартное поведение вставки
        
        // Получаем только текстовое содержимое из буфера обмена
        let text = (e.originalEvent || e).clipboardData.getData('text/plain');
        const maxLength = this.getAttribute('data-max-length');

        // Проверяем ограничения по длине при вставке
        if (maxLength) {
          const selection = window.getSelection();
          const selectedText = selection.toString();
          // Вычисляем текущую длину с учетом выделенного текста (который будет заменен)
          const currentLength = this.innerText.length - selectedText.length;
          const remainingLength = maxLength - currentLength;

          // Обрезаем текст если он превышает допустимую длину
          if (remainingLength > 0) {
            text = text.substring(0, remainingLength);
          } else {
            text = ''; // Если места нет совсем, не вставляем ничего
          }
        }

        // Вставляем обработанный текст
        if (text) {
          document.execCommand('insertText', false, text);
        }
      });
      
      // Обработчик изменения содержимого элемента
      // Реализует автосохранение с задержкой для оптимизации производительности
      element.addEventListener('input', function() {
        // Отменяем предыдущий таймер сохранения (debouncing)
        clearTimeout(this.saveTimeout);
        
        // Устанавливаем новый таймер на сохранение
        this.saveTimeout = setTimeout(() => {
          saveToLocalStorage(); // Сохраняем данные через 1 секунду после последнего изменения
        }, 1000); // Задержка в 1 секунду предотвращает частые сохранения при быстром наборе
      });
    });
  });
}

/**
 * Функция для создания и добавления выдвижной панели управления
 * Создает боковую панель с кнопками для управления CV: сохранение, сброс и генерация PDF
 * Панель выдвигается справа и может быть скрыта/показана пользователем
 */
function addControlPanel() {
  // Создаем основной контейнер панели управления
  const controlPanel = document.createElement('div');
  controlPanel.id = 'control-panel'; // ID для стилизации и исключения из PDF

  // Создаем кнопку-переключатель (стрелку) для открытия/закрытия панели
  const toggleButton = document.createElement('button');
  toggleButton.innerHTML = '▶'; // Стрелка указывает влево когда панель закрыта
  toggleButton.className = 'control-panel-toggle';

  // Создаем заголовок панели с иконкой настроек
  const panelHeader = document.createElement('div');
  panelHeader.innerHTML = '⚙️ Управление CV';
  panelHeader.className = 'panel-header';

  // Создаем контейнер для размещения всех кнопок управления
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'buttons-container';

  // Кнопка ручного сохранения данных
  const saveButton = document.createElement('button');
  saveButton.innerHTML = '💾 Сохранить';
  saveButton.className = 'panel-button save-button';

  // Кнопка сброса всех изменений к исходному состоянию
  const resetButton = document.createElement('button');
  resetButton.innerHTML = '🔄 Сбросить изменения';
  resetButton.className = 'panel-button reset-button';

  // Кнопка генерации и скачивания PDF версии CV
  const pdfButton = document.createElement('button');
  pdfButton.innerHTML = '📄 Скачать PDF';
  pdfButton.className = 'panel-button pdf-button';

  // Примечание: Эффекты наведения для кнопок реализованы в CSS (:hover, :active)

  // Логика управления состоянием панели (открыта/закрыта)
  let isOpen = false; // Флаг состояния панели
  
  // Обработчик клика по кнопке-переключателю
  toggleButton.addEventListener('click', function() {
    isOpen = !isOpen; // Переключаем состояние
    
    // Добавляем/убираем CSS класс для анимации открытия/закрытия
    controlPanel.classList.toggle('open');
    toggleButton.classList.toggle('open');
    
    // Меняем направление стрелки в зависимости от состояния панели
    toggleButton.innerHTML = isOpen ? '◀' : '▶'; // ◀ когда открыта, ▶ когда закрыта
  });

  // Примечание: Визуальные эффекты для кнопки-стрелки реализованы в CSS

  // === ОБРАБОТЧИКИ СОБЫТИЙ ДЛЯ КНОПОК УПРАВЛЕНИЯ ===
  
  // Обработчик кнопки ручного сохранения
  saveButton.addEventListener('click', function() {
    saveToLocalStorage(); // Принудительно сохраняем все данные
    showNotification('💾 Данные сохранены!', '#28a745'); // Показываем уведомление об успехе (зеленый цвет)
  });

  // Обработчик кнопки сброса изменений
  resetButton.addEventListener('click', function() {
    // Запрашиваем подтверждение у пользователя перед сбросом
    if (confirm('Вы уверены, что хотите сбросить все изменения?')) {
      skipSaveOnUnload = true; // Устанавливаем флаг, чтобы не сохранять при перезагрузке
      localStorage.removeItem('cvData'); // Удаляем сохраненные данные
      showNotification('🔄 Изменения сброшены!', '#dc3545'); // Уведомление (красный цвет)
      
      // Перезагружаем страницу через 1 секунду, чтобы пользователь увидел уведомление
      setTimeout(() => location.reload(), 1000);
    }
  });

  // Обработчик кнопки PDF (временный, будет переопределен в pdf-integration.js)
  pdfButton.addEventListener('click', function() {
    // Этот обработчик является заглушкой и будет заменен в pdf-integration.js
    // Там реализована полная логика генерации PDF с использованием html2canvas и jsPDF
    // showNotification('📄 Функция PDF скоро будет доступна', '#6f42c1');
  });

  // === СБОРКА И ДОБАВЛЕНИЕ ПАНЕЛИ НА СТРАНИЦУ ===
  
  // Добавляем все кнопки в контейнер кнопок
  buttonsContainer.appendChild(saveButton);
  buttonsContainer.appendChild(resetButton);
  buttonsContainer.appendChild(pdfButton);
  
  // Собираем панель: добавляем кнопку-переключатель, заголовок и контейнер с кнопками
  controlPanel.appendChild(toggleButton);
  controlPanel.appendChild(panelHeader);
  controlPanel.appendChild(buttonsContainer);
  
  // Добавляем готовую панель в DOM (в конец body)
  document.body.appendChild(controlPanel);

  // Создаем глобальный объект для доступа к панели из других скриптов
  // Это позволяет pdf-integration.js и другим модулям взаимодействовать с панелью
  window.controlPanel = {
    panel: controlPanel,        // Ссылка на DOM элемент панели
    saveButton: saveButton,     // Ссылка на кнопку сохранения
    resetButton: resetButton,   // Ссылка на кнопку сброса
    pdfButton: pdfButton,       // Ссылка на кнопку PDF
    isOpen: () => isOpen,       // Функция для проверки состояния панели
    toggle: () => toggleButton.click() // Функция для программного переключения панели
  };
}

/**
 * Функция для показа всплывающих уведомлений пользователю
 * Создает временное уведомление с анимацией появления и исчезновения
 * @param {string} message - Текст уведомления для отображения
 * @param {string} color - Цвет фона уведомления (по умолчанию зеленый #28a745)
 */
function showNotification(message, color = '#28a745') {
  // Создаем DOM элемент для уведомления
  const notification = document.createElement('div');
  notification.innerHTML = message; // Устанавливаем текст уведомления
  notification.className = 'notification-popup'; // CSS класс для стилизации
  notification.style.backgroundColor = color; // Устанавливаем цвет фона

  // Добавляем уведомление в DOM
  document.body.appendChild(notification);
  
  // Анимация плавного появления уведомления
  setTimeout(() => {
    notification.classList.add('show'); // CSS класс для анимации появления
  }, 100); // Небольшая задержка для корректной анимации
  
  // Анимация исчезновения и удаление из DOM
  setTimeout(() => {
    notification.classList.remove('show'); // Убираем класс показа (начинается анимация исчезновения)
    
    // Удаляем элемент из DOM после завершения анимации
    setTimeout(() => {
      // Проверяем, что элемент еще существует в DOM перед удалением
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 400); // Время соответствует длительности CSS анимации исчезновения
  }, 3000); // Уведомление показывается 3 секунды
}

// Глобальный флаг для предотвращения автосохранения при сбросе данных
// Используется чтобы избежать повторного сохранения при перезагрузке страницы после сброса
let skipSaveOnUnload = false;

/**
 * Инициализация CV редактора при загрузке страницы
 * Выполняет все необходимые настройки для работы редактируемого CV
 */
document.addEventListener('DOMContentLoaded', function() {
  // Делаем элементы страницы редактируемыми
  makeElementsEditable();
  
  // Загружаем сохраненные пользователем данные
  loadFromLocalStorage();
  
  // Создаем и добавляем панель управления
  addControlPanel();
  
  // Информационные сообщения в консоль для разработчика
  console.log('CV Editor загружен! Кликните на любой текст для редактирования.');
  console.log('Панель управления доступна справа - кликните на стрелку для открытия.');
});

/**
 * Автосохранение данных перед закрытием страницы
 * Гарантирует, что пользовательские изменения не будут потеряны
 */
window.addEventListener('beforeunload', function() {
  // Проверяем флаг: если был инициирован сброс данных, то не сохраняем
  // Это предотвращает сохранение пустых данных при перезагрузке после сброса
  if (!skipSaveOnUnload) {
    saveToLocalStorage(); // Сохраняем все текущие изменения
  }
});