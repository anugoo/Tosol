import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Settings,
  Plus,
  Edit,
  Trash2,
  Lock,
  Phone,
  Mail,
  Calendar,
  LogOut,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { sendRequest } from "@/utils/api";
import { convertToMD5password } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import PropertyCard from "@/components/PropertyCard";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/user/";

interface UserData {
  uid: number;
  uname: string;
  fname: string;
  lname: string;
  phone?: string;
  createddate?: string;
  lastlogin?: string;
  userrole?: number;
}

interface Property {
  zid: number;
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
  images: any[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [likedProperties, setLikedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ads");

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fname: "",
    lname: "",
    phone: "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    oldpass: "",
    newpass: "",
    confirmpass: "",
  });

  // Load user data
  useEffect(() => {
    const tokenStr = localStorage.getItem("token");
    if (!tokenStr) {
      navigate("/login");
      return;
    }

    try {
      const userData = JSON.parse(tokenStr);
      if (userData.uid) {
        loadUserInfo(userData.uid);
        loadUserAds(userData.uid);
        loadLikedAds(userData.uid);
      } else {
        navigate("/login");
      }
    } catch (err) {
      navigate("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const loadUserInfo = async (uid: number) => {
    try {
      const response = await sendRequest<any>(API_URL, "POST", {
        action: "get_user_info",
        uid: uid,
      });

      if (response.resultCode === 1008 && response.data?.[0]) {
        const userData = response.data[0];
        setUser(userData);
        setProfileForm({
          fname: userData.fname || "",
          lname: userData.lname || "",
          phone: userData.phone || "",
        });
      }
    } catch (err: any) {
      toast({
        title: "Алдаа",
        description: err.message || "Хэрэглэгчийн мэдээлэл ачаалахад алдаа гарлаа",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserAds = async (uid: number) => {
    try {
      const response = await sendRequest<any>(API_URL, "POST", {
        action: "get_my_ads",
        uid: uid,
      });

      if (response.resultCode === 7005 && response.data) {
        setProperties(response.data);
      }
    } catch (err: any) {
      console.error("Failed to load ads:", err);
    }
  };

  const loadLikedAds = async (uid: number) => {
    try {
      console.log("Loading liked ads for user:", uid);
      const response = await sendRequest<any>(API_URL, "POST", {
        action: "get_user_likes",
        uid: uid,
      });

      console.log("Liked ads response:", response);

      if (response.resultCode === 9005 && response.data) {
        console.log("Setting liked properties:", response.data.length, "items");
        setLikedProperties(response.data);
      } else {
        console.log("No liked ads found or API error:", response);
        setLikedProperties([]); // Clear the list if no data
      }
    } catch (err: any) {
      console.error("Failed to load liked ads:", err);
      setLikedProperties([]); // Clear on error
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const response = await sendRequest<any>(API_URL, "POST", {
        action: "update_user_profile",
        uid: user.uid,
        ...profileForm,
      });

      if (response.resultCode === 1009) {
        toast({
          title: "Амжилттай!",
          description: "Профайл амжилттай шинэчлэгдлээ",
        });
        loadUserInfo(user.uid);
      } else {
        toast({
          title: "Алдаа",
          description: response.resultMessage || "Шинэчлэхэд алдаа гарлаа",
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

  const handleChangePassword = async () => {
    if (!user) return;

    if (passwordForm.newpass !== passwordForm.confirmpass) {
      toast({
        title: "Алдаа",
        description: "Шинэ нууц үг таарахгүй байна",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newpass.length < 6) {
      toast({
        title: "Алдаа",
        description: "Шинэ нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await sendRequest<any>(API_URL, "POST", {
        action: "changepassword",
        uname: user.uname,
        oldpass: convertToMD5password(passwordForm.oldpass),
        newpass: convertToMD5password(passwordForm.newpass),
      });

      if (response.resultCode === 3022) {
        toast({
          title: "Амжилттай!",
          description: "Нууц үг амжилттай солигдлоо",
        });
        setPasswordForm({ oldpass: "", newpass: "", confirmpass: "" });
      } else {
        toast({
          title: "Алдаа",
          description: response.resultMessage || "Нууц үг солиход алдаа гарлаа",
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

  const handleDeleteAd = async (zid: number) => {
    if (!user) return;

    try {
      const response = await sendRequest<any>(API_URL, "POST", {
        action: "delete_zar",
        zar_id: zid,
        uid: user.uid,
      });

      if (response.resultCode === 7011) {
        toast({
          title: "Амжилттай!",
          description: "Зар амжилттай устгалаа",
        });
        loadUserAds(user.uid);
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
    toast({
      title: "Гарах",
      description: "Амжилттай гарлаа",
    });
  };

  const formatProperty = (p: Property) => {
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Ачаалж байна...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Миний самбар</h1>
              <p className="text-muted-foreground mt-2">
                Өөрийн зарууд болон профайлыг удирдах
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/post")} className="gap-2">
                <Plus className="h-4 w-4" />
                Шинэ зар оруулах
              </Button>
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Гарах
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            // Refresh liked ads when switching to liked tab
            if (value === "liked" && user) {
              loadLikedAds(user.uid);
            }
          }} className="space-y-6">
            <TabsList>
              <TabsTrigger value="ads">Миний зарууд</TabsTrigger>
              <TabsTrigger value="liked">Таалагдсан</TabsTrigger>
              <TabsTrigger value="profile">Профайл</TabsTrigger>
              <TabsTrigger value="password">Нууц үг солих</TabsTrigger>
            </TabsList>

            {/* My Ads Tab */}
            <TabsContent value="ads" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Миний зарууд ({properties.length})</CardTitle>
                  <CardDescription>
                    Таны оруулсан бүх зарууд. Засах, устгах боломжтой
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {properties.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        Та одоогоор зар оруулаагүй байна
                      </p>
                      <Button onClick={() => navigate("/post")} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Шинэ зар оруулах
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {properties.map((property) => {
                        const formatted = formatProperty(property);
                        return (
                          <div key={property.zid} className="relative group">
                            <PropertyCard {...formatted} />
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => navigate(`/property/edit/${property.zid}`)}
                                className="gap-1"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive" className="gap-1">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Зар устгах уу?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Энэ үйлдлийг буцаах боломжгүй. Зар бүрмөсөн устгагдана.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Цуцлах</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteAd(property.zid)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Устгах
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Liked Ads Tab */}
            <TabsContent value="liked" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Таалагдсан зарууд ({likedProperties.length})
                  </CardTitle>
                  <CardDescription>
                    Танд таалагдсан бүх зарууд
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {likedProperties.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Та одоогоор ямар ч зарыг таалагдсангүй байна
                      </p>
                      <Button onClick={() => navigate("/")} className="gap-2">
                        Зар үзэх
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {likedProperties.map((property) => {
                        const formatted = formatProperty(property);
                        return (
                          <div key={property.zid} className="relative">
                            <PropertyCard {...formatted} />
                            <div className="absolute top-2 right-2">
                              <div className="bg-red-500 text-white rounded-full p-1">
                                <Heart className="h-3 w-3 fill-current" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Профайл мэдээлэл</CardTitle>
                  <CardDescription>
                    Хувийн мэдээллээ засах
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">И-мэйл</Label>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user.uname}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        И-мэйл хаягийг өөрчлөх боломжгүй
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Утасны дугаар</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, phone: e.target.value })
                        }
                        placeholder="99112233"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fname">Нэр</Label>
                      <Input
                        id="fname"
                        value={profileForm.fname}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, fname: e.target.value })
                        }
                        placeholder="Нэр"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lname">Овог</Label>
                      <Input
                        id="lname"
                        value={profileForm.lname}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, lname: e.target.value })
                        }
                        placeholder="Овог"
                      />
                    </div>
                  </div>

                  {user.createddate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Бүртгүүлсэн: {new Date(user.createddate).toLocaleDateString()}</span>
                    </div>
                  )}

                  <Button onClick={handleUpdateProfile} className="w-full md:w-auto">
                    Хадгалах
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Password Tab */}
            <TabsContent value="password" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Нууц үг солих</CardTitle>
                  <CardDescription>
                    Нууц үгээ аюулгүй байдлаар солих
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="oldpass">Одоогийн нууц үг</Label>
                    <Input
                      id="oldpass"
                      type="password"
                      value={passwordForm.oldpass}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, oldpass: e.target.value })
                      }
                      placeholder="Одоогийн нууц үг"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newpass">Шинэ нууц үг</Label>
                    <Input
                      id="newpass"
                      type="password"
                      value={passwordForm.newpass}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newpass: e.target.value })
                      }
                      placeholder="Шинэ нууц үг (хамгийн багадаа 6 тэмдэгт)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmpass">Шинэ нууц үг давтах</Label>
                    <Input
                      id="confirmpass"
                      type="password"
                      value={passwordForm.confirmpass}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmpass: e.target.value })
                      }
                      placeholder="Шинэ нууц үг давтах"
                    />
                  </div>

                  <Button onClick={handleChangePassword} className="w-full md:w-auto">
                    Нууц үг солих
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;

