import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { sendRequest, convertToMD5password } from "@/utils/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ApiResponse {
  resultCode?: number;
  resultMessage?: string;
  data?: any[];
}

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ✳️ Талбарууд тусдаа state-тай
  const [lastName, setLastName] = useState(""); // Овог
  const [firstName, setFirstName] = useState(""); // Нэр
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");

  /** 🔹 Бүртгүүлэх функц */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lastName || !firstName || !email || !password || !confirmPassword) {
      setError("Бүх талбарыг бөглөнө үү.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Нууц үг таарахгүй байна.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const hashedPassword = convertToMD5password(password);

      const response = await sendRequest<ApiResponse>(
        "http://localhost:8000/user/",
        "POST",
        {
          action: "register",
          uname: email,
          upassword: hashedPassword,
          lname: lastName,
          fname: firstName,
          phone // include phone if provided, empty string if not
        }
      );

      switch (response.resultCode) {
        case 1001:
          toast({ title: "Бүртгэл амжилттай үүслээ!" });
          navigate("/login");
          break;
        case 1003:
          setError("Энэ и-мэйл бүртгэлтэй байна.");
          break;
        default:
          setError(response.resultMessage || "Бүртгэл үүсгэхэд алдаа гарлаа.");
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
          onSubmit={handleSignup}
          className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6"
        >
          <h2 className="text-3xl font-bold text-center text-foreground">Бүртгүүлэх</h2>
          <p className="text-center text-muted-foreground">Шинэ бүртгэл үүсгэнэ үү</p>

          <div className="space-y-4">
            {/* Овог */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Овог"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-accent/10"
                required
              />
            </div>

            {/* Нэр */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Нэр"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-accent/10"
                required
              />
            </div>

            {/* Имэйл */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="email"
                placeholder="И-мэйл"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-accent/10"
                required
              />
            </div>

            {/* Утас (шинээр нэмэх) */}
            <div className="relative">
              <Input
                type="tel"
                placeholder="Утас (заавал биш)"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-accent/10"
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
                className="pl-10 h-12 rounded-xl bg-accent/10"
                required
              />
            </div>

            {/* Нууц үг давтах */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="password"
                placeholder="Нууц үг давтах"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-accent/10"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button
            type="submit"
            className="w-full h-12 rounded-xl hero-gradient text-white font-semibold shadow-md hover:shadow-lg transition-all"
            disabled={loading}
          >
            {loading ? "Бүртгэж байна..." : "Бүртгүүлэх"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Аль хэдийн бүртгэлтэй юу?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Нэвтрэх
            </Link>
          </p>
        </form>
      </section>
      <Footer />
    </>
  );
};

export default Signup;
