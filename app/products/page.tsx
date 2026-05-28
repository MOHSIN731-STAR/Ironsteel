import ProductCard from "./../components/ProductCard";
import { Product } from "./../types/product";



const products: Product[] = [
  { id: 1, name: "DGسیمنٹ", image:"/DGسیمنٹ.png" },

  { id: 2, name: "پاکستان سیمنٹ",  image:"/pk.png" },

  { id: 3, name: "70×70 ٹی یار",  image:"/70×70 ٹی یار.png" },
  { id: 4, name: "75×75 ٹی یار",  image: "/70×70 ٹی یار.png" },
   { id: 5, name: "گاڈرمغل", image:"/گاڈرمغل.png" },
  { id: 6, name: "ٹائل 10انچ والی" , image:"/ٹائل 10انچ والی.png" },
  { id: 7, name: "ٹائل فٹ والی", image:"/ٹائل فٹ والی.png" },
  { id: 8, name: "سپریم سریا", image:"/سپریم سریا.png" },
  { id: 9, name: "MOIZ سریا", image:"/سپریم سریا.png" },
  { id: 10, name: "تار", image:"/tar.png" },
  { id: 11, name: "پانی پائپ", image:"/water_pipe.jpeg" },
  { id: 12, name: "بالٹی", image:"/bati.jpeg" },
  { id: 13, name: "ڈبہ", image:"/daba.jpeg" },

];

export default function Products() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-10 text-center">Construction Materials</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}