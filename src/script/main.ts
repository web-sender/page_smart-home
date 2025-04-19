import { toggleMenu, toggleDropdown } from './menuAndDropdown';
import carouselList, { CarouselControls } from './carouselList';
import animateCounter, { RepeatMode } from './animateCounter';

// === Инициализация приложения ===
// Запускает основную логику после полной загрузки DOM.
document.addEventListener('DOMContentLoaded', () => {
  // Вызываем основную функцию скрипта
  baseScript();
});

// === Основная функция скрипта ===
// Инициализирует меню, выпадающие списки, карусель, поиск и анимации.
function baseScript(): void {
  // --- Настройка мобильного меню ---
  // Инициализируем меню с кнопкой открытия/закрытия и текстовыми метками.
  const menuButton: HTMLElement | null = document.querySelector('.btn.mobile-only');
  const menuContainer: HTMLElement | null = document.querySelector('#menu');
  // SVG button
  const topLine: HTMLElement | null = document.getElementById('top');
  const middleLine: HTMLElement | null = document.getElementById('middle');
  const bottomLine: HTMLElement | null = document.getElementById('bottom');

  if (menuButton && menuContainer) {
    toggleMenu(menuContainer, menuButton, {
      animationDuration: 300,
      callback: {
        onOpen: () => {
          // Transform to cross
          topLine.setAttribute('d', 'M30 30 L70 70');
          middleLine.setAttribute('opacity', '0');
          bottomLine.setAttribute('d', 'M30 70 L70 30');
        },
        onClose: () => {
          // Transform back to hamburger
          topLine.setAttribute('d', 'M20 30 H80');
          middleLine.setAttribute('opacity', '1');
          bottomLine.setAttribute('d', 'M20 70 H80');
        }
      }
    });
  } else {
    console.warn('Не удалось найти элементы для мобильного меню (.btn.mobile-only или #menu)');
  }

  // --- Настройка первого выпадающего списка ---
  // Инициализируем выпадающий список для элементов .dropdown-content.
  const dropdownContents: HTMLElement[] = Array.from(document.querySelectorAll('.dropdown-content'));
  const dropdownButtons: HTMLElement[] = Array.from(document.querySelectorAll('.dropdown-btn'));

  if (dropdownContents.length && dropdownButtons.length) {
    toggleDropdown(dropdownContents, dropdownButtons);
  } else {
    console.warn('Не удалось найти элементы для выпадающего списка (.dropdown-content или .dropdown-btn)');
  }

  // --- Настройка второго выпадающего списка ---
  // Инициализируем выпадающий список для элементов меню (.menu-dropdown).
  const dropdownsMenu: HTMLElement[] = Array.from(document.querySelectorAll('.menu-dropdown'));
  const dropdownButtonsMenu: HTMLElement[] = Array.from(document.querySelectorAll('.menu-section-title'));

  if (dropdownsMenu.length && dropdownButtonsMenu.length) {
    toggleDropdown(dropdownsMenu, dropdownButtonsMenu);
  } else {
    console.warn('Не удалось найти элементы для выпадающего меню (.menu-dropdown или .menu-section-title)');
  }

  // --- Настройка поля поиска ---
  // Добавляем обработчик для переключения активного состояния поля поиска.
  const input: HTMLElement | null = document.querySelector('.search-input');
  const inputBtn: HTMLElement | null = document.querySelector('.search-btn');

  if (input && inputBtn) {
    inputBtn.addEventListener('click', (event: MouseEvent) => {
      event.preventDefault(); // Предотвращаем отправку формы или другие действия по умолчанию
      input.classList.toggle('active');
    });
  } else {
    console.warn('Не удалось найти элементы для поиска (.search-input или .search-btn)');
  }

  // --- Настройка карусели ---
  // Инициализируем карусель с элементами и кнопками управления.
  const servicesListElement: HTMLElement | null = document.querySelector('.services-list');
  const items: NodeListOf<HTMLElement> = document.querySelectorAll('.service-item');
  const controls: CarouselControls | null = {
    prev: document.querySelector('.carousel-prev') as HTMLButtonElement,
    next: document.querySelector('.carousel-next') as HTMLButtonElement
  };

  if (servicesListElement && items.length && controls.prev && controls.next) {
    carouselList(servicesListElement, items, controls);
  } else {
    console.warn('Не удалось найти элементы для карусели (.services-list, .service-item, .carousel-prev или .carousel-next)');
  }

  // --- Запуск анимации чисел ---
  // Вызываем функцию для анимации числовых элементов.
  numberAnimate();

  // --- Запуск анимации видимости ---
  // Вызываем функцию для анимации элементов при появлении в области видимости.
  animateElements();
}

