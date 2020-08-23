import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
// import { loadOptions } from '@babel/core';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const loadedProds = await AsyncStorage.getItem('@GoMarket:products');

      if (loadedProds) {
        setProducts([...JSON.parse(loadedProds)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const prodExists = products.find(prod => prod.id === product.id);

      if (prodExists) {
        setProducts(
          products.map(prod =>
            prod.id === product.id
              ? { ...product, quantity: prod.quantity + 1 }
              : prod,
          ),
        );
      } else {
        setProducts(prod => [...prod, { ...product, quantity: 1 }]);
      }
      await AsyncStorage.setItem(
        '@GoMarket:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(prod =>
          prod.id === id ? { ...prod, quantity: prod.quantity + 1 } : prod,
        ),
      );

      await AsyncStorage.setItem(
        '@GoMarket:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const prodFiltered = products.filter(prod => prod.id === id);
      const qty = prodFiltered[0].quantity;
      // Se a quantidade for = 1, entao deleta do carrinho
      if (qty > 1) {
        setProducts(
          products.map(prod =>
            prod.id === id ? { ...prod, quantity: prod.quantity - 1 } : prod,
          ),
        );
      } else {
        setProducts(products.filter(prod => prod.id !== id));
      }
      await AsyncStorage.setItem(
        '@GoMarket:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
