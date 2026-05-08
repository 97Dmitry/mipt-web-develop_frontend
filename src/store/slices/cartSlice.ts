import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  ApiErrorPayload,
  CartDto,
  CartItemDto,
  InsufficientStockDetails,
} from '../../types/domain';
import * as cartApi from '../../api/cart';
import { ApiError } from '../../api/client';
import { getOrCreateSessionId } from '../../utils/storage';
import { createOrder } from './orderSlice';

export type CartStatus = 'idle' | 'loading' | 'success' | 'error';

interface CartState {
  sessionId: string;
  items: CartItemDto[] | null;
  total: number;
  status: CartStatus;
  error: ApiErrorPayload | null;
  pendingOps: Record<string, true>;
  insufficientStock: InsufficientStockDetails | null;
}

const initialState: CartState = {
  sessionId: getOrCreateSessionId(),
  items: null,
  total: 0,
  status: 'idle',
  error: null,
  pendingOps: {},
  insufficientStock: null,
};

function toErrorPayload(err: unknown): ApiErrorPayload {
  if (err instanceof ApiError) return err.toPayload();
  if (err instanceof Error) return { code: 'UNKNOWN_ERROR', message: err.message };
  return { code: 'UNKNOWN_ERROR', message: 'Неизвестная ошибка' };
}

interface CartThunkResult {
  cart: CartDto;
}

async function loadCartByApi(sessionId: string, signal?: AbortSignal): Promise<CartThunkResult> {
  const cart = await cartApi.getCart(sessionId, signal);
  return { cart };
}

export const loadCart = createAsyncThunk<
  CartThunkResult,
  void,
  { state: { cart: CartState }; rejectValue: ApiErrorPayload }
>('cart/load', async (_, { getState, rejectWithValue, signal }) => {
  try {
    return await loadCartByApi(getState().cart.sessionId, signal);
  } catch (err) {
    return rejectWithValue(toErrorPayload(err));
  }
});

export const addItem = createAsyncThunk<
  CartThunkResult,
  { productId: number; qty: number },
  { state: { cart: CartState }; rejectValue: ApiErrorPayload }
>('cart/addItem', async ({ productId, qty }, { getState, rejectWithValue, signal }) => {
  const sessionId = getState().cart.sessionId;
  try {
    await cartApi.addCartItem(sessionId, { productId, qty }, signal);
    return await loadCartByApi(sessionId, signal);
  } catch (err) {
    return rejectWithValue(toErrorPayload(err));
  }
});

export const updateItemQty = createAsyncThunk<
  CartThunkResult,
  { itemId: number; qty: number },
  { state: { cart: CartState }; rejectValue: ApiErrorPayload }
>('cart/updateItemQty', async ({ itemId, qty }, { getState, rejectWithValue, signal }) => {
  const sessionId = getState().cart.sessionId;
  try {
    await cartApi.updateCartItem(sessionId, itemId, { qty }, signal);
    return await loadCartByApi(sessionId, signal);
  } catch (err) {
    return rejectWithValue(toErrorPayload(err));
  }
});

export const removeItem = createAsyncThunk<
  CartThunkResult,
  { itemId: number },
  { state: { cart: CartState }; rejectValue: ApiErrorPayload }
>('cart/removeItem', async ({ itemId }, { getState, rejectWithValue, signal }) => {
  const sessionId = getState().cart.sessionId;
  try {
    await cartApi.removeCartItem(sessionId, itemId, signal);
    return await loadCartByApi(sessionId, signal);
  } catch (err) {
    return rejectWithValue(toErrorPayload(err));
  }
});

export const clearCart = createAsyncThunk<
  void,
  void,
  { state: { cart: CartState }; rejectValue: ApiErrorPayload }
>('cart/clear', async (_, { getState, rejectWithValue, signal }) => {
  const sessionId = getState().cart.sessionId;
  try {
    await cartApi.clearCart(sessionId, signal);
  } catch (err) {
    return rejectWithValue(toErrorPayload(err));
  }
});

