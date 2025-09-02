import React, { useMemo, useState, useEffect } from "react";
import {
  Box, IconButton, Typography, Card, CardMedia
} from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import formatDate from "./utils/dateutils";

// Scout Images Carousel Component
export function ScoutImagesCarousel({ scoutReports, loading }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get the most recent scout report with images
  const latestReport = scoutReports.find(report => report.imageHtml);
  
  // Parse images from ImageHTML 
  const images = useMemo(() => {
    if (!latestReport?.imageHtml) return [];
    
    const imageHtml = latestReport.imageHtml;
    
    // Extract src attributes from img tags using a more robust regex
    const srcRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const images = [];
    let match;
    
    while ((match = srcRegex.exec(imageHtml)) !== null) {
      const src = match[1];
      if (src && src.trim()) {
        images.push(src.trim());
      }
    }
    
    return images;
  }, [latestReport]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Reset current image when images change
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [images]);

  if (loading) {
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>Scout Images</Typography>
        <Typography variant="body2" color="text.secondary">Loading scout images...</Typography>
      </Box>
    );
  }

  if (images.length === 0) {
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>Scout Images</Typography>
        <Typography variant="body2" color="text.secondary">No scout images available</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Scout Images {latestReport && `(${formatDate(latestReport.DateCreated)})`}
      </Typography>
      
      <Box sx={{ position: 'relative', maxWidth: 600, mx: 'auto' }}>
        <Card sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height={300}
            image={images[currentImageIndex]}
            alt={`Scout image ${currentImageIndex + 1}`}
            sx={{ objectFit: 'contain', bgcolor: '#f5f5f5' }}
            onError={(e) => {
              console.warn("Failed to load scout image:", images[currentImageIndex]);
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex'; // Show error message
            }}
          />
          
          {/* Error fallback */}
          <Box
            sx={{
              display: 'none',
              height: 300,
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f5f5f5',
              color: 'text.secondary',
              flexDirection: 'column'
            }}
          >
            <Typography variant="body2">Image failed to load</Typography>
            <Typography variant="caption" sx={{ mt: 1, wordBreak: 'break-all', px: 2, textAlign: 'center' }}>
              {images[currentImageIndex]}
            </Typography>
          </Box>
          
          {images.length > 1 && (
            <>
              {/* Previous Button */}
              <IconButton
                onClick={prevImage}
                sx={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                }}
              >
                <ArrowBackIosIcon />
              </IconButton>

              {/* Next Button */}
              <IconButton
                onClick={nextImage}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                }}
              >
                <ArrowForwardIosIcon />
              </IconButton>

              {/* Image Counter */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '0.75rem'
                }}
              >
                {currentImageIndex + 1} / {images.length}
              </Box>
            </>
          )}
        </Card>
      </Box>
    </Box>
  );
}

