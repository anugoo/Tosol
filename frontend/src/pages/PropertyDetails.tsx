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
  Edit,
  X
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

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/user/";

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

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
  const [dataLoaded, setDataLoaded] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const isLoggedIn = useMemo(() => !!localStorage.getItem("token"), []);
  const currentUser = useMemo(() => {
    if (!isLoggedIn) return null;
    try {
      const tokenStr = localStorage.getItem("token");
      return tokenStr ? JSON.parse(tokenStr) : null;
    } catch {
      return null;
    }
  }, [isLoggedIn]);

  // --- Fetch property details ---
  useEffect(() => {
    if (!id) return;

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

  // --- Fetch comments and likes ---
  useEffect(() => {
    if (!id || dataLoaded === id) return;

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
        console.error(err);
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
        console.error(err);
      }
    };

    const checkIfLiked = async () => {
      if (!currentUser?.uid) return;
      try {
        const response = await sendRequest<any>(API_URL, "POST", {
          action: "get_user_likes",
          uid: currentUser.uid,
        });
        if (response.resultCode === 9005 && response.data) {
          setIsLiked(response.data.some((prop: any) => prop.zid == id));
        }
      } catch (err: any) {
        console.error(err);
      }
    };

    fetchComments();
    fetchLikesCount();
    checkIfLiked();
    setDataLoaded(id);
  }, [id, currentUser?.uid, dataLoaded]);

  // --- Add comment ---
  const handleAddComment = async () => {
    if (!isLoggedIn || !currentUser) {
      toast({ title: "Алдаа", description: "Сэтгэгдэл нэмэхийн тулд нэвтэрнэ үү", variant: "destructive" });
      navigate("/login");
      return;
    }
    if (!newComment.trim()) {
      toast({ title: "Алдаа", description: "Сэтгэгдэл хоосон байна", variant: "destructive" });
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
        toast({ title: "Амжилттай!", description: "Сэтгэгдэл нэмэгдлээ" });
        setNewComment("");
        const commentsResponse = await sendRequest<any>(API_URL, "POST", { action: "get_comments", zar_id: id });
        if (commentsResponse.resultCode === 8003 && commentsResponse.data) setComments(commentsResponse.data);
      } else {
        toast({ title: "Алдаа", description: response.resultMessage || "Сэтгэгдэл нэмэхэд алдаа гарлаа", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Алдаа", description: err.message || "Сервертэй холбогдоход алдаа гарлаа", variant: "destructive" });
    } finally {
      setSubmittingComment(false);
    }
  };

  // --- Delete comment ---
  const handleDeleteComment = async (commentId: number) => {
    if (!currentUser) return;
    try {
      const response = await sendRequest<any>(API_URL, "POST", { action: "delete_comment", comment_id: commentId, uid: currentUser.uid });
      if (response.resultCode === 8007) {
        toast({ title: "Амжилттай!", description: "Сэтгэгдэл устгалаа" });
        const commentsResponse = await sendRequest<any>(API_URL, "POST", { action: "get_comments", zar_id: id });
        if (commentsResponse.resultCode === 8003 && commentsResponse.data) setComments(commentsResponse.data);
      } else {
        toast({ title: "Алдаа", description: response.resultMessage || "Устгахад алдаа гарлаа", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Алдаа", description: err.message || "Сервертэй холбогдоход алдаа гарлаа", variant: "destructive" });
    }
  };

  // --- Update comment ---
  const handleUpdateComment = async (commentId: number) => {
    if (!currentUser) return;
    if (!editingCommentText.trim()) {
      toast({ title: "Алдаа", description: "Сэтгэгдэл хоосон байна", variant: "destructive" });
      return;
    }

    try {
      setSubmittingEdit(true);
      const response = await sendRequest<any>(API_URL, "POST", { action: "update_comment", comment_id: commentId, uid: currentUser.uid, comment_text: editingCommentText.trim() });
      if (response.resultCode === 8010) {
        toast({ title: "Амжилттай!", description: "Сэтгэгдэл засагдлаа" });
        setEditingCommentId(null);
        setEditingCommentText("");
        const commentsResponse = await sendRequest<any>(API_URL, "POST", { action: "get_comments", zar_id: id });
        if (commentsResponse.resultCode === 8003 && commentsResponse.data) setComments(commentsResponse.data);
      } else {
        toast({ title: "Алдаа", description: response.resultMessage || "Сэтгэгдэл засахад алдаа гарлаа", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Алдаа", description: err.message || "Сервертэй холбогдоход алдаа гарлаа", variant: "destructive" });
    } finally {
      setSubmittingEdit(false);
    }
  };

  // --- Toggle like ---
  const handleToggleLike = async () => {
    if (!isLoggedIn || !currentUser) {
      toast({ title: "Алдаа", description: "Лайк хийхийн тулд нэвтэрнэ үү", variant: "destructive" });
      navigate("/login");
      return;
    }
    try {
      setLoadingLike(true);
      const response = await sendRequest<any>(API_URL, "POST", { action: "toggle_like", zar_id: id, uid: currentUser.uid });
      if (response.resultCode === 9001 && response.data && response.data[0]) {
        const newIsLiked = response.data[0].action === "liked";
        const newLikesCount = response.data[0].likes_count || 0;
        setIsLiked(newIsLiked);
        setLikesCount(newLikesCount);
      } else {
        toast({ title: "Алдаа", description: response.resultMessage || "Лайк хийхэд алдаа гарлаа", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Алдаа", description: err.message || "Сервертэй холбогдоход алдаа гарлаа", variant: "destructive" });
    } finally {
      setLoadingLike(false);
    }
  };

  const getImageSrc = (img?: string) => {
    if (!img) return "/placeholder.jpg";
    if (img.startsWith("data:image/jpeg;base64,/") && !img.includes("/media/")) return img;
    if (img.includes("/media/")) return `${import.meta.env.VITE_MEDIA_URL || "http://127.0.0.1:8000"}${img.substring(img.indexOf("/media/"))}`;
    return img;
  };

  const nextImage = () => setCurrentImageIndex((prev) => property?.images ? (prev + 1) % property.images.length : 0);
  const prevImage = () => setCurrentImageIndex((prev) => property?.images ? (prev - 1 + property.images.length) % property.images.length : 0);
  const handleCopyPhone = () => { if (property?.user_phone) { navigator.clipboard.writeText(property.user_phone); setCopied(true); toast({ title: "Амжилттай!", description: "Утасны дугаар хуулагдлаа" }); setTimeout(() => setCopied(false), 2000); } };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Зарын мэдээлэл татаж байна...</p></div>;
  if (error || !property) return <div className="flex flex-col items-center justify-center min-h-screen text-center"><p className="text-red-500 mb-4">{error || "Зар олдсонгүй"}</p><Button onClick={() => navigate(-1)}>Буцах</Button></div>;

  const images = property.images?.length ? property.images.map((img) => getImageSrc(img.image_path)) : ["/placeholder.jpg"];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* --- Carousel --- */}
        <div className="relative w-full max-h-[500px] overflow-hidden rounded-2xl">
            <img
        src={images[currentImageIndex]}
        alt="property"
        className="w-full object-contain rounded-2xl max-h-[500px]"
      />
          {images.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          {/* --- Like & Share --- */}
          <div className="absolute top-2 right-2 flex gap-2">
            <button onClick={handleToggleLike} className={`p-2 rounded-full ${isLiked ? "bg-red-500 text-white" : "bg-white text-red-500"} shadow`}>
              <Heart className="w-5 h-5" />
            </button>
            <Dialog>
              <DialogTrigger asChild>
                <button className="p-2 rounded-full bg-white shadow">
                  <Share2 className="w-5 h-5" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Зарын холбоос хуваалцах</DialogTitle>
                  <DialogDescription>Энэ зарын линкийг хуулж бусадтай хуваалцаарай</DialogDescription>
                </DialogHeader>
                <div className="flex gap-2 mt-2">
                  <input type="text" readOnly value={window.location.href} className="flex-1 p-2 border rounded" />
                  <Button onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Амжилттай!", description: "Линк хууллаа" }); }}>Хуулах</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* --- Property Info --- */}
        <div className="mt-6 bg-card rounded-2xl p-6 border border-border shadow-lg flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{property.z_title}</h1>
            <p className="text-xl font-semibold text-foreground my-2">{property.z_price}₮</p>
            <p className="text-muted-foreground">{property.z_description}</p>
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-[300px] flex flex-col gap-3">
            <Button onClick={() => setContactDialogOpen(true)} className="flex items-center gap-2"><Phone className="w-4 h-4" /> Холбоо барих</Button>
            <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Холбоо барих</DialogTitle>
                  <DialogDescription>Утас: {property.user_phone || "Байхгүй"}</DialogDescription>
                </DialogHeader>
                {property.user_phone && <Button className="mt-4" onClick={handleCopyPhone}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Хуулах</Button>}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* --- Comments --- */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-lg mt-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><MessageSquare className="h-6 w-6" /> Сэтгэгдлүүд ({comments.length})</h2>
          {isLoggedIn ? (
            <div className="mb-6 space-y-3">
              <Textarea placeholder="Сэтгэгдэл үлдээх..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="min-h-[100px]" />
              <Button onClick={handleAddComment} disabled={submittingComment || !newComment.trim()} className="gap-2"><Send className="h-4 w-4" />{submittingComment ? "Илгээж байна..." : "Илгээх"}</Button>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-muted rounded-lg text-center">
              <p className="text-muted-foreground mb-3">Сэтгэгдэл үлдээхийн тулд нэвтэрнэ үү</p>
              <Button onClick={() => navigate("/login")} variant="outline">Нэвтрэх</Button>
            </div>
          )}
          {loadingComments ? <p className="text-center py-8 text-muted-foreground">Сэтгэгдлүүд ачаалж байна...</p> : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.comment_id} className="p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold">{comment.fname} {comment.lname}</div>
                      <div className="text-sm text-muted-foreground">{comment.createddate ? new Date(comment.createddate).toLocaleString() : ""}</div>
                    </div>
                    {currentUser && currentUser.uid === comment.uid && (
                      <div className="flex gap-2">
                        {editingCommentId === comment.comment_id ? (
                          <>
                            <Button variant="default" size="sm" onClick={() => handleUpdateComment(comment.comment_id)} disabled={submittingEdit}>
                              {submittingEdit ? "Илгээж байна..." : "Хадгалах"}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setEditingCommentId(null); setEditingCommentText(""); }}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => { setEditingCommentId(comment.comment_id); setEditingCommentText(comment.comment_text); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteComment(comment.comment_id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {editingCommentId === comment.comment_id ? (
                    <Textarea value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value)} className="min-h-[80px]" />
                  ) : (
                    <p className="text-foreground whitespace-pre-line">{comment.comment_text}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PropertyDetails;
