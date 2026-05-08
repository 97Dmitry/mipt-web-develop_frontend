import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { ApiErrorPayload, CreateOrderInput, Order } from '../../types/domain';
import * as ordersApi from '../../api/orders';
import { ApiError } from '../../api/client';

export type OrderLoadStatus = 'idle' | 'loading' | 'success' | 'error' | 'notFound';
export type OrderCreateStatus = 'idle' | 'submitting' | 'success' | 'error';

interface OrderState {
  current: Order | null;
  status: OrderLoadStatus;
  error: ApiErrorPayload | null;
  createStatus: OrderCreateStatus;
  createError: ApiErrorPayload | null;
}

const initialState: OrderState = {
  current: null,
  status: 'idle',
  error: null,
  createStatus: 'idle',
  createError: null,
};

function toErrorPayload(err: unknown): ApiErrorPayload {
  if (err instanceof ApiError) return err.toPayload();
  if (err instanceof Error) return { code: 'UNKNOWN_ERROR', message: err.message };
  return { code: 'UNKNOWN_ERROR', message: 'Неизвестная ошибка' };
}

export const createOrder = createAsyncThunk<
  Order,
  CreateOrderInput,
  { rejectValue: ApiErrorPayload }
>('order/create', async (input, { rejectWithValue, signal }) => {
  try {
    return await ordersApi.createOrder(input, signal);
  } catch (err) {
    return rejectWithValue(toErrorPayload(err));
  }
});

export const fetchOrderById = createAsyncThunk<
  Order,
  number,
  { rejectValue: ApiErrorPayload }
>('order/fetchById', async (id, { rejectWithValue, signal }) => {
  try {
    return await ordersApi.fetchOrderById(id, signal);
  } catch (err) {
    return rejectWithValue(toErrorPayload(err));
  }
});

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    resetCreateStatus(state) {
      state.createStatus = 'idle';
      state.createError = null;
    },
    clearCurrentOrder(state) {
      state.current = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.createStatus = 'submitting';
        state.createError = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.createStatus = 'success';
        state.current = action.payload;
        state.status = 'success';
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.createStatus = 'error';
        state.createError = action.payload ?? { code: 'UNKNOWN', message: 'Не удалось оформить заказ' };
      });

    builder
      .addCase(fetchOrderById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.status = 'success';
        state.current = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        if (action.meta.aborted) return;
        const payload = action.payload;
        if (payload?.code === 'ORDER_NOT_FOUND') {
          state.status = 'notFound';
        } else {
          state.status = 'error';
        }
        state.error = payload ?? { code: 'UNKNOWN', message: 'Не удалось загрузить заказ' };
      });
  },
});

export const { resetCreateStatus, clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
