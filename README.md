# Лампочки — frontend интернет-магазина

Учебный проект по курсу веб-разработки (МФТИ, ДЗ №4). Пользовательская часть интернет-магазина светодиодных и других ламп: каталог, карточка товара, корзина, оформление заказа. Состояние управляется через Redux Toolkit, данные приходят с реальных backend-микросервисов.

## Стек

- **Vite** + **React 19** + **TypeScript**
- **React Router DOM v7** — клиентский роутинг
- **Redux Toolkit** + **react-redux** — глобальное состояние (товары, корзина, заказы)
- **fetch** — HTTP-запросы к двум backend-сервисам
- **CSS Modules** — изолированные стили компонентов
- **ESLint** — статический анализ

## Backend

Бэкенд лежит в соседнем репозитории `~/mipt/web-develop` (FastAPI + PostgreSQL):

- **product-service** на `http://localhost:3001` — категории и товары (`/categories`, `/products`, `/products/{id}`).
- **order-service** на `http://localhost:3002` — гостевая корзина по `sessionId` (`/cart/{sessionId}`, `/cart/{sessionId}/items`, …) и заказы (`/orders`, `/orders/{id}`).

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
│   ├── client.ts              # fetch-обёртка, ApiError, env-конфиг
│   ├── products.ts            # GET /categories, /products, /products/{id}
│   ├── cart.ts                # GET/POST/PATCH/DELETE /cart/{sessionId}/...
│   └── orders.ts              # POST /orders, GET /orders/{id}
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

## Маршруты

| Путь                    | Страница                |
|-------------------------|-------------------------|
| `/`                     | Каталог с фильтрами     |
| `/products/:productId`  | Карточка товара         |
| `/cart`                 | Корзина                 |
| `/checkout`             | Оформление заказа       |
| `/orders/:orderId`      | Подтверждение заказа    |
| `*`                     | 404                     |

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

## Что не сделано (и почему)

- **Админ-панель** — вне условия ДЗ.
- **Авторизация** — клиентская часть гостевая, токены не требуются.
- **Тесты** — не требуются по ДЗ; функциональность проверяется ручным e2e-обходом.
