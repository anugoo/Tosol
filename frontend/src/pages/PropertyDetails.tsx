// src/components/PropertyDetails.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Heart,
  Share2,
  Bed,
  Bath,
  Square,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { sendRequest } from "@/utils/api";

// === Төрлүүд ===
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

// === API URL ===
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/user/";

const PropertyDetails = () => {
  const { id } = useParams(); // /property/:id маршрутаас зарын ID авах
  const navigate = useNavigate();

  const [property, setProperty] = useState<Zar | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // === Зарын дэлгэрэнгүй мэдээлэл татах ===
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await sendRequest<{ data: Zar[] }>(API_URL, "POST", {
          action: "getzarbyid",
          zid: id,
        });

        if (response.resultCode === 7005 && response.data && response.data[0]) {
          setProperty(response.data[0]);
        } else {
          setError(response.resultMessage || "Зарын мэдээлэл олдсонгүй");
        }
      } catch (err: any) {
        setError(err.message || "Сервертэй холбогдоход алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProperty();
  }, [id]);

  const getImageSrc = (img?: string) => {
    if (!img) return "/placeholder.jpg";
  
    // Base64 зураг
    if (img.startsWith("data:image/jpeg;base64,/") && !img.includes("/media/")) {
      return img; 
    }
  
    // Серверийн зам
    if (img.includes("/media/")) {
      // /media/ хэсгээс эхэлж авах
      const mediaPath = img.substring(img.indexOf("/media/"));
      return `${import.meta.env.VITE_MEDIA_URL || "http://127.0.0.1:8000"}${mediaPath}`;
    }
  
    // Бусад URL
    return img;
  };
  
  
  
  
  // === Navigation зураг солих ===
  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      property?.images ? (prev + 1) % property.images.length : 0
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      property?.images
        ? (prev - 1 + property.images.length) % property.images.length
        : 0
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Зарын мэдээлэл татаж байна...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <p className="text-red-500 mb-4">{error || "Зар олдсонгүй"}</p>
        <Button onClick={() => navigate(-1)}>Буцах</Button>
      </div>
    );
  }

  const images = property.images?.length
    ? property.images.map((img) => getImageSrc(img.image_path))
    : ["/placeholder.jpg"];

    console.log("____________",property.images)
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-6 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all duration-300"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Буцах
        </Button>

        {/* Carousel */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-card shadow-lg">
            <img
              src={images[currentImageIndex]}
              alt="Property"
              className="w-full h-96 lg:h-[500px] object-cover"
            />

            {/* Navigation */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex
                      ? "bg-white"
                      : "bg-white/50 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>

            {/* Image counter */}
            <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                  index === currentImageIndex
                    ? "border-primary"
                    : "border-transparent hover:border-primary/50"
                }`}
              >
                <img
                  src={image}
                  alt={`Thumb ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card rounded-2xl p-6 shadow-lg border border-border/50">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-secondary text-secondary-foreground px-4 py-2 rounded-xl font-medium shadow-sm">
                  {property.status_name}
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-2">{property.z_title}</h1>
              <div className="flex items-center text-muted-foreground mb-6">
                <MapPin className="h-5 w-5 mr-2" />
                <span>
                  {property.district_name}
                  {property.z_address ? `, ${property.z_address}` : ""}
                </span>
              </div>
              <div className="text-4xl font-bold text-primary mb-6">
                {Number(property.z_price).toLocaleString()}₮
              </div>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-3 gap-6 p-6 bg-card rounded-2xl border border-border/50 shadow-lg">
              <div className="text-center">
                <Bed className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {property.z_rooms || 0}
                </div>
                <p className="text-sm text-muted-foreground">Өрөө</p>
              </div>
              <div className="text-center">
                <Bath className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {property.z_bathroom || 0}
                </div>
                <p className="text-sm text-muted-foreground">Угаалгын өрөө</p>
              </div>
              <div className="text-center">
                <Square className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold">{property.z_m2} м²</div>
                <p className="text-sm text-muted-foreground">Талбай</p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
              <h2 className="text-2xl font-semibold mb-4">Дэлгэрэнгүй</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {property.z_description || "Мэдээлэл байхгүй"}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="sticky top-24 space-y-6">
              <div className="p-6 bg-card rounded-xl border border-border">
                <h3 className="font-semibold mb-4">Холбоо барих</h3>
                <div className="space-y-3">
                  <Button className="w-full">Утсаар холбогдох</Button>
                  <Button variant="outline" className="w-full">
                    Мессеж илгээх
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-card rounded-xl border border-border">
                <h3 className="font-semibold mb-4">Зуучлагч</h3>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    {property.user_email?.slice(0, 2).toUpperCase() || "AA"}
                  </div>
                  <div>
                    <div className="font-medium">{property.user_email}</div>
                    <div className="text-sm text-muted-foreground">
                      Мэргэжлийн зуучлагч
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Профайл харах
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PropertyDetails;
