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
const CART_STORAGE_KEY = "classy_fit_cart_by_tenant_v1";

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

const toValidCartItem = (value: unknown): CartItem | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Partial<CartItem>;
  const productId = String(item.productId ?? "").trim();
  const quantity = Number(item.quantity ?? 0);
  const unitPrice = Number(item.unitPrice ?? 0);

  if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
    return null;
  }

  return {
    productId,
    title: String(item.title ?? "Product"),
    unitPrice: Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : 0,
    quantity,
    sku: String(item.sku ?? "-"),
    imageUrl: String(item.imageUrl ?? ""),
  };
};

const sanitizeCartByTenant = (
  value: unknown,
): Record<string, CartItem[]> => {
  if (!value || typeof value !== "object") {
    return {};
  }

  const rawMap = value as Record<string, unknown>;
  return Object.entries(rawMap).reduce<Record<string, CartItem[]>>(
    (acc, [key, items]) => {
      if (!Array.isArray(items)) {
        return acc;
      }

      const validItems = items
        .map((item) => toValidCartItem(item))
        .filter((item): item is CartItem => item !== null);

      if (validItems.length > 0) {
        acc[key] = validItems;
      }

      return acc;
    },
    {},
  );
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useContext(UserContext);
  const [cartByTenant, setCartByTenant] = useState<Record<string, CartItem[]>>(
    {},
  );
  const [isHydrated, setIsHydrated] = useState(false);

  const tenantKey = getTenantKey(user);
  const items = cartByTenant[tenantKey] ?? [];

  useEffect(() => {
    let isMounted = true;

    const loadStoredCart = async () => {
      try {
        const serializedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);

        if (!isMounted) {
          return;
        }

        if (!serializedCart) {
          setIsHydrated(true);
          return;
        }

        const parsedCart = JSON.parse(serializedCart);
        setCartByTenant(sanitizeCartByTenant(parsedCart));
      } catch (error) {
        console.log("Failed to load cart from storage:", error);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    loadStoredCart();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const persistCart = async () => {
      try {
        await AsyncStorage.setItem(
          CART_STORAGE_KEY,
          JSON.stringify(cartByTenant),
        );
      } catch (error) {
        console.log("Failed to persist cart to storage:", error);
      }
    };

    persistCart();
  }, [cartByTenant, isHydrated]);

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
    setCartByTenant((prevState) => {
      const tenantItems = prevState[tenantKey] ?? [];
      const existingItem = tenantItems.find(
        (item) => item.productId === productId,
      );

      let updatedItems: CartItem[] = [];
      if (existingItem) {
        updatedItems = tenantItems.map((item) => {
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
        updatedItems = [...tenantItems, cartItem];
      }

      return {
        ...prevState,
        [tenantKey]: updatedItems,
      };
    });

    return updatedLineQuantity;
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const normalizedQuantity = Number(quantity);
    if (!Number.isFinite(normalizedQuantity)) {
      throw new Error("Quantity must be a valid number.");
    }

    setCartByTenant((prevState) => {
      const tenantItems = prevState[tenantKey] ?? [];
      const nextItems = tenantItems
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, normalizedQuantity) }
            : item,
        )
        .filter((item) => item.quantity > 0);

      return {
        ...prevState,
        [tenantKey]: nextItems,
      };
    });
  };

  const removeFromCart = (productId: string) => {
    setCartByTenant((prevState) => {
      const tenantItems = prevState[tenantKey] ?? [];
      return {
        ...prevState,
        [tenantKey]: tenantItems.filter((item) => item.productId !== productId),
      };
    });
  };

  const clearCart = () => {
    setCartByTenant((prevState) => ({
      ...prevState,
      [tenantKey]: [],
    }));
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
