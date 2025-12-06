// src/components/PropertyDetails.tsx
import { useState, useEffect, useMemo } from "react";
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
  Phone,
  Copy,
  Check,
  MessageSquare,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { sendRequest } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

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
  user_phone?: string;
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
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [dataLoaded, setDataLoaded] = useState<string | null>(null); // Track which property data is loaded
  const { toast } = useToast();
  
  // Check if user is logged in - memoize to prevent unnecessary re-renders
  const isLoggedIn = useMemo(() => !!localStorage.getItem("token"), []);

  const currentUser = useMemo(() => {
    if (!isLoggedIn) return null;
    try {
      const tokenStr = localStorage.getItem("token");
      return tokenStr ? JSON.parse(tokenStr) : null;
    } catch (e) {
      return null;
    }
  }, [isLoggedIn]);

  // === Зарын дэлгэрэнгүй мэдээлэл татах ===
  useEffect(() => {
    if (!id) return;

    // Reset data when property ID changes
    if (dataLoaded !== id) {
      setDataLoaded(null);
      setComments([]);
      setLikesCount(0);
      setIsLiked(false);
    }

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

    fetchProperty();
  }, [id]);

  // === Сэтгэгдлүүд болон лайкууд татах ===
  useEffect(() => {
    if (!id || dataLoaded === id) return; // Don't fetch if already loaded for this property

    console.log("PropertyDetails useEffect triggered for property:", id);

    const fetchComments = async () => {
      try {
        setLoadingComments(true);
        const response = await sendRequest<any>(API_URL, "POST", {
          action: "get_comments",
          zar_id: id,
        });

        if (response.resultCode === 8003 && response.data) {
          setComments(response.data);
        }
      } catch (err: any) {
        console.error("Failed to load comments:", err);
      } finally {
        setLoadingComments(false);
      }
    };

    const fetchLikesCount = async () => {
      try {
        const response = await sendRequest<any>(API_URL, "POST", {
          action: "get_likes_count",
          zar_id: id,
        });

        if (response.resultCode === 9003 && response.data && response.data[0]) {
          setLikesCount(response.data[0].likes_count || 0);
        }
      } catch (err: any) {
        console.error("Failed to load likes count:", err);
      }
    };

    const checkIfLiked = async () => {
      if (!currentUser?.uid) return;

      try {
        console.log("Checking if user liked property:", id);
        const response = await sendRequest<any>(API_URL, "POST", {
          action: "get_user_likes",
          uid: currentUser.uid,
        });

        if (response.resultCode === 9005 && response.data) {
          const isPropertyLiked = response.data.some((prop: any) => prop.zid == id);
          setIsLiked(isPropertyLiked);
        }
      } catch (err: any) {
        console.error("Failed to check if liked:", err);
      }
    };

    fetchComments();
    fetchLikesCount();
    checkIfLiked();
    setDataLoaded(id); // Mark this property's data as loaded

    // Cleanup function to prevent memory leaks
    return () => {
      // Any cleanup logic if needed
    };
  }, [id, currentUser?.uid, dataLoaded]); // Include dataLoaded to prevent re-runs

  // === Сэтгэгдэл нэмэх ===
  const handleAddComment = async () => {
    if (!isLoggedIn || !currentUser) {
      toast({
        title: "Алдаа",
        description: "Сэтгэгдэл нэмэхийн тулд нэвтэрнэ үү",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Алдаа",
        description: "Сэтгэгдэл хоосон байна",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingComment(true);
      const response = await sendRequest<any>(API_URL, "POST", {
        action: "add_comment",
        zar_id: id,
        uid: currentUser.uid,
        comment_text: newComment.trim(),
      });

      if (response.resultCode === 8001) {
        toast({
          title: "Амжилттай!",
          description: "Сэтгэгдэл нэмэгдлээ",
        });
        setNewComment("");
        // Reload comments
        const commentsResponse = await sendRequest<any>(API_URL, "POST", {
          action: "get_comments",
          zar_id: id,
        });
        if (commentsResponse.resultCode === 8003 && commentsResponse.data) {
          setComments(commentsResponse.data);
        }
      } else {
        toast({
          title: "Алдаа",
          description: response.resultMessage || "Сэтгэгдэл нэмэхэд алдаа гарлаа",
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
      setSubmittingComment(false);
    }
  };

  // === Сэтгэгдэл устгах ===
  const handleDeleteComment = async (commentId: number) => {
    if (!currentUser) return;

    try {
      const response = await sendRequest<any>(API_URL, "POST", {
        action: "delete_comment",
        comment_id: commentId,
        uid: currentUser.uid,
      });

      if (response.resultCode === 8007) {
        toast({
          title: "Амжилттай!",
          description: "Сэтгэгдэл устгалаа",
        });
        // Reload comments
        const commentsResponse = await sendRequest<any>(API_URL, "POST", {
          action: "get_comments",
          zar_id: id,
        });
        if (commentsResponse.resultCode === 8003 && commentsResponse.data) {
          setComments(commentsResponse.data);
        }
      } else {
        toast({
          title: "Алдаа",
          description: response.resultMessage || "Устгахад алдаа гарлаа",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Алдаа",
        description: err.message || "Сервертэй холбогдоход алдаа гарлаа",
        variant: "destructive",
      });
    }
  };

  // === Лайк/дисллайк функц ===
  const handleToggleLike = async () => {
    if (!isLoggedIn || !currentUser) {
      toast({
        title: "Алдаа",
        description: "Лайк хийхийн тулд нэвтэрнэ үү",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      setLoadingLike(true);
      const response = await sendRequest<any>(API_URL, "POST", {
        action: "toggle_like",
        zar_id: id,
        uid: currentUser.uid,
      });

      if (response.resultCode === 9001 && response.data && response.data[0]) {
        setIsLiked(response.data[0].action === "liked");
        setLikesCount(response.data[0].likes_count || 0);

        toast({
          title: "Амжилттай!",
          description: response.data[0].action === "liked" ? "Зар таалагдлаа!" : "Лайк цуцлагдлаа",
        });
      } else {
        toast({
          title: "Алдаа",
          description: response.resultMessage || "Лайк хийхэд алдаа гарлаа",
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
      setLoadingLike(false);
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

  const handleCopyPhone = () => {
    if (property?.user_phone) {
      navigator.clipboard.writeText(property.user_phone);
      setCopied(true);
      toast({
        title: "Амжилттай!",
        description: "Утасны дугаар хуулагдлаа",
      });
      setTimeout(() => setCopied(false), 2000);
    }
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

            {/* Comments Section */}
            <div className="bg-card rounded-2xl p-6 border border-border shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Сэтгэгдлүүд ({comments.length})
              </h2>

              {/* Add Comment Form */}
              {isLoggedIn ? (
                <div className="mb-6 space-y-3">
                  <Textarea
                    placeholder="Сэтгэгдэл үлдээх..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={submittingComment || !newComment.trim()}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {submittingComment ? "Илгээж байна..." : "Илгээх"}
                  </Button>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-muted rounded-lg text-center">
                  <p className="text-muted-foreground mb-3">
                    Сэтгэгдэл үлдээхийн тулд нэвтэрнэ үү
                  </p>
                  <Button onClick={() => navigate("/login")} variant="outline">
                    Нэвтрэх
                  </Button>
                </div>
              )}

              {/* Comments List */}
              {loadingComments ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Сэтгэгдлүүд ачаалж байна...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Одоогоор сэтгэгдэл байхгүй</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.comment_id}
                      className="p-4 bg-muted/50 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold">
                            {comment.fname} {comment.lname}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {comment.createddate
                              ? new Date(comment.createddate).toLocaleString()
                              : ""}
                          </div>
                        </div>
                        {currentUser && currentUser.uid === comment.uid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.comment_id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-foreground whitespace-pre-line">
                        {comment.comment_text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="sticky top-24 space-y-6">
              <div className="p-6 bg-card rounded-xl border border-border">
                <h3 className="font-semibold mb-4">Холбоо барих</h3>
                <div className="space-y-3">
                  <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Phone className="h-4 w-4 mr-2" />
                        Холбогдох
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Холбоо барих мэдээлэл</DialogTitle>
                        <DialogDescription>
                          Зар оруулсан хэрэглэгчийн утасны дугаар
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        {property?.user_phone ? (
                          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              <Phone className="h-5 w-5 text-primary" />
                              <span className="text-lg font-semibold">{property.user_phone}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCopyPhone}
                              className="gap-2"
                            >
                              {copied ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  Хуулагдлаа
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4" />
                                  Хуулах
                                </>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Утасны дугаар олдсонгүй</p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <div className="flex gap-2">
                    <Button
                      variant={isLiked ? "default" : "outline"}
                      className={`flex-1 gap-2 ${isLiked ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
                      onClick={handleToggleLike}
                      disabled={loadingLike}
                    >
                      <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                      {likesCount > 0 && <span className="text-sm">{likesCount}</span>}
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
