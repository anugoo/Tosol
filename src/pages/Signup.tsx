import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User } from "lucide-react";
import { Link } from "react-router-dom";

const Signup = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-r from-background via-accent to-background">
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6">
        <h2 className="text-3xl font-bold text-center text-foreground">Бүртгүүлэх</h2>
        <p className="text-center text-muted-foreground">Шинэ бүртгэл үүсгэнэ үү</p>

        <div className="space-y-4">
          {/* Нэр */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input placeholder="Нэр" className="pl-10 h-12 rounded-xl bg-accent/10" />
          </div>

          {/* Имэйл */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input type="email" placeholder="И-мэйл" className="pl-10 h-12 rounded-xl bg-accent/10" />
          </div>

          {/* Нууц үг */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input type="password" placeholder="Нууц үг" className="pl-10 h-12 rounded-xl bg-accent/10" />
          </div>

          {/* Нууц үг давтах */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input type="password" placeholder="Нууц үг давтах" className="pl-10 h-12 rounded-xl bg-accent/10" />
          </div>
        </div>

        {/* Бүртгүүлэх товч */}
        <Button className="w-full h-12 rounded-xl hero-gradient text-white font-semibold shadow-md hover:shadow-lg transition-all">
          Бүртгүүлэх
        </Button>

        {/* Нэвтрэх линк */}
        <p className="text-center text-sm text-muted-foreground">
          Аль хэдийн бүртгэлтэй юу?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Нэвтрэх
          </Link>
        </p>
      </div>
    </section>
  );
};

export default Signup;
