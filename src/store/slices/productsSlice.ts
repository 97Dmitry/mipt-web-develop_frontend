import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  ApiErrorPayload,
  Category,
  PageMeta,
  Product,
  ProductFiltersQuery,
} from '../../types/domain';
import * as productsApi from '../../api/products';
import { ApiError } from '../../api/client';
import type { RootState } from '../index';

export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';
export type ProductDetailStatus = LoadStatus | 'notFound';

interface ProductsState {
  list: Product[];
  listMeta: PageMeta | null;
  listStatus: LoadStatus;
  listError: ApiErrorPayload | null;

  categories: Category[];
  categoriesStatus: LoadStatus;
  categoriesError: ApiErrorPayload | null;

  currentProduct: Product | null;
  currentProductId: number | null;
  currentProductStatus: ProductDetailStatus;
  currentProductError: ApiErrorPayload | null;
}

const initialState: ProductsState = {
  list: [],
  listMeta: null,
  listStatus: 'idle',
  listError: null,
  categories: [],
  categoriesStatus: 'idle',
  categoriesError: null,
  currentProduct: null,
  currentProductId: null,
  currentProductStatus: 'idle',
  currentProductError: null,
};

function toErrorPayload(err: unknown): ApiErrorPayload {
  if (err instanceof ApiError) return err.toPayload();
  if (err instanceof Error) return { code: 'UNKNOWN_ERROR', message: err.message };
  return { code: 'UNKNOWN_ERROR', message: 'Неизвестная ошибка' };
}

export const fetchCategories = createAsyncThunk<
  Category[],
  void,
  { state: RootState; rejectValue: ApiErrorPayload }
>('products/fetchCategories', async (_, { rejectWithValue, signal }) => {
  try {
    return await productsApi.fetchCategories(signal);
  } catch (err) {
    return rejectWithValue(toErrorPayload(err));
  }
}, {
  condition: (_, { getState }) => {
    const status = getState().products.categoriesStatus;
    return status !== 'loading' && status !== 'success';
  },
});

export const fetchProducts = createAsyncThunk<
  productsApi.ProductsListResult,
  ProductFiltersQuery,
  { rejectValue: ApiErrorPayload }
>('products/fetchProducts', async (filters, { rejectWithValue, signal }) => {
  try {
    return await productsApi.fetchProducts(filters, signal);
  } catch (err) {
    return rejectWithValue(toErrorPayload(err));
  }
});

export const fetchProductById = createAsyncThunk<
  Product,
  number,
  { rejectValue: ApiErrorPayload }
>('products/fetchProductById', async (id, { rejectWithValue, signal }) => {
  try {
    return await productsApi.fetchProductById(id, signal);
  } catch (err) {
    return rejectWithValue(toErrorPayload(err));
  }
});

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearCurrentProduct(state) {
      state.currentProduct = null;
      state.currentProductId = null;
      state.currentProductStatus = 'idle';
      state.currentProductError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.categoriesStatus = 'loading';
        state.categoriesError = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categoriesStatus = 'success';
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categoriesStatus = 'error';
        state.categoriesError = action.payload ?? { code: 'UNKNOWN', message: 'Ошибка загрузки' };
      });

    builder
      .addCase(fetchProducts.pending, (state) => {
        state.listStatus = 'loading';
        state.listError = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.listStatus = 'success';
        state.list = action.payload.items;
        state.listMeta = action.payload.meta;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.listStatus = 'error';
        state.listError = action.payload ?? { code: 'UNKNOWN', message: 'Ошибка загрузки' };
      });

    builder
      .addCase(fetchProductById.pending, (state, action) => {
        state.currentProductStatus = 'loading';
        state.currentProduct = null;
        state.currentProductId = action.meta.arg;
        state.currentProductError = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action: PayloadAction<Product>) => {
        state.currentProductStatus = 'success';
        state.currentProduct = action.payload;
        state.currentProductId = action.payload.id;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        if (action.meta.aborted) return;
        const payload = action.payload;
        if (payload && payload.code === 'PRODUCT_NOT_FOUND') {
          state.currentProductStatus = 'notFound';
        } else {
          state.currentProductStatus = 'error';
        }
        state.currentProductError = payload ?? { code: 'UNKNOWN', message: 'Ошибка загрузки' };
      });
  },
});

export const { clearCurrentProduct } = productsSlice.actions;
export default productsSlice.reducer;
