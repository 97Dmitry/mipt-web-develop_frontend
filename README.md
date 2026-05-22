# Лампочки — frontend интернет-магазина

Учебный проект по курсу веб-разработки (МФТИ, ДЗ №4 + ДЗ №5). Приложение содержит:

- пользовательскую витрину интернет-магазина (каталог, корзина, checkout);
- админ-панель с JWT-авторизацией (`/admin/*`) для управления товарами и заказами.

## Стек

- **Vite** + **React 19** + **TypeScript**
- **React Router DOM v7** — клиентский роутинг
- **Redux Toolkit** + **react-redux** — глобальное состояние (товары, корзина, заказы)
- **fetch** — HTTP-запросы к двум backend-сервисам
- **CSS Modules** — изолированные стили компонентов
- **ESLint** — статический анализ

## Backend

Бэкенд лежит в соседнем репозитории `~/mipt/web-develop` (FastAPI + PostgreSQL):

- **product-service** на `http://localhost:3001`:
  - storefront: `/public/categories`, `/public/products`, `/public/products/{id}`;
  - admin (JWT): `/categories`, `/products`, `/products/{id}`, `/products/{id}/stock`.
- **order-service** на `http://localhost:3002`:
  - auth: `/auth/login`, `/auth/me`, `/auth/logout`;
  - storefront: `/cart/{sessionId}/*`, `/orders`, `/orders/{id}`;
  - admin (JWT): `/admin/orders`, `/admin/orders/{id}`, `/admin/orders/{id}/status`.

Перед запуском frontend подними backend: `cd ~/mipt/web-develop && docker compose up -d`.

## Конфигурация

Базовые URL берутся из переменных окружения Vite. Скопируй `.env.example` в `.env.local` и при необходимости подправь:

```
VITE_PRODUCT_API_URL=http://localhost:3001
VITE_ORDER_API_URL=http://localhost:3002
```

## Структура

```
src/
├── main.tsx, App.tsx          # точка входа, Provider, маршруты, loadCart на mount
├── types/domain.ts            # доменные типы (Product, Order, CartItemDto, ...)
├── api/
│   ├── client.ts              # fetch-обёртка, ApiError, env-конфиг, Bearer token support
│   ├── products.ts            # storefront GET /public/categories, /public/products, /public/products/{id}
│   ├── cart.ts                # storefront cart endpoints
│   ├── orders.ts              # storefront order endpoints
│   ├── adminAuth.ts           # POST /auth/login, GET /auth/me, POST /auth/logout
│   ├── adminProducts.ts       # admin products CRUD
│   └── adminOrders.ts         # admin orders list/status update
├── admin/                     # AdminAuthProvider, route guard, admin layout
├── store/
│   ├── index.ts, hooks.ts     # configureStore, типизированные useAppDispatch/useAppSelector
│   └── slices/
│       ├── productsSlice.ts   # каталог + категории + currentProduct
│       ├── cartSlice.ts       # зеркало backend-корзины + pendingOps + INSUFFICIENT_STOCK
│       └── orderSlice.ts      # createOrder + fetchOrderById, разделённые createStatus и status
├── pages/                     # 6 страниц
├── components/                # ProductCard, ProductImage (с fallback), фильтры, layout, ui
├── utils/                     # format, validation, storage (только sessionId)
└── styles/                    # global.css, reset.css
```

## Маршруты (storefront)

| Путь                    | Страница                |
|-------------------------|-------------------------|
| `/`                     | Каталог с фильтрами     |
| `/products/:productId`  | Карточка товара         |
| `/cart`                 | Корзина                 |
| `/checkout`             | Оформление заказа       |
| `/orders/:orderId`      | Подтверждение заказа    |
| `*`                     | 404                     |

## Маршруты (admin)

| Путь                       | Страница                            |
|---------------------------|-------------------------------------|
| `/admin/login`            | Вход в админку                      |
| `/admin/products`         | Список товаров + поиск + удаление   |
| `/admin/products/new`     | Создание товара                     |
| `/admin/products/:id/edit`| Редактирование товара               |
| `/admin/orders`           | Список заказов + смена статуса      |

## Команды

```bash
npm install       # первичная установка зависимостей
npm run dev       # dev-сервер на http://localhost:5173
npm run build     # production-сборка (tsc + vite build)
npm run lint      # eslint
npm run preview   # запуск собранной версии
```

## Архитектурные решения

- **Корзина**: backend — единственный источник истины. Каждое действие (`addItem`, `updateItemQty`, `removeItem`, `clearCart`) делает HTTP-запрос и затем перезагружает корзину по `sessionId`. После reload корзина восстанавливается из backend.
- **`sessionId`**: UUID, генерируется один раз и хранится в `localStorage` (`cart_session_id`). Передаётся во все cart/orders запросы.
- **DTO напрямую**: `types/domain.ts` зеркалит backend DTO без промежуточного mapper-слоя — короче, но при изменении API правки идут по всем callsite'ам.
- **Ошибки**: `ApiError` пробрасывается через `rejectWithValue` в slice'ы и оседает в `state.*.error`. Специальная обработка кодов `PRODUCT_NOT_FOUND`, `ORDER_NOT_FOUND`, `INSUFFICIENT_STOCK`, `ADDRESS_REQUIRED`, `EMPTY_CART`.
- **Дублирующая валидация формы checkout**: клиентская проверка как первый барьер, backend — последняя линия (например, `ADDRESS_REQUIRED` маппится обратно на поле адреса).

## Чеклист демонстрации ДЗ5

1. Вход `/admin/login` (`admin / Admin123!`) и получение JWT.
2. CRUD-сценарий по товарам в `/admin/products`.
3. Обновление статуса заказа в `/admin/orders`.
4. Выход из админки и очистка токена.
5. В DevTools Network показать `Authorization: Bearer ...` для admin-запросов.
