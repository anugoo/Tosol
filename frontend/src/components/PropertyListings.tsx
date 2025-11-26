// src/components/PropertyListings.tsx
import { useState, useEffect } from "react";
import { Grid, List, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertyCard from "./PropertyCard";
import { sendRequest } from "@/utils/api";
import { useSearch } from "@/context/SearchContext";

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
  type: "sale" | "rent" | "preorder";
}

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/user/";

const PropertyListings = () => {
  const { searchParams, lastTrigger } = useSearch();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [properties, setProperties] = useState<FormattedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const isSearchMode = Object.keys(searchParams).length > 0;

  useEffect(() => {
    const fetchProperties = async () => {
      if (!hasMore && page > 1) return;

      try {
        setLoading(page === 1);

        const payload: any = isSearchMode
          ? { action: "search_zar", page, per_page: 9, ...searchParams }
          : { action: "getzar", page, limit: 9 };

        const response = await sendRequest<any>(API_URL, "POST", payload);

        // resultCode 7005 эсвэл 7014 → амжилттай гэж үзнэ
        if (
          (response.resultCode === 7005 || response.resultCode === 7014) &&
          (response.data || response.data?.items)
        ) {
          // Ямар ч форматтай ирсэн data-г зөв авна (items массив, эсвэл шууд массив)
          const rawItems = isSearchMode
            ? Array.isArray(response.data)
              ? response.data
              : Array.isArray(response.data?.items)
              ? response.data.items
              : response.data?.items && typeof response.data.items === "object" && response.data.items !== null
              ? Object.values(response.data.items)
              : []
            : Array.isArray(response.data)
            ? response.data
            : [];

          // Хоосон үр дүн бол
          if (rawItems.length === 0 && page === 1) {
            setProperties([]);
            setHasMore(false);
            setLoading(false);
            return;
          }

          const formatted = rawItems.map((item: any): FormattedProperty => {
            // search_zar-аас ирэх үед (zid, title, price, cover гэх мэт)
            if (isSearchMode || item.cover) {
              const priceNum = Number(item.price || item.z_price || 0);
              const status = (searchParams.status || "").toString();
              const isRent = status === "2" || /түрээс|rent/i.test(item.status_name || "");
              const isPreorder = status === "3" || /урьдчилсан|preorder/i.test(item.status_name || "");

              return {
                id: String(item.zid || item.id),
                image: item.cover?.startsWith("data:image")
                  ? item.cover
                  : item.cover
                  ? `data:image/jpeg;base64,${item.cover}`
                  : "/placeholder.jpg",
                title: item.title || item.z_title || "Гарчиггүй зар",
                price: isRent
                  ? `${priceNum.toLocaleString()}₮/сар`
                  : isPreorder
                  ? `${priceNum.toLocaleString()}₮/м²`
                  : `${priceNum.toLocaleString()}₮`,
                location: `${item.city || item.hot_name || ""} • ${item.district || item.district_name || ""}`,
                beds: Number(item.rooms || item.z_rooms || 0),
                baths: Number(item.z_bathroom || 1),
                area: `${item.m2 || item.z_m2 || 0} м²`,
                type: isRent ? "rent" : isPreorder ? "preorder" : "sale",
              };
            }

            // getzar-аас ирэх үед (хуучин бүтэц)
            const p = item as Zar;
            const status = (p.status_name || "").toLowerCase();
            const isRent = /түрээс|rent/i.test(status);
            const isPreorder = /урьдчилсан|preorder/i.test(status);
            const type: "sale" | "rent" | "preorder" = isRent ? "rent" : isPreorder ? "preorder" : "sale";

            const priceNum = Number(p.z_price) || 0;
            const price = isRent
              ? `${priceNum.toLocaleString()}₮/сар`
              : isPreorder
              ? `${priceNum.toLocaleString()}₮/м²`
              : `${priceNum.toLocaleString()}₮`;

            let image = "/placeholder.jpg";
            const img = p.images?.[0]?.image_path || "";
            if (img.startsWith("data:image")) image = img;
            else if (/^[A-Za-z0-9+/=]+$/.test(img.slice(0, 100)))
              image = `data:image/jpeg;base64,${img}`;
            else if (img)
              image = `${import.meta.env.VITE_MEDIA_URL || "http://127.0.0.1:8000"}${img}`;

            return {
              id: p.zid.toString(),
              image,
              title: p.z_title,
              price,
              location: `${p.district_name}${p.z_address ? ", " + p.z_address : ""}`,
              beds: p.z_rooms || 0,
              baths: p.z_bathroom || 0,
              area: `${p.z_m2} м²`,
              type,
            };
          });

          setProperties((prev) => (page === 1 ? formatted : [...prev, ...formatted]));
          setHasMore(rawItems.length >= 9);
        } else {
          if (page === 1) {
            setProperties([]);
            setHasMore(false);
          }
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        if (page === 1) setError("Сервертэй холбогдоход алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [page, lastTrigger, searchParams, isSearchMode]);

  const loadMore = () => {
    if (hasMore && !loading) setPage((p) => p + 1);
  };

  // Эхний хуудас лоад хийж байхад
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

  // Алдаа
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {isSearchMode ? "Хайлтын үр дүн" : "Шинэ зарууд"}
            </h2>
            <p className="text-muted-foreground">{properties.length} үл хөдлөх хөрөнгө олдлоо</p>
          </div>

          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" /> Шүүх
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

        {hasMore && (
          <div className="text-center mt-12">
            <Button onClick={loadMore} disabled={loading} variant="outline" size="lg" className="px-8">
              {loading ? "Ачаалж байна..." : "Илүү олон зар харах"}
            </Button>
          </div>
        )}

        {!loading && properties.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-xl">
            Зар олдсонгүй
          </div>
        )}
      </div>
    </section>
  );
};

export default PropertyListings;