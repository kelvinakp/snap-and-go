import { create } from 'zustand';

export type Step =
  | 'home'
  | 'camera'
  | 'post-scan'
  | 'cart'
  | 'payment'
  | 'upload'
  | 'success';

export interface CartItem {
  id: string;
  yolo_class_name: string;
  display_name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface Receipt {
  totalPaid: number;
  transactionId: string;
  timestamp: string;
  itemCount: number;
}

interface CartState {
  step: Step;
  cartItems: CartItem[];
  lastReceipt: Receipt | null;
  setStep: (step: Step) => void;
  addItemsToCart: (newItems: CartItem[]) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  setReceipt: (receipt: Receipt) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  step: 'camera',
  cartItems: [],
  lastReceipt: null,
  setStep: (step) => set({ step }),
  addItemsToCart: (newItems) =>
    set((state) => {
      const updatedItems = [...state.cartItems];
      newItems.forEach((newItem) => {
        const existingIndex = updatedItems.findIndex((item) => item.id === newItem.id);
        if (existingIndex !== -1) {
          updatedItems[existingIndex].quantity += newItem.quantity;
        } else {
          updatedItems.push(newItem);
        }
      });
      return { cartItems: updatedItems };
    }),
  updateQuantity: (id, delta) =>
    set((state) => {
      const updatedItems = state.cartItems
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0);
      return { cartItems: updatedItems };
    }),
  removeItem: (id) =>
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.id !== id),
    })),
  setReceipt: (receipt) => set({ lastReceipt: receipt }),
  clearCart: () => set({ cartItems: [], step: 'camera', lastReceipt: null }),
}));
