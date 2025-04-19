export interface CarouselControls {
    prev: HTMLButtonElement;
    next: HTMLButtonElement;
}

export default function carouselList(
    servicesList: HTMLElement,
    items: NodeListOf<HTMLElement> | HTMLElement[],
    controls: CarouselControls,
): void {
    const totalItems: number = items.length;
    let currentIndex: number = 0;
    let isTransitioning: boolean = false;

    // Добавляем клоны для бесконечной прокрутки
    const clonesPerSide: number = Math.ceil(totalItems);
    for (let i = 0; i < clonesPerSide; i++) {
        const firstClone: HTMLElement = items[i % totalItems].cloneNode(true) as HTMLElement;
        const lastClone: HTMLElement = items[(totalItems - 1 - i) % totalItems].cloneNode(true) as HTMLElement;
        servicesList.appendChild(firstClone);
        servicesList.insertBefore(lastClone, servicesList.firstChild);
    }

    const updatedItems: NodeListOf<HTMLElement> = servicesList.querySelectorAll('.service-item');
    const updatedTotalItems: number = updatedItems.length;

    // Устанавливаем начальную позицию (в середине клонов)
    const itemWidth: number = servicesList.scrollWidth / updatedTotalItems;
    const initialScroll: number = itemWidth * clonesPerSide;
    servicesList.scrollLeft = initialScroll;

    // Функция для прокрутки на одну позицию
    const scrollByOffset = (offset: number): void => {
        if (isTransitioning) return;
        isTransitioning = true;

        const currentScroll: number = servicesList.scrollLeft;
        const targetScroll: number = currentScroll + (offset * itemWidth);
        servicesList.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });
    };

    // Обновление индекса при прокрутке
    const handleScroll = (): void => {
        const scrollPosition: number = servicesList.scrollLeft;
        const scrollIndex: number = scrollPosition / itemWidth;

        // Вычисляем текущий индекс с учётом клонов
        currentIndex = Math.round(scrollIndex - clonesPerSide) % totalItems;
        if (currentIndex < 0) currentIndex += totalItems;

        // Проверяем, близко ли мы к границам клонов
        if (scrollIndex < clonesPerSide - 1 || scrollIndex > clonesPerSide + totalItems) {
            // Мгновенно перемещаем к эквивалентному оригинальному элементу
            const targetIndex: number = currentIndex + clonesPerSide;
            servicesList.scrollLeft = itemWidth * targetIndex;
        } else {
            isTransitioning = false;
        }
    };

    // Обработчик прокрутки
    servicesList.addEventListener('scroll', handleScroll);

    // Переход к следующему элементу
    controls.next.addEventListener('click', () => {
        scrollByOffset(1);
    });

    // Переход к предыдущему элементу
    controls.prev.addEventListener('click', () => {
        scrollByOffset(-1);
    });

    // Отключаем кнопки во время прокрутки
    let isScrolling: NodeJS.Timeout | undefined;
    servicesList.addEventListener('scroll', () => {
        controls.prev.disabled = true;
        controls.next.disabled = true;
        clearTimeout(isScrolling);
        isScrolling = setTimeout(() => {
            controls.prev.disabled = false;
            controls.next.disabled = false;
            isTransitioning = false;
        }, 200);
    });
}