function applyCart(state: CartState, action: PayloadAction<CartThunkResult>) {
  state.items = action.payload.cart.items;
  state.total = action.payload.cart.total;
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartError(state) {
      state.error = null;
    },
    clearInsufficientStock(state) {
      state.insufficientStock = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCart.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadCart.fulfilled, (state, action) => {
        state.status = 'success';
        applyCart(state, action);
      })
      .addCase(loadCart.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.status = 'error';
        state.error = action.payload ?? { code: 'UNKNOWN', message: 'Не удалось загрузить корзину' };
      });

    const setPending = (state: CartState, key: string) => {
      state.pendingOps[key] = true;
      state.error = null;
      state.insufficientStock = null;
    };
    const clearPending = (state: CartState, key: string) => {
      delete state.pendingOps[key];
    };

    builder
      .addCase(addItem.pending, (state, action) => {
        setPending(state, `add:${action.meta.arg.productId}`);
      })
      .addCase(addItem.fulfilled, (state, action) => {
        clearPending(state, `add:${action.meta.arg.productId}`);
        state.status = 'success';
        applyCart(state, action);
      })
      .addCase(addItem.rejected, (state, action) => {
        clearPending(state, `add:${action.meta.arg.productId}`);
        const payload = action.payload;
        state.error = payload ?? { code: 'UNKNOWN', message: 'Не удалось добавить товар' };
        if (payload?.code === 'INSUFFICIENT_STOCK') {
          const details = payload.details as Partial<InsufficientStockDetails> | undefined;
          state.insufficientStock = {
            productId: action.meta.arg.productId,
            available: details?.available ?? 0,
            requested: details?.requested ?? action.meta.arg.qty,
          };
        }
      });

    builder
      .addCase(updateItemQty.pending, (state, action) => {
        setPending(state, `update:${action.meta.arg.itemId}`);
      })
      .addCase(updateItemQty.fulfilled, (state, action) => {
        clearPending(state, `update:${action.meta.arg.itemId}`);
        applyCart(state, action);
      })
      .addCase(updateItemQty.rejected, (state, action) => {
        clearPending(state, `update:${action.meta.arg.itemId}`);
        const payload = action.payload;
        state.error = payload ?? { code: 'UNKNOWN', message: 'Не удалось обновить количество' };
        if (payload?.code === 'INSUFFICIENT_STOCK') {
          const details = payload.details as Partial<InsufficientStockDetails> | undefined;
          state.insufficientStock = {
            available: details?.available ?? 0,
            requested: details?.requested ?? action.meta.arg.qty,
          };
        }
      });

    builder
      .addCase(removeItem.pending, (state, action) => {
        setPending(state, `remove:${action.meta.arg.itemId}`);
      })
      .addCase(removeItem.fulfilled, (state, action) => {
        clearPending(state, `remove:${action.meta.arg.itemId}`);
        applyCart(state, action);
      })
      .addCase(removeItem.rejected, (state, action) => {
        clearPending(state, `remove:${action.meta.arg.itemId}`);
        state.error = action.payload ?? { code: 'UNKNOWN', message: 'Не удалось удалить товар' };
      });

    builder
      .addCase(clearCart.pending, (state) => {
        setPending(state, 'clear');
      })
      .addCase(clearCart.fulfilled, (state) => {
        clearPending(state, 'clear');
        state.items = [];
        state.total = 0;
      })
      .addCase(clearCart.rejected, (state, action) => {
        clearPending(state, 'clear');
        state.error = action.payload ?? { code: 'UNKNOWN', message: 'Не удалось очистить корзину' };
      });

    builder.addCase(createOrder.fulfilled, (state) => {
      state.items = [];
      state.total = 0;
      state.error = null;
      state.insufficientStock = null;
    });
  },
});

export const { clearCartError, clearInsufficientStock } = cartSlice.actions;
export default cartSlice.reducer;
