import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { UserContext } from "./UserContext";

type ProductLike = {
  pid?: number | string;
  title?: string;
  price?: number | string;
  sale_price?: number | string;
  sku?: string;
  primaryImageURL?: string;
  images?: Array<{ image_url?: string }>;
};

type CartItem = {
  productId: string;
  title: string;
  unitPrice: number;
  quantity: number;
  sku: string;
  imageUrl: string;
};

type CartContextValue = {
  tenantKey: string;
  items: CartItem[];
  isHydrated: boolean;
  totalItemCount: number;
  totalCost: number;
  addToCart: (product: ProductLike, quantity?: number) => number;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_STORAGE_PREFIX = "classy_fit_cart_v1:";

const parseMoneyValue = (value: number | string | undefined): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const normalized = String(value ?? "")
    .replace(/[^0-9.-]/g, "")
    .trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getTenantKey = (user: any): string => {
  const gymId = String(user?.gym_id ?? "unknown-gym");
  const userId = String(user?.sub ?? user?.uid ?? user?.id ?? "anonymous");
  return `${gymId}:${userId}`;
};

const getProductId = (product: ProductLike): string => {
  return String(product?.pid ?? "");
};

const buildCartItem = (product: ProductLike): CartItem => {
  const productId = getProductId(product);
  const salePrice = parseMoneyValue(product?.sale_price);
  const regularPrice = parseMoneyValue(product?.price);
  const unitPrice =
    salePrice > 0 && salePrice < regularPrice ? salePrice : regularPrice;
  const firstImage = product?.images?.[0]?.image_url ?? "";

  return {
    productId,
    title: String(product?.title ?? "Product"),
    unitPrice,
    quantity: 0,
    sku: String(product?.sku ?? "-"),
    imageUrl: String(product?.primaryImageURL ?? firstImage),
  };
};

const getStorageKey = (tenantKey: string): string =>
  `${CART_STORAGE_PREFIX}${tenantKey}`;

const normalizeStoredItems = (value: unknown): CartItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const typedItem = item as Partial<CartItem>;
      const productId = String(typedItem.productId ?? "").trim();
      const quantity = Number(typedItem.quantity ?? 0);

      if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
        return null;
      }

      return {
        productId,
        title: String(typedItem.title ?? "Product"),
        unitPrice: parseMoneyValue(typedItem.unitPrice),
        quantity,
        sku: String(typedItem.sku ?? "-"),
        imageUrl: String(typedItem.imageUrl ?? ""),
      } satisfies CartItem;
    })
    .filter((item): item is CartItem => item !== null);
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useContext(UserContext);
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const tenantKey = getTenantKey(user);

  useEffect(() => {
    let isCancelled = false;
    setIsHydrated(false);

    const loadStoredCart = async () => {
      try {
        const serializedItems = await AsyncStorage.getItem(
          getStorageKey(tenantKey),
        );
        if (isCancelled) return;

        if (!serializedItems) {
          setItems([]);
        } else {
          const parsedItems = JSON.parse(serializedItems);
          setItems(normalizeStoredItems(parsedItems));
        }
      } catch (error) {
        console.log("Failed to load cart from storage:", error);
        if (!isCancelled) {
          setItems([]);
        }
      } finally {
        if (!isCancelled) {
          setIsHydrated(true);
        }
      }
    };

    loadStoredCart();

    return () => {
      isCancelled = true;
    };
  }, [tenantKey]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const persistCart = async () => {
      try {
        await AsyncStorage.setItem(
          getStorageKey(tenantKey),
          JSON.stringify(items),
        );
      } catch (error) {
        console.log("Failed to persist cart to storage:", error);
      }
    };

    persistCart();
  }, [isHydrated, items, tenantKey]);

  const addToCart = (product: ProductLike, quantity = 1): number => {
    const productId = getProductId(product);
    if (!productId) {
      throw new Error("Cannot add product without product id (pid) to cart.");
    }
    const normalizedQuantity = Number(quantity);
    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
      throw new Error("Quantity must be a positive number.");
    }

    let updatedLineQuantity = normalizedQuantity;
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.productId === productId,
      );

      let updatedItems: CartItem[] = [];
      if (existingItem) {
        updatedItems = prevItems.map((item) => {
          if (item.productId !== productId) return item;
          const nextQuantity = item.quantity + normalizedQuantity;
          updatedLineQuantity = nextQuantity;
          return {
            ...item,
            quantity: nextQuantity,
          };
        });
      } else {
        const cartItem = buildCartItem(product);
        cartItem.quantity = normalizedQuantity;
        updatedLineQuantity = normalizedQuantity;
        updatedItems = [...prevItems, cartItem];
      }

      return updatedItems;
    });

    return updatedLineQuantity;
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const normalizedQuantity = Number(quantity);
    if (!Number.isFinite(normalizedQuantity)) {
      throw new Error("Quantity must be a valid number.");
    }

    setItems((prevItems) => {
      const nextItems = prevItems
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, normalizedQuantity) }
            : item,
        )
        .filter((item) => item.quantity > 0);

      return nextItems;
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => item.productId !== productId),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );
  const totalCost = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      tenantKey,
      items,
      isHydrated,
      totalItemCount,
      totalCost,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [isHydrated, items, tenantKey, totalItemCount, totalCost],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }
  return context;
};
