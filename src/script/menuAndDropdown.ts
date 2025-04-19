// Интерфейс для параметров toggleMenu
export interface ToggleMenuOptions {
  closeButton?: HTMLElement | null;
  animationDuration?: number;
  callback?: {
    onOpen: () => void;
    onClose: () => void;
  };
}

// === Функция toggleMenu ===
// Управляет открытием/закрытием одного меню с поддержкой кнопки закрытия и обработкой кликов вне меню.
export function toggleMenu(container: HTMLElement, button: HTMLElement, options: ToggleMenuOptions = {}): void {
  // === Проверка входных данных ===
  // Проверяем, что переданы корректные HTML-элементы.
  if (!(container instanceof HTMLElement)) {
    console.error('Первый аргумент "container" должен быть HTML-элементом');
    return;
  }
  if (!(button instanceof HTMLElement)) {
    console.error('Второй аргумент "button" должен быть HTML-элементом');
    return;
  }
  if (options.closeButton && !(options.closeButton instanceof HTMLElement)) {
    console.error('Опция "closeButton" должна быть HTML-элементом или null');
    return;
  }

  // === Инициализация параметров ===
  // Устанавливаем значения по умолчанию для длительности анимации и кнопки закрытия.
  const { closeButton = null, animationDuration = 300 } = options;

  // === Инициализация состояния ===
  // Флаг для отслеживания, открыто ли меню.
  let isOpen: boolean = false;

  // === Функция управления z-index ===
  // Обеспечивает, чтобы кнопка оставалась поверх контейнера, если не используется отдельная кнопка закрытия.
  const adjustButtonZIndex = (): void => {
    if (closeButton) return; // Пропускаем, если есть кнопка закрытия

    const containerZIndex: number = parseInt(window.getComputedStyle(container).zIndex, 10) || 0;
    const buttonZIndex: number = parseInt(window.getComputedStyle(button).zIndex, 10) || 0;

    // Устанавливаем z-index кнопки на единицу больше, чем у контейнера
    button.style.zIndex = `${Math.max(containerZIndex + 1, buttonZIndex)}`;

    // Обновляем текст кнопки, если указаны текстовые опции
    if (options.callback) {
      if (isOpen) {
        options.callback.onOpen()
      } else {
        options.callback.onClose()
      }
    }
  };

  // === Функция переключения меню ===
  // Открывает или закрывает меню, добавляя/удаляя класс active и настраивая обработчики.
  const toggle = (): void => {
    isOpen = !isOpen;
    if (isOpen) {
      container.classList.add('active');
      adjustButtonZIndex();
      // Ждём завершения анимации перед добавлением обработчика кликов вне меню
      setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
      }, animationDuration);
    } else {
      container.classList.remove('active');
      document.removeEventListener('click', handleOutsideClick);
      adjustButtonZIndex();
    }
  };

  // === Обработчик кликов вне меню ===
  // Закрывает меню, если клик произошёл вне контейнера и не на кнопках.
  const handleOutsideClick = (event: MouseEvent): void => {
    const target = event.target as Node;
    const isClickInsideContainer: boolean = container.contains(target);
    const isClickOnButton: boolean = button.contains(target);
    const isClickOnCloseButton: boolean = closeButton ? closeButton.contains(target) : false;

    if (!isClickInsideContainer && !isClickOnButton && !isClickOnCloseButton) {
      toggle();
    }
  };

  // === Настройка обработчиков событий ===
  // Добавляем обработчик клика на кнопку открытия/закрытия.
  button.addEventListener('click', (event: MouseEvent) => {
    event.stopPropagation();
    toggle();
  });

  // Если есть кнопка закрытия, добавляем её обработчик
  if (closeButton) {
    closeButton.addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation();
      if (isOpen) {
        toggle();
      }
    });
  }

  // === Настройка наблюдателя за изменениями ===
  // Отслеживаем изменения стилей или классов контейнера, чтобы обновить z-index при необходимости.
  const observer = new MutationObserver(() => {
    if (isOpen) {
      adjustButtonZIndex();
    }
  });
  observer.observe(container, { attributes: true, attributeFilter: ['style', 'class'] });
}

