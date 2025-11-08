import { useState } from "react";
import { Grid, List, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertyCard from "./PropertyCard";
import property1 from "@/assets/property1.jpg";
import property2 from "@/assets/property2.jpg";
import property3 from "@/assets/property3.jpg";

const PropertyListings = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const properties = [
    {
      id: "1",
      image: property1,
      title: "Шинэ орон сууц Сүхбаатар дүүрэгт",
      price: "450,000,000₮",
      location: "Сүхбаатар дүүрэг, 1-р хороо",
      beds: 3,
      baths: 2,
      area: "85 м²",
      type: "sale" as const,
    },
    {
      id: "2", 
      image: property2,
      title: "Тансаг байшин хашаатай",
      price: "15,000₮/сар",
      location: "Чингэлтэй дүүрэг, 5-р хороо", 
      beds: 4,
      baths: 3,
      area: "120 м²",
      type: "rent" as const,
    },
    {
      id: "3",
      image: property3, 
      title: "Тансаг вилла уулын дэргэд",
      price: "850,000,000₮",
      location: "Багануур дүүрэг, Зайсан",
      beds: 5,
      baths: 4,
      area: "280 м²", 
      type: "sale" as const,
    },
    {
      id: "4",
      image: property1,
      title: "2 өрөө орон сууц төв хэсэгт",
      price: "8,500₮/сар",
      location: "Баyanзүрх дүүрэг, 3-р хороо",
      beds: 2,
      baths: 1,
      area: "65 м²",
      type: "rent" as const,
    },
    {
      id: "5",
      image: property2,
      title: "Гэр бүлийн байшин хашаатай",
      price: "320,000,000₮", 
      location: "Хан-Уул дүүрэг, 4-р хороо",
      beds: 3,
      baths: 2,
      area: "95 м²",
      type: "sale" as const,
    },
    {
      id: "6",
      image: property3,
      title: "Шинэ барилгын пентхаус",
      price: "25,000₮/сар",
      location: "Сүхбаатар дүүрэг, төв хэсэг",
      beds: 4,
      baths: 3,
      area: "150 м²",
      type: "rent" as const,
    },
  ];

  return (
    <section className="py-16 warm-gradient">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Шинэ зарууд
            </h2>
            <p className="text-muted-foreground">
              {properties.length} үл хөдлөх хөрөнгө олдлоо
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Шүүх
            </Button>
            
            <div className="flex border border-border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Property Grid */}
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "flex flex-col gap-4"
        }>
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              {...property}
            />
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" className="px-8">
            Илүү олон зар харах
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PropertyListings;