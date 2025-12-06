import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MapPin, Bed, Bath, Square, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { sendRequest } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";

interface LikedProperty {
  zid: number;
  z_title: string;
  z_price: number;
  z_address: string;
  district_name: string;
  hot_name: string;
  z_rooms: number | null;
  z_m2: string;
  z_createddate: string;
  images: Array<{
    zurag_id: number;
    image_path: string;
  }>;
}

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/user/";

const Liked = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [likedProperties, setLikedProperties] = useState<LikedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem("token");
  let currentUser: any = null;
  try {
    const tokenStr = localStorage.getItem("token");
    if (tokenStr) {
      currentUser = JSON.parse(tokenStr);
    }
  } catch (e) {
    // Invalid token
  }

  useEffect(() => {
    if (!isLoggedIn || !currentUser) {
      navigate("/login");
      return;
    }

    fetchLikedProperties();
  }, [isLoggedIn, currentUser]);

  const fetchLikedProperties = async () => {
    try {
      setLoading(true);
      const response = await sendRequest<{ data: LikedProperty[] }>(API_URL, "POST", {
        action: "get_user_likes",
        uid: currentUser.uid,
      });

      if (response.resultCode === 9005 && response.data) {
        setLikedProperties(response.data);
      } else if (response.resultCode === 9006) {
        toast({
          title: "Алдаа",
          description: "Таалагдсан заруудыг татаж чадсангүй",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Алдаа",
        description: err.message || "Сервертэй холбогдоход алдаа гарлаа",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageSrc = (img?: string) => {
    if (!img) return "/placeholder.jpg";

    // Base64 зураг
    if (img.startsWith("data:image/jpeg;base64,/") && !img.includes("/media/")) {
      return img;
    }

    // Серверийн зам
    if (img.includes("/media/")) {
      const mediaPath = img.substring(img.indexOf("/media/"));
      return `${import.meta.env.VITE_MEDIA_URL || "http://127.0.0.1:8000"}${mediaPath}`;
    }

    // Бусад URL
    return img;
  };

  if (!isLoggedIn || !currentUser) {
    return null; // Will redirect to login
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Таалагдсан заруудыг татаж байна...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-6 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Буцах
          </Button>

          <div className="flex items-center gap-3 mb-6">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            <div>
              <h1 className="text-3xl font-bold">Таалагдсан зарууд</h1>
              <p className="text-muted-foreground">
                Та {likedProperties.length} зар таалагдсан байна
              </p>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {likedProperties.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Таалагдсан зар байхгүй</h2>
            <p className="text-muted-foreground mb-6">
              Та одоогоор ямар ч зарыг таалагдсангүй байна
            </p>
            <Button onClick={() => navigate("/")} className="rounded-xl">
              Зар үзэх
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedProperties.map((property) => (
              <Card
                key={property.zid}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/property/${property.zid}`)}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={
                      property.images && property.images.length > 0
                        ? getImageSrc(property.images[0].image_path)
                        : "/placeholder.jpg"
                    }
                    alt={property.z_title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                      <Heart className="h-4 w-4 text-red-500 fill-current" />
                    </div>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg line-clamp-1">
                      {property.z_title}
                    </h3>

                    <div className="flex items-center text-muted-foreground text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="line-clamp-1">
                        {property.district_name}
                        {property.z_address ? `, ${property.z_address}` : ""}
                      </span>
                    </div>

                    <div className="text-2xl font-bold text-primary">
                      {Number(property.z_price).toLocaleString()}₮
                    </div>

                    {/* Specs */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {property.z_rooms && (
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          <span>{property.z_rooms}</span>
                        </div>
                      )}
                      {property.z_m2 && (
                        <div className="flex items-center gap-1">
                          <Square className="h-4 w-4" />
                          <span>{property.z_m2} м²</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Liked;
