export interface Product {
  id: number;
  name: string;

  image: string;
}

export interface CartItem extends Product {
  quantity: number;
}