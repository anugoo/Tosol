// src/components/PropertyListings.tsx
import { useState, useEffect } from "react";
import { Grid, List, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertyCard from "./PropertyCard";
import { sendRequest } from "@/utils/api";

// === API ТӨРӨЛ ===
interface ZarImage {
  zurag_id: number;
  image_path: string;
  sort_order: number;
}

interface Zar {
  zid: number;
  uid: number;
  user_email: string;
  z_title: string;
  type_name: string;
  status_name: string;
  z_price: string;
  hot_name: string;
  district_name: string;
  z_address: string;
  z_rooms: number | null;
  z_bathroom: number | null;
  z_balcony: number | null;
  z_m2: string;
  z_floor: string | null;
  hiits_name: string | null;
  z_description: string | null;
  z_isactive: boolean;
  images: ZarImage[];
}

interface FormattedProperty {
  id: string;
  image: string;
  title: string;
  price: string;
  location: string;
  beds: number;
  baths: number;
  area: string;
  type: "sale" | "rent";
}

// === API URL ===
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/user/";

const PropertyListings = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [properties, setProperties] = useState<FormattedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // === ЗАР АВАХ ===
  useEffect(() => {
    const fetchProperties = async () => {
      if (!hasMore && page > 1) return;

      try {
        setLoading(true);
        const response = await sendRequest<{ data: Zar[] }>(API_URL, "POST", {
          action: "getzar",
          page: page,
          limit: 9,
        });

        if (response.resultCode === 7005 && response.data) {
          const formatted = response.data.map(formatProperty);
          setProperties((prev) =>
            page === 1 ? formatted : [...prev, ...formatted]
          );
          setHasMore(response.data.length === 9);
        } else {
          setError(response.resultMessage || "Өгөгдөл ирсэнгүй");
        }
      } catch (err: any) {
        setError(err.message || "Сервертэй холбогдоход алдаа гарлаа");
        console.error("Property fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [page]);

  // === ФОРМАТЛАХ ===
  const formatProperty = (p: Zar): FormattedProperty => {
    const isRent = /түрээс|rent|түрээслэх/i.test(p.status_name);
    const priceNum = Number(p.z_price) || 0;
    const price = isRent
      ? `${priceNum.toLocaleString()}₮/сар`
      : `${priceNum.toLocaleString()}₮`;

    // --- Зураг шалгах хэсэг ---
    let image = "/placeholder.jpg";
    const img = p.images?.[0]?.image_path || "";

    if (img) {
      if (img.startsWith("data:image")) {
        // Аль хэдийн base64 prefix-тэй бол шууд харуулна
        image = img;
      } else if (/^[A-Za-z0-9+/=]+$/.test(img.slice(0, 100))) {
        // Хэрэв цэвэр base64 өгөгдөл бол prefix нэмнэ
        image = `data:image/jpeg;base64,${img}`;
      } else {
        // URL зам бол media URL нэмнэ
        image = `${import.meta.env.VITE_MEDIA_URL || "http://127.0.0.1:8000"}${img}`;
      }
    }

    return {
      id: p.zid.toString(),
      image,
      title: p.z_title,
      price,
      location: `${p.district_name}${p.z_address ? ", " + p.z_address : ""}`,
      beds: p.z_rooms || 0,
      baths: p.z_bathroom || 0,
      area: `${p.z_m2} м²`,
      type: isRent ? "rent" : "sale",
    };
  };

  // === ИЛҮҮ АЧААЛАХ ===
  const loadMore = () => {
    if (hasMore && !loading) {
      setPage((p) => p + 1);
    }
  };

  // === LOADING ===
  if (loading && page === 1) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Зар уншиж байна...</p>
        </div>
      </section>
    );
  }

  // === АЛДАА ===
  if (error && page === 1) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Дахин оролдох
          </Button>
        </div>
      </section>
    );
  }

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
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Шүүх
            </Button>

            <div className="flex border border-border rounded-lg">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Properties */}
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "flex flex-col gap-4"
          }
        >
          {properties.map((property) => (
            <PropertyCard key={property.id} {...property} />
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="text-center mt-12">
            <Button
              onClick={loadMore}
              disabled={loading}
              variant="outline"
              size="lg"
              className="px-8"
            >
              {loading ? "Ачаалж байна..." : "Илүү олон зар харах"}
            </Button>
          </div>
        )}

        {/* Хоосон бол */}
        {!loading && properties.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            Зар олдсонгүй
          </div>
        )}
      </div>
    </section>
  );
};

export default PropertyListings;
