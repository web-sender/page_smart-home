export enum RepeatMode {
  None = 'none',
  Always = 'always',
  OnReappear = 'onReappear',
  OnReverseScroll = 'onReverseScroll'
}

export interface AnimateCounterOptions {
  percent?: number | string;
  duration?: number | string;
  delay?: number | string;
  repeat?: RepeatMode | string;
}

export default function animateCounter(element: HTMLElement, options: AnimateCounterOptions = {}): void {
  // === Проверка входного элемента ===
  // Проверяем, что передан корректный HTML-элемент. Это единственная жёсткая проверка.
  if (!(element instanceof HTMLElement)) {
    console.error('Первый аргумент должен быть HTML-элементом');
    return;
  }

  // === Инициализация значений по умолчанию ===
  // Определяем значения по умолчанию для всех параметров, которые будут использованы при некорректных входных данных.
  const defaultOptions: Required<Omit<AnimateCounterOptions, 'percent' | 'duration' | 'delay' | 'repeat'>> & {
    percent: number;
    duration: number;
    delay: number;
    repeat: RepeatMode;
  } = {
    percent: 70,
    duration: 2000,
    delay: 0,
    repeat: RepeatMode.None
  };

  // === Валидация и корректировка параметров ===
  // Умная валидация с попыткой распознавания значений и их корректировкой.
  const parseNumber = (value: number | string | undefined, defaultValue: number, paramName: string): number => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value; // Число валидно, используем его
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        console.warn(`Параметр "${paramName}" передан как строка ("${value}"). Использовано преобразованное значение: ${parsed}`);
        return parsed; // Успешно преобразовали строку в число
      }
    }
    console.warn(`Некорректное значение параметра "${paramName}" (${value}). Использовано значение по умолчанию: ${defaultValue}`);
    return defaultValue; // Некорректное значение, используем значение по умолчанию
  };

  // Валидация percent (без ограничения диапазона, включая отрицательные значения)
  const percent: number = parseNumber(options.percent, defaultOptions.percent, 'percent');

  // Валидация duration (должно быть положительным)
  const duration: number = parseNumber(options.duration, defaultOptions.duration, 'duration');
  const validDuration: number = duration > 0 ? duration : (
    console.warn(`Параметр "duration" должен быть положительным (${duration}). Использовано значение по умолчанию: ${defaultOptions.duration}`),
    defaultOptions.duration
  );

  // Валидация delay (должно быть неотрицательным)
  const delay: number = parseNumber(options.delay, defaultOptions.delay, 'delay');
  const validDelay: number = delay >= 0 ? delay : (
    console.warn(`Параметр "delay" должен быть неотрицательным (${delay}). Использовано значение по умолчанию: ${defaultOptions.delay}`),
    defaultOptions.delay
  );

  // Валидация repeat
  const repeat: RepeatMode = Object.values(RepeatMode).includes(options.repeat as RepeatMode)
    ? options.repeat as RepeatMode
    : typeof options.repeat === 'string' && Object.values(RepeatMode).some(mode => mode.toLowerCase() === options.repeat.toLowerCase())
      ? Object.values(RepeatMode).find(mode => mode.toLowerCase() === options.repeat.toLowerCase()) as RepeatMode
      : (
        console.warn(`Некорректное значение параметра "repeat" (${options.repeat}). Использовано значение по умолчанию: ${defaultOptions.repeat}`),
        defaultOptions.repeat
      );

  // === Извлечение начального числа ===
  // Извлекаем число из текста элемента и сохраняем остальной текст для дальнейшего использования.
  const initialText: string = element.textContent?.trim() ?? '';
  const numberMatch: RegExpMatchArray | null = initialText.match(/-?\d*\.?\d+/);
  const currentNumber: number = numberMatch ? parseFloat(numberMatch[0]) : 0;
  const nonNumberText: string = initialText.replace(numberMatch ? numberMatch[0] : '', '');

  // === Вычисление начального и конечного значений ===
  // На основе percent вычисляем начальное значение (может быть отрицательным), конечное значение — текущее число.
  const startValue: number = currentNumber * (percent / 100);
  const endValue: number = currentNumber;

  // === Инициализация переменных состояния ===
  // Переменные для отслеживания состояния анимации, прокрутки и видимости элемента.
  let hasAnimated: boolean = false;
  let isFullyHidden: boolean = false;
  let lastScrollPosition: number = window.scrollY;
  let lastHorizontalScrollPosition: number = 0;
  let lastScrollDirection: 'up' | 'down' | 'left' | 'right' | null = null;
  let initialHiddenSide: 'top' | 'bottom' | 'left' | 'right' | null = null;
  let lastHiddenSide: 'top' | 'bottom' | 'left' | 'right' | null = null;
  let currentValue: number = startValue;
  let animationInterval: NodeJS.Timeout | null = null;
  let lastIntersectionRatio: number = 0;

  // === Определение контейнера прокрутки ===
  // Ищем ближайший родительский элемент с горизонтальной прокруткой, если его нет — используем window.
  let scrollContainer: HTMLElement | Window = window;
  let parent: HTMLElement | null = element.parentElement;
  while (parent) {
    const overflowX: string = window.getComputedStyle(parent).overflowX;
    if (overflowX === 'auto' || overflowX === 'scroll') {
      scrollContainer = parent;
      break;
    }
    parent = parent.parentElement;
  }

  // Инициализируем позицию скролла в зависимости от контейнера
  if (scrollContainer === window) {
    lastScrollPosition = window.scrollY;
  } else {
    lastHorizontalScrollPosition = (scrollContainer as HTMLElement).scrollLeft;
  }

  // === Функция анимации ===
  // Запускает пошаговую анимацию от startValue до endValue за указанную длительность.
  const startAnimation = (): void => {
    if (animationInterval) {
      clearInterval(animationInterval);
    }

    const totalSteps: number = Math.abs(endValue - startValue);
    const stepsPerSecond: number = 60;
    const totalFrames: number = Math.max(1, Math.round((validDuration / 1000) * stepsPerSecond));
    const step: number = totalSteps / totalFrames;
    const interval: number = validDuration / totalFrames;
    const direction: number = startValue < endValue ? 1 : -1;
    const effectiveStep: number = Math.abs(step) * direction;

    currentValue = startValue;
    element.textContent = Math.round(currentValue) + nonNumberText;

    animationInterval = setInterval(() => {
      currentValue += effectiveStep;

      if (direction === 1 && currentValue >= endValue) {
        currentValue = endValue;
        clearInterval(animationInterval);
        animationInterval = null;
        hasAnimated = true;
      } else if (direction === -1 && currentValue <= endValue) {
        currentValue = endValue;
        clearInterval(animationInterval);
        animationInterval = null;
        hasAnimated = true;
      }

      element.textContent = Math.round(currentValue) + nonNumberText;
    }, interval);
  };

  // === Настройка Intersection Observer ===
  // Отслеживает видимость элемента и запускает анимацию в зависимости от режима repeat.
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // Определяем направление прокрутки
      let scrollDirection: 'up' | 'down' | 'left' | 'right' | null = null;
      if (scrollContainer === window) {
        const currentScrollPosition: number = window.scrollY;
        scrollDirection = currentScrollPosition > lastScrollPosition ? 'down' : 'up';
        lastScrollPosition = currentScrollPosition;
      } else {
        const currentHorizontalScrollPosition: number = (scrollContainer as HTMLElement).scrollLeft;
        scrollDirection = currentHorizontalScrollPosition > lastHorizontalScrollPosition ? 'right' : 'left';
        lastHorizontalScrollPosition = currentHorizontalScrollPosition;
      }

      // Получаем координаты элемента и контейнера
      const rect: DOMRect = element.getBoundingClientRect();
      const containerRect: DOMRect | { width: number; height: number } = scrollContainer === window
        ? { width: window.innerWidth, height: window.innerHeight }
        : (scrollContainer as HTMLElement).getBoundingClientRect();
      const windowHeight: number = scrollContainer === window
        ? (window.innerHeight || document.documentElement.clientHeight)
        : (scrollContainer as HTMLElement).clientHeight;
      const windowWidth: number = scrollContainer === window
        ? (window.innerWidth || document.documentElement.clientWidth)
        : (scrollContainer as HTMLElement).clientWidth;

      // Определяем, с какой стороны элемент скрыт
      let hiddenSide: 'top' | 'bottom' | 'left' | 'right' | null = null;
      if (scrollContainer === window) {
        if (rect.bottom < 0) {
          hiddenSide = 'top';
        } else if (rect.top > windowHeight) {
          hiddenSide = 'bottom';
        }
      } else {
        const relativeLeft: number = rect.left - (containerRect as DOMRect).left;
        const relativeRight: number = rect.right - (containerRect as DOMRect).left;
        if (relativeRight < 0) {
          hiddenSide = 'left';
        } else if (relativeLeft > windowWidth) {
          hiddenSide = 'right';
        }
      }

      // Запоминаем изначальную сторону скрытия при первом наблюдении
      if (!hasAnimated && initialHiddenSide === null && !entry.isIntersecting) {
        initialHiddenSide = hiddenSide;
      }

      // Обработка видимости элемента
      if (entry.isIntersecting) {
        const intersectionRatio: number = entry.intersectionRatio;

        if (repeat === RepeatMode.Always) {
          // Для always: значение зависит от коэффициента видимости
          if (intersectionRatio !== lastIntersectionRatio) {
            if (animationInterval) {
              clearInterval(animationInterval);
              animationInterval = null;
            }

            const range: number = endValue - startValue;
            currentValue = startValue + (range * intersectionRatio);
            element.textContent = Math.round(currentValue) + nonNumberText;
          }
        } else {
          // Для других режимов: проверяем, нужно ли запускать анимацию
          const shouldAnimate: boolean =
            (!hasAnimated) ||
            (repeat === RepeatMode.OnReappear && isFullyHidden) ||
            (repeat === RepeatMode.OnReverseScroll && lastScrollDirection && (
              (scrollDirection === 'up' && lastScrollDirection === 'down') ||
              (scrollDirection === 'down' && lastScrollDirection === 'up') ||
              (scrollDirection === 'left' && lastScrollDirection === 'right') ||
              (scrollDirection === 'right' && lastScrollDirection === 'left')
            ) && hasAnimated && lastHiddenSide === initialHiddenSide);

          if (shouldAnimate) {
            setTimeout(() => {
              startAnimation();
            }, validDelay);
          }
        }

        isFullyHidden = false;
        lastIntersectionRatio = intersectionRatio;
      } else {
        // Элемент скрыт
        if (hiddenSide) {
          isFullyHidden = true;
          lastHiddenSide = hiddenSide;

          if (repeat === RepeatMode.Always) {
            currentValue = startValue;
            element.textContent = Math.round(currentValue) + nonNumberText;
            if (animationInterval) {
              clearInterval(animationInterval);
              animationInterval = null;
            }
          }
        }
      }

      lastScrollDirection = scrollDirection;
    });
  }, {
    root: scrollContainer === window ? null : scrollContainer as HTMLElement,
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
  });

  // Запускаем наблюдение за элементом
  observer.observe(element);
}
