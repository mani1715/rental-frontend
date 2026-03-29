import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

const BACKEND_URL = 'https://rental-backend-production-3c03.up.railway.app';
const FALLBACK_IMAGE = 'https://dummyimage.com/800x600/cccccc/666666&text=No+Image';

export const ImageCarousel = ({ images, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const getImageUrl = (img) => {
    if (!img) {
      console.log("ImageCarousel: No image provided");
      return FALLBACK_IMAGE;
    }
    
    console.log("ImageCarousel: Processing image:", img);
    
    // Already a full URL
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }
    
    // Relative path with /uploads/
    if (img.startsWith('/uploads/')) {
      return `${BACKEND_URL}${img}`;
    }
    
    // Relative path with /
    if (img.startsWith('/')) {
      return `${BACKEND_URL}${img}`;
    }
    
    // Just filename
    return `${BACKEND_URL}/uploads/${img}`;
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full" data-testid="image-carousel">
      <div className="relative h-96 md:h-[500px] overflow-hidden rounded-lg">
        <img
          src={getImageUrl(images[currentIndex])}
          alt={`${title} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
          data-testid={`carousel-image-${currentIndex}`}
          onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
        />
        
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full"
              onClick={goToPrevious}
              data-testid="carousel-prev-button"
            >
              <ChevronLeft className="h-6 w-6" style={{ color: '#1F2937' }} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full"
              onClick={goToNext}
              data-testid="carousel-next-button"
            >
              <ChevronRight className="h-6 w-6" style={{ color: '#1F2937' }} />
            </Button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'w-8 bg-white' 
                      : 'bg-white/60 hover:bg-white/80'
                  }`}
                  data-testid={`carousel-dot-${index}`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>

            <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2 mt-4">
          {images.slice(0, 5).map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex 
                  ? 'border-blue-600' 
                  : 'border-transparent hover:border-gray-300'
              }`}
              data-testid={`thumbnail-${index}`}
            >
              <img
                src={getImageUrl(image)}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
