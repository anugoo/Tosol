import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { sendRequest, convertToMD5password } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/user/";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Token олдсонгүй. Холбоос буруу байна!");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirm) {
      setError("Бүх талбарыг бөглөнө үү.");
      return;
    }

    if (password !== confirm) {
      setError("Нууц үг хоорондоо таарахгүй байна.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 🔐 Нууц үгийг MD5-р хэшлэх
      const hashedPassword = convertToMD5password(password);

      const response = await sendRequest<any>(API_URL, "POST", {
        action: "resetpassword",
        newpass: hashedPassword, // ← HASHED PASSWORD
        token: token,
      });

      if (response.resultCode === 3019) {
        setSuccess(true);
        toast({
          title: "Амжилттай!",
          description: "Таны нууц үг амжилттай солигдлоо.",
        });
      } else {
        setError(response.resultMessage || "Token хүчингүй эсвэл хугацаа дууссан байна!");
      }
    } catch (err: any) {
      setError("Сервертэй холбогдоход алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-r from-background via-accent to-background py-12">
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6">

          {/* Back */}
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Буцах
            </Button>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-3xl font-bold text-center text-foreground">
              Нууц үг шинэчлэх
            </h2>
            <p className="text-center text-muted-foreground mt-2">
              Шинэ нууц үгээ оруулна уу
            </p>
          </div>

          {/* Success Screen */}
          {success ? (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Амжилттай!</h3>
              <p className="text-muted-foreground mb-4">
                Нууц үг амжилттай солигдлоо.
              </p>
              <Button onClick={() => navigate("/login")} className="w-full">
                Нэвтрэх
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Шинэ нууц үг</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 rounded-xl bg-accent/30"
                  />
                </div>
              </div>

              {/* Confirm */}
              <div className="space-y-2">
                <Label htmlFor="confirm">Нууц үг давтах</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-10 h-12 rounded-xl bg-accent/30"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl hero-gradient text-white font-semibold shadow-md hover:shadow-lg transition-all"
                disabled={loading || !token}
              >
                {loading ? "Шинэчилж байна..." : "Нууц үг шинэчлэх"}
              </Button>
            </form>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
