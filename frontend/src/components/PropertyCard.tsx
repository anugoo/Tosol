import { Heart, Share2, Bed, Bath, Square, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PropertyCardProps {
  id: string;
  image: string;
  title: string;
  price: string;
  location: string;
  beds: number;
  baths: number;
  area: string;
  type: string;

}

const PropertyCard = ({
  id,
  image,
  title,
  price,
  location,
  beds,
  baths,
  area,
  type
}: PropertyCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/property/${id}`);
  };

  console.log("AZ________type:", type)

  return (
    <div className="property-card overflow-hidden group cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl rounded-2xl bg-card border border-border/50">
      {/* Image */}
      <div className="relative overflow-hidden rounded-t-2xl" onClick={handleCardClick}>
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span
            className={`px-2 py-1 rounded-lg text-sm font-medium ${type === "sale"
                ? "bg-secondary text-secondary-foreground"
                : type === "rent"
                  ? "bg-primary text-primary-foreground"
                  : "bg-green-500 text-black" // preorder
              }`}
          >
            {type === "sale"
              ? "Худалдах"
              : type === "rent"
                ? "Түрээслэх"
                : "Урьдчилсан захиалга"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6" onClick={handleCardClick}>
        <div className="mb-2">
          <h3 className="font-semibold text-lg text-foreground line-clamp-2 mb-1">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm">{location}</p>
        </div>

        <div className="mb-3">
          <span className="text-2xl font-bold text-primary">{price}</span>
        </div>

        <div className="flex items-center gap-4 text-muted-foreground text-sm">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            <span>{beds}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            <span>{baths}</span>
          </div>
          <div className="flex items-center gap-1">
            <Square className="h-4 w-4" />
            <span>{area}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            Дэлгэрэнгүй
          </Button>
          {/* {isLogin && (
            <Button
              variant="gold"
              size="sm"
              className="flex-1 rounded-xl flex items-center justify-center gap-1"
              onClick={handleEdit}
            >
              <Edit2 className="h-4 w-4" />
              Засах/Устгах
            </Button>)} */}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
