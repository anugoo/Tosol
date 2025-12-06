import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { sendRequest } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/user/";

const Forgot = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("И-мэйл хаягаа оруулна уу.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await sendRequest<any>(API_URL, "POST", {
        action: "forgot",
        uname: email,
      });

      if (response.resultCode === 3012) {
        setSuccess(true);
        toast({
          title: "Амжилттай!",
          description: "Нууц үг сэргээх холбоос имэйлдээ илгээгдлээ",
        });
      } else if (response.resultCode === 3013) {
        setError("Энэ имэйл хаяг бүртгэлгүй байна.");
      } else {
        setError(response.resultMessage || "Алдаа гарлаа");
      }
    } catch (err: any) {
      setError(err.message || "Сервертэй холбогдоход алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-r from-background via-accent to-background py-12">
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6">
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

          <div>
            <h2 className="text-3xl font-bold text-center text-foreground">
              Нууц үг сэргээх
            </h2>
            <p className="text-center text-muted-foreground mt-2">
              Имэйл хаягаа оруулж, нууц үг сэргээх холбоос аваарай
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Имэйл илгээгдлээ!
                </h3>
                <p className="text-muted-foreground mb-4">
                  {email} хаяг руу нууц үг сэргээх холбоос илгээгдлээ. Имэйлээ
                  шалгана уу.
                </p>
                <Button onClick={() => navigate("/login")} className="w-full">
                  Нэвтрэх хуудас руу буцах
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">И-мэйл хаяг</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl bg-accent/30"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl hero-gradient text-white font-semibold shadow-md hover:shadow-lg transition-all"
                disabled={loading}
              >
                {loading ? "Илгээж байна..." : "Холбоос илгээх"}
              </Button>

              <div className="text-center text-sm">
                <Link to="/login" className="text-primary hover:underline">
                  Нэвтрэх хуудас руу буцах
                </Link>
              </div>
            </form>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Forgot;

