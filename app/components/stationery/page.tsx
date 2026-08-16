import ProductCard from "./../../components/ProductCard";
import { Product } from "./../../types/product";



const products: Product[] = [
  { id: 1, name: "فلیش", image:"/flash.png" },
//   { id: 2, name: "پاکستان سیمنٹ", price: getRandomPrice(1050, 1230), image:"pk.png" },
  { id: 2, name: "پائپ",  image:"/pahap.png" },

  { id: 3, name: "P-Trap",  image:"/P-trap.png" },
  { id: 4, name: "پلاسٹک جالی",  image: "/plastic.png" },
   { id: 5, name: "سٹیل جالی", image:"/steel.png" },
  { id: 6, name: "سلوشن" , image:"/saloion.png" },
  { id: 7, name: "ساکٹ", image:"/sakat.png" },
  { id: 8, name: "ال بو", image:"/al.png" },
  { id: 9, name: "ٹی", image:"/T.png" },
];

export default function Products() {
  return (
    <>
    
    <div className="container mx-auto py-12 px-4">
   

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
    </>
  );
}