import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendRequest } from "@/utils/api";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Response {
  resultCode: number;
  resultMessage: string;
  data?: any[];
}

export default function Verified() {
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      const token = new URLSearchParams(window.location.search).get("token");
      if (!token) {
        setError("❌ Баталгаажуулах токен олдсонгүй.");
        setLoading(false);
        return;
      }

      try {
        const response: Response | null = await sendRequest(
          `http://localhost:8000/user/?token=${token}`,
          "GET"
        );

        if (!response) {
          setError("Серверээс хариу ирсэнгүй.");
          return;
        }

        if (response.resultCode === 3010) {
          setSuccessMessage("Имэйл амжилттай баталгаажлаа!");
          setTimeout(() => navigate("/login"), 3000);
        } else if (response.resultCode === 3011) {
          setSuccessMessage("Нууц үг сэргээх холбоос идэвхтэй байна.");
          setTimeout(() => navigate(`/reset?token=${token}`), 3000);
        } else {
          setError(response.resultMessage || "Баталгаажуулалт амжилтгүй боллоо.");
        }
      } catch {
        setError("Сервертэй холбогдоход алдаа гарлаа.");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [navigate]);

  // 🌀 Ачаалж байх үе
  if (loading) {
    return (
      <>
        <Header />
        <section className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-background via-accent to-background">
          <Loader2 className="animate-spin w-12 h-12 text-primary mb-4" />
          <p className="text-foreground text-lg font-medium">Түр хүлээнэ үү...</p>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <section className="min-h-screen flex items-center justify-center bg-gradient-to-r from-background via-accent to-background">
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md text-center space-y-6">
          {successMessage ? (
            <>
              <CheckCircle2 className="w-20 h-20 mx-auto text-green-500 animate-bounce" />
              <h2 className="text-3xl font-bold text-foreground">Баталгаажуулалт амжилттай 🎉</h2>
              <p className="text-green-700 text-lg">{successMessage}</p>
              <Button
                onClick={() => navigate("/login")}
                className="w-full h-12 rounded-xl hero-gradient text-white font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Нэвтрэх
              </Button>
            </>
          ) : (
            <>
              <XCircle className="w-20 h-20 mx-auto text-red-500 animate-pulse" />
              <h2 className="text-3xl font-bold text-foreground">Баталгаажуулалт амжилтгүй 😢</h2>
              <p className="text-red-600 text-lg">{error}</p>
              <Button
                onClick={() => navigate("/signup")}
                className="w-full h-12 rounded-xl bg-red-500 text-white font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Дахин оролдох
              </Button>
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
