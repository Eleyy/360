import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';          // ← mandatory

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN || "";

// Validate that the Mapbox token is available
if (!process.env.REACT_APP_MAPBOX_ACCESS_TOKEN) {
  console.error('Mapbox access token is missing. Please set REACT_APP_MAPBOX_ACCESS_TOKEN in your .env file.');
}

/** Create a red circle marker with direction indicator using canvas */
const createRedCircleMarker = (heading: number = 0) => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Draw white background circle
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    
    // Draw red circle
    ctx.beginPath();
    ctx.arc(16, 16, 10, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
    
    // Draw direction indicator (arrow)
    ctx.save();
    ctx.translate(16, 16);
    ctx.rotate((heading * Math.PI) / 180); // Convert degrees to radians
    
    // Draw arrow pointing up (will be rotated by heading)
    ctx.beginPath();
    ctx.moveTo(0, -8); // Arrow tip
    ctx.lineTo(-3, -2); // Left side
    ctx.lineTo(-1, -2); // Left inner
    ctx.lineTo(-1, 6);  // Left stem
    ctx.lineTo(1, 6);   // Right stem
    ctx.lineTo(1, -2);  // Right inner
    ctx.lineTo(3, -2);  // Right side
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    
    ctx.restore();
  }
  
  return canvas.toDataURL();
};

type Props = { lat: number; lon: number; heading: number };

export default function MiniMap({ lat, lon, heading }: Props) {
  const host   = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | undefined>(undefined);

  /* ---------- create map once ---------- */
  useEffect(() => {
    // Validate coordinates
    if (isNaN(lat) || isNaN(lon)) {
      console.log('Invalid coordinates detected:', { lat, lon });
      return;
    }

    if (!host.current || mapRef.current) return;


    mapRef.current = new mapboxgl.Map({
      container: host.current,
      style:     'mapbox://styles/mapbox/satellite-streets-v12',
      center:    [lon, lat],
      zoom:      18,
      minZoom:   15,
      maxZoom:   20,
      attributionControl: false,
      interactive: true
    });

    // Add zoom controls
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    /* wait until style is ready – solves "Style is not done loading" */  
    mapRef.current.on('load', () => {
      const markerDataUrl = createRedCircleMarker(heading);
      mapRef.current!.loadImage(markerDataUrl, (err, img) => {
        if (err || !img) {
          console.error('Failed to load marker image:', err);
          return;
        }
        if (!mapRef.current!.hasImage('marker')) {
          mapRef.current!.addImage('marker', img, { pixelRatio: 2 });
        }
        mapRef.current!.addSource('marker', {
          type: 'geojson',
          data: buildFeature(lon, lat, heading)
        });
        mapRef.current!.addLayer({
          id: 'marker',
          type: 'symbol',
          source: 'marker',
          layout: {
            'icon-image': 'marker',
            'icon-size': 2.0,
            'icon-allow-overlap': true
          }
        });
      });
    });

    mapRef.current.on('error', (e) => {
      console.error('Mapbox map error:', e);
    });
  }, [lon, lat, heading]);

  /* ---------- keep position & bearing in sync ---------- */
  useEffect(() => {
    // Validate coordinates
    if (isNaN(lat) || isNaN(lon)) {
      return;
    }

    if (!mapRef.current) return;
    
    // Update marker image with new heading
    const markerDataUrl = createRedCircleMarker(heading);
    mapRef.current.loadImage(markerDataUrl, (err, img) => {
      if (!err && img) {
        if (mapRef.current!.hasImage('marker')) {
          mapRef.current!.removeImage('marker');
        }
        mapRef.current!.addImage('marker', img, { pixelRatio: 2 });
      }
    });
    
    const src = mapRef.current.getSource('marker') as mapboxgl.GeoJSONSource;
    if (src) src.setData(buildFeature(lon, lat, heading));
    mapRef.current.easeTo({ center: [lon, lat], duration: 0 });
  }, [lat, lon, heading]);

  // Validate coordinates for rendering
  if (isNaN(lat) || isNaN(lon)) {
    return <div style={{ width: 300, height: 300, borderRadius: 8, backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Invalid coordinates
    </div>;
  }

  return <div ref={host} style={{ width: 300, height: 300, borderRadius: 8, backgroundColor: '#f0f0f0' }} />;
}

/* helper – single-point GeoJSON feature */
function buildFeature(lon: number, lat: number, bearing = 0) {
  return {
    type: 'FeatureCollection' as const,
    features: [{
      type: 'Feature' as const,
      properties: { bearing },
      geometry: { type: 'Point' as const, coordinates: [lon, lat] }
    }]
  };
}