// Интерфейс для параметров toggleDropdown
interface ToggleDropdownOptions {
  animationDuration?: number;
}

// Интерфейс для состояния выпадающего списка
interface DropdownState {
  isOpen: boolean;
  handleOutsideClick: (event: MouseEvent) => void;
}

// === Функция toggleDropdown ===
// Управляет несколькими выпадающими списками, обеспечивая, что только один список открыт одновременно.
export function toggleDropdown(containers: HTMLElement | HTMLElement[], buttons: HTMLElement | HTMLElement[], options: ToggleDropdownOptions = {}): void {
  // === Нормализация входных данных ===
  // Приводим входные данные к массивам для единообразной обработки.
  const containerArray: HTMLElement[] = Array.isArray(containers) ? containers : [containers];
  const buttonArray: HTMLElement[] = Array.isArray(buttons) ? buttons : [buttons];

  // === Проверка входных данных ===
  // Проверяем соответствие количества контейнеров и кнопок, а также их тип.
  if (containerArray.length !== buttonArray.length) {
    console.error('Количество контейнеров и кнопок должно совпадать');
    return;
  }

  for (let i = 0; i < containerArray.length; i++) {
    if (!(containerArray[i] instanceof HTMLElement)) {
      console.error(`Элемент containers[${i}] должен быть HTML-элементом`);
      return;
    }
    if (!(buttonArray[i] instanceof HTMLElement)) {
      console.error(`Элемент buttons[${i}] должен быть HTML-элементом`);
      return;
    }
  }

  // === Инициализация параметров ===
  // Устанавливаем значение по умолчанию для длительности анимации.
  const { animationDuration = 300 } = options;

  // === Инициализация состояния ===
  // Создаём массив состояний для каждого выпадающего списка.
  const dropdownStates: DropdownState[] = containerArray.map(() => ({
    isOpen: false,
    handleOutsideClick: () => { } // Будет заполнено ниже
  }));

  // === Функция закрытия всех списков, кроме указанного ===
  // Закрывает все выпадающие списки, кроме того, что с переданным индексом.
  const closeAllExcept = (exceptIndex: number): void => {
    dropdownStates.forEach((state, index) => {
      if (index !== exceptIndex && state.isOpen) {
        state.isOpen = false;
        containerArray[index].classList.remove('active');
        buttonArray[index].classList.remove('active');
        document.removeEventListener('click', state.handleOutsideClick);
      }
    });
  };

  // === Функция переключения выпадающего списка ===
  // Открывает или закрывает выпадающий список, закрывая все остальные при необходимости.
  const toggle = (index: number): void => {
    const state = dropdownStates[index];
    state.isOpen = !state.isOpen;

    if (state.isOpen) {
      closeAllExcept(index);
      containerArray[index].classList.add('active');
      buttonArray[index].classList.add('active');
      setTimeout(() => {
        document.addEventListener('click', state.handleOutsideClick);
      }, animationDuration);
    } else {
      containerArray[index].classList.remove('active');
      buttonArray[index].classList.remove('active');
      document.removeEventListener('click', state.handleOutsideClick);
    }
  };

  // === Настройка обработчиков для каждого списка ===
  // Создаём обработчики кликов для каждого выпадающего списка.
  containerArray.forEach((container, index) => {
    const button = buttonArray[index];
    const state = dropdownStates[index];

    // Обработчик клика вне списка
    state.handleOutsideClick = (event: MouseEvent): void => {
      const target = event.target as Node;
      const isClickInsideContainer: boolean = container.contains(target);
      const isClickOnButton: boolean = button.contains(target);

      if (!isClickInsideContainer && !isClickOnButton) {
        toggle(index);
      }
    };

    // Обработчик клика на кнопку
    button.addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation();
      toggle(index);
    });
  });
}