// === Анимация элементов при появлении ===
// Настраивает наблюдение за видимостью различных элементов и добавляет класс visible при их появлении.
function animateElements(): void {
  // --- Анимация изображений карточек ---
  // Наблюдаем за изображениями .card-image.
  const sectionImgs: NodeListOf<HTMLElement> = document.querySelectorAll('.card-image');
  sectionImgs.forEach((img: HTMLElement) => {
    observeVisibility(img);
  });

  // --- Анимация содержимого карточек ---
  // Наблюдаем за содержимым .card-content.
  const sectionContent: NodeListOf<HTMLElement> = document.querySelectorAll('.card-content');
  sectionContent.forEach((item: HTMLElement) => {
    observeVisibility(item);
  });

  // --- Анимация изображений участников ---
  // Наблюдаем за изображениями .member-image.
  const imgs: NodeListOf<HTMLElement> = document.querySelectorAll('.member-image');
  imgs.forEach((img: HTMLElement) => {
    observeVisibility(img);
  });

  // --- Анимация описаний доверия ---
  // Наблюдаем за параграфами .trust-description p.
  const trustDescriptions: NodeListOf<HTMLElement> = document.querySelectorAll('.trust-description p');
  trustDescriptions.forEach((trustDescription: HTMLElement) => {
    observeVisibility(trustDescription);
  });

  // --- Анимация элементов "Узнать больше" ---
  // Наблюдаем за элементами .learn-more-item.
  const learnMoreItems: NodeListOf<HTMLElement> = document.querySelectorAll('.learn-more-item');
  learnMoreItems.forEach((learnMoreItem: HTMLElement) => {
    observeVisibility(learnMoreItem);
  });
}

// === Наблюдение за видимостью ===
// Добавляет/удаляет класс visible при входе/выходе элемента из области видимости.
function observeVisibility(element: HTMLElement, type: 'none' | undefined = undefined): void {
  // --- Проверка входных данных ---
  // Проверяем, что элемент существует.
  if (!element) {
    console.warn('Передан невалидный элемент для наблюдения видимости');
    return;
  }

  // --- Настройка IntersectionObserver ---
  // Создаём наблюдатель для отслеживания видимости элемента.
  const observer = new IntersectionObserver(([entry]: IntersectionObserverEntry[]) => {
    if (entry.isIntersecting) {
      // Элемент виден: добавляем класс visible
      element.classList.add('visible');
      // Если тип 'none', отключаем наблюдение после первого появления
      if (type === 'none') {
        observer.disconnect();
      }
    } else {
      // Элемент скрыт: убираем класс visible
      element.classList.remove('visible');
    }
  }, {
    threshold: 0.1 // Порог видимости: 10% элемента должны быть видны
  });

  // --- Запуск наблюдения ---
  // Начинаем отслеживать элемент.
  observer.observe(element);
}

// === Анимация числовых элементов ===
// Запускает анимацию чисел для статистических данных и элементов "Узнать больше".
function numberAnimate(): void {
  // --- Анимация статистических чисел ---
  // Применяем animateCounter к элементам .stat-number.
  const cardStats: NodeListOf<HTMLElement> = document.querySelectorAll('.stat-number');
  cardStats.forEach((card: HTMLElement) => {
    animateCounter(card, {
      duration: 2200,
      delay: 50,
      repeat: RepeatMode.OnReverseScroll
    });
  });

  // --- Анимация второго элемента "Узнать больше" ---
  // Применяем animateCounter к одному элементу .learn-more-number.
  const learnMoreNumber: NodeListOf<HTMLElement> = document.querySelectorAll('.learn-more-number');
  if (learnMoreNumber[1]) {
    animateCounter(learnMoreNumber[1], {
      duration: 2200,
      repeat: RepeatMode.OnReverseScroll
    });
  } else {
    console.warn('Не удалось найти второй элемент .learn-more-number для анимации');
  }
}