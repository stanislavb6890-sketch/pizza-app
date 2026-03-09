export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🍕</span>
              <span className="text-xl font-bold">Pizza Delivery</span>
            </div>
            <p className="text-gray-400 text-sm max-w-md">
              Быстрая доставка горячей пиццы прямо к вашей двери. 
              Используем только свежие ингредиенты и традиционные рецепты.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Контакты
            </h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>📞 +7 (999) 000-00-00</li>
              <li>📧 info@pizzadelivery.ru</li>
              <li>📍 Москва, ул. Примерная, 1</li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              Время работы
            </h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Пн-Пт: 10:00 - 23:00</li>
              <li>Сб-Вс: 11:00 - 00:00</li>
              <li>Доставка: круглосуточно</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Pizza Delivery. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
