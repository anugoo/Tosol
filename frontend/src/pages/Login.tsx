import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom"; // ← useNavigate нэмсэн
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { sendRequest, convertToMD5password } from "@/utils/api";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// 🔹 Хэрэглэгчийн мэдээллийн төрөл
interface UserData {
  uid: number;
  uname: string;
  lname: string;
  fname: string;
  lastlogin: string;
  userrole?: number;
}

// 🔹 Backend response-ийн төрөл
interface ApiResponse<T> {
  resultCode?: number;
  resultMessage?: string;
  data?: T[];
  size?: number;
  action?: string;
  curdate?: string;
}

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Хэрвээ хэрэглэгч нэвтэрсэн бол dashboard руу чиглүүлэх
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard");
  }, [navigate]);

  /** 🔹 Нэвтрэх */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("И-мэйл болон нууц үгээ оруулна уу.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const hashedPassword = convertToMD5password(password);

      const response = await sendRequest<ApiResponse<UserData>>(
        "http://localhost:8000/user/",
        "POST",
        { action: "login", uname: email, upassword: hashedPassword }
      );

      switch (response.resultCode) {
        case 1002:
          if (response.data?.length > 0) {
            localStorage.setItem("token", JSON.stringify(response.data[0]));
            toast({ title: "Амжилттай нэвтэрлээ!" });
            navigate("/");
          } else {
            setError("Хэрэглэгчийн мэдээлэл олдсонгүй.");
          }
          break;
        case 1004:
          setError("И-мэйл эсвэл нууц үг буруу байна.");
          break;
        default:
          setError(response.resultMessage || "Нэвтрэхэд алдаа гарлаа.");
      }
    } catch (err: any) {
      setError(err.message || "Сервертэй холбогдоход алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <section className="min-h-screen flex items-center justify-center bg-gradient-to-r from-background via-accent to-background">
        <form
          onSubmit={handleSignIn}
          className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6"
        >
          <h2 className="text-3xl font-bold text-center text-foreground">Нэвтрэх</h2>
          <p className="text-center text-muted-foreground">
            Өөрийн бүртгэлээр нэвтэрнэ үү
          </p>

          {/* И-мэйл */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="email"
              placeholder="И-мэйл"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-accent/30"
              required
            />
          </div>

          {/* Нууц үг */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="password"
              placeholder="Нууц үг"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-accent/30"
              required
            />
          </div>

          {/* Алдааны мессеж */}
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <div className="text-right text-sm">
            <Link to="/forgot-password" className="text-primary hover:underline">
              Нууц үг мартсан уу?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl hero-gradient text-white font-semibold shadow-md hover:shadow-lg transition-all"
            disabled={loading}
          >
            {loading ? "Түр хүлээнэ үү..." : "Нэвтрэх"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Шинэ хэрэглэгч үү?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Бүртгүүлэх
            </Link>
          </p>
        </form>
      </section>

      <Footer />
    </>
  );
};

export default Login;
