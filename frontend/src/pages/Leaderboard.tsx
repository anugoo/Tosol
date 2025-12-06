import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, MapPin, Bed, Bath, Square, Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { sendRequest } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";

interface LeaderboardProperty {
  zid: number;
  z_title: string;
  z_price: number;
  z_address: string;
  district_name: string;
  hot_name: string;
  z_rooms: number | null;
  z_m2: string;
  likes_count: number;
  images: Array<{
    zurag_id: number;
    image_path: string;
  }>;
}

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/user/";

const Leaderboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leaderboardProperties, setLeaderboardProperties] = useState<LeaderboardProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await sendRequest<{ data: LeaderboardProperty[] }>(API_URL, "POST", {
        action: "get_most_liked",
        limit: 20, // Top 20 most liked properties
      });

      if (response.resultCode === 9007 && response.data) {
        setLeaderboardProperties(response.data);
      } else if (response.resultCode === 9008) {
        toast({
          title: "Алдаа",
          description: "Лидербордыг татаж чадсангүй",
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

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return "🥇"; // Gold medal
      case 1:
        return "🥈"; // Silver medal
      case 2:
        return "🥉"; // Bronze medal
      default:
        return `#${index + 1}`;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case 1:
        return "text-gray-600 bg-gray-50 border-gray-200";
      case 2:
        return "text-amber-600 bg-amber-50 border-amber-200";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Лидербордыг татаж байна...</p>
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
            <Trophy className="h-8 w-8 text-yellow-500" />
            <div>
              <h1 className="text-3xl font-bold">Хамгийн их таалагдсан зарууд</h1>
              <p className="text-muted-foreground">
                Хэрэглэгчдийн саналаар шилдэг зарууд
              </p>
            </div>
          </div>
        </div>

        {/* Properties List */}
        {leaderboardProperties.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Лидерборд хоосон байна</h2>
            <p className="text-muted-foreground mb-6">
              Одоогоор таалагдсан зар байхгүй байна
            </p>
            <Button onClick={() => navigate("/")} className="rounded-xl">
              Зар үзэх
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboardProperties.map((property, index) => (
              <Card
                key={property.zid}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/property/${property.zid}`)}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Rank Badge */}
                  <div className={`flex-shrink-0 w-full md:w-16 h-16 md:h-auto flex items-center justify-center border-r ${getRankColor(index)}`}>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{getRankIcon(index)}</div>
                      {index > 2 && (
                        <div className="text-xs mt-1">{property.likes_count} ❤️</div>
                      )}
                    </div>
                  </div>

                  {/* Image */}
                  <div className="relative w-full md:w-48 h-48 md:h-32 flex-shrink-0 overflow-hidden">
                    <img
                      src={
                        property.images && property.images.length > 0
                          ? getImageSrc(property.images[0].image_path)
                          : "/placeholder.jpg"
                      }
                      alt={property.z_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Content */}
                  <CardContent className="flex-1 p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="space-y-2 flex-1">
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

                        <div className="text-xl font-bold text-primary">
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

                      {/* Likes Count */}
                      <div className="flex items-center gap-2 mt-4 md:mt-0 md:ml-4">
                        <div className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-2 rounded-full">
                          <Heart className="h-4 w-4 fill-current" />
                          <span className="font-semibold">{property.likes_count}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Leaderboard